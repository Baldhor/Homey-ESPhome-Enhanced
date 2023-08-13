'use strict';

// Completion: 80% but untested, missing getConfig function

/**
 * This class handle the connectivity through the native api between a physical device and the remote device.
 * 
 * Functions:
 * - new Client(driver): Create a new client object
 * - init(ipAddress, port, [password]): init the connection to a remote device
 * - reinit(ipAddress, port, [password]): change the connection parameters to a remote device, it may trigger the 'disconnected' event
 * - 
 * Events:
 * - 'connected': The connection with the remote device is established
 * - 'disconnected': The connection with the remote device is lost (volunteer or not)
 * - 'stateChanged': a state has been received
 * 
 */
const EventEmitter = require('events');
const PhysicalDevice = require('./physical-device');
const { Client : NativeApiClient } = require('@2colors/esphome-native-api');
const Utils = require('./utils');

// Delay used to reconnect if initilization is wrong
const NATIVE_API_RECONNECTION_DELAY = 3000;

// Some attributs can/should be ignored
const ATTRIBUTS_TO_IGNORE_PER_TYPE = Object.freeze({
    'Cover': ['legacyState'] // Deprecated
});
const ATTRIBUTS_TO_IGNORE = Object.freeze([
    'missingState'
]);

class Client extends EventEmitter {
    physicalDevice = null;

    ipAddress = null;
    port = null;
    password = null;

    reconnect = true;
    expectConnected = false;
    connected = false;

    nativeApiClient = null;

    /**
     * Create a new ESPhome native api client and _start_ connection process
     * 
     * @param {PhysicalDevice} physicalDevice Handle to the Driver for log context
     * @param {boolean} reconnect Connection mode: connect once or reconnect
     * @param {string} ipAddress IP address
     * @param {string} port Port number
     * @param {string} password (Optionnal) password
     */
    constructor(physicalDevice, reconnect, ipAddress, port, password) {
        // Check input
        Utils.assert(physicalDevice != null && typeof physicalDevice === 'object' && physicalDevice.constructor.name === 'PhysicalDevice', 'Physical device cannot be null or of wrong type');
        Utils.assert(reconnect != null && typeof reconnect === 'boolean', 'Connection mode cannot be null or of wrong type');
        Utils.assert(Utils.checkIfValidIpAddress(ipAddress), 'Wrong format of ip address:', ipAddress);
        Utils.assert(Utils.checkIfValidPortnumber(port), 'Wrong format of port:', port)

        super();

        this.physicalDevice = physicalDevice;

        this.ipAddress = ipAddress;
        this.port = port;
        this.password = password && password !== '' ? password : '';

        this.log('Initializing:', ipAddress, port, password !== '' ? '<password hidden>' : '<no password>');

        // We obviosuly expect to connect, so let's start
        this.expectConnected = true;
        this.reconnect = reconnect;
        this.processConnection();

        this.log('Created');
    }

    /**
     * This async function process the connection to the remote
     */
    async processConnection() {
        // Make sure nothing is wrong
        if (!this.expectConnected) {
            this.log("Processing connection, but expected state is not 'Connected'");
            return;
        }

        // If first time, we need to create the native api client and attach the listeners
        if (this.nativeApiClient == null) {
            // Create native api client
            this.nativeApiClient = new NativeApiClient({
                host: this.ipAddress,
                port: this.port,
                initializeSubscribeLogs: true, // We want logs, we like logs
                initializeListEntities: true, // We want the entities configuration²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²
                reconnect: this.reconnect,
                clientInfo: 'homey'
            });

            // Add listener
            this.startRemoteListener();
        }

        // Connect (after the listener are added!)
        this.nativeApiClient.connect();
    }

    /**
     * Start all the remote listener
     * 
     * Exepect event from remote:
     * - initialized: aka connected
     * - disconnected
     * - error(error): unsure its use case, but we can consider connection as lost
     * - logs(message)
     * - newEntity(entity)
     */
    startRemoteListener() {
        this.nativeApiClient
            .on('initialized', () => this.initializedListener())
            .on('disconnected', () => this.disconnectedListener())
            .on('error', (error) => this.errorListener(error))
            .on('logs', (message) => this.logsListener(message))
            .on('newEntity', (entity) => this.newEntityListener(entity));
    }

    /**
     * deviceInfo : {
     *     usesPassword: false,
     *     name: 'volet_1er_cuisine',
     *     macAddress: '4C:EB:D6:D9:36:08',
     *     esphomeVersion: '2023.7.0-dev',
     *     compilationTime: 'Aug  7 2023, 20:29:27',
     *     model: 'esp8285',
     *     hasDeepSleep: false,
     *     projectName: 'baldhor.athom_sw03_time_based_cover',
     *     projectVersion: '1.0.0',
     *     webserverPort: 80,
     *     bluetoothProxyVersion: 0,
     *     manufacturer: 'Espressif',
     *     friendlyName: 'Volet 1er Cuisine'
     * }
     */
    initializedListener() {
        this.log('Connected:', this.nativeApiClient.deviceInfo);

        this.connected = true;
        this.emit('connected');
    }

    disconnectedListener() {
        this.log('Disconnected');

        this.connected = false;
        this.emit('disconnected');
    }

    errorListener(error) {
        this.log('Received an error:', error);

        this.connected = false;
        this.emit('disconnected');
    }

    logsListener(message) {
        this.log('Received a log:', message);
    }


    newEntityListener(entity) {
        this.log('Received a newentity');

        this.startRemoteEntityListener(entity.id);
    }

    /**
     * Start all the remote entity listener
     * 
     * Exepect event from remote entity:
     * - entity.state(state)
     * 
     * @param {string} entityId Unique identifier of the entity
     */
    startRemoteEntityListener(entityId) {
        this.nativeApiClient.entities[entityId]
            .on('state', (state) => this.remoteEntityStateListener(entityId, state));
    }

    /**
     * This function process state events from the client
     * 
     * We want to filter out some useless data
     * And we want to emit separate events for each data
     * 
     * @param {*} entityId Identifier of the entity
     * @param {*} state State structure, may be different from one entity type to another, refer to readme.md
     */
    remoteEntityStateListener(entityId, state) {
        this.log('Received state for entity', entityId, ':', state);

        // Retrieve entity type
        let entity = this.nativeApiClient.entities[entityId];
        Utils.assert(entity, 'Entity undefined');
        let entityType = entity.type;

        // List of attributs to ignore
        let attributsToIgnore = ATTRIBUTS_TO_IGNORE_PER_TYPE[entityType];
        attributsToIgnore = attributsToIgnore ? attributsToIgnore : [];
        attributsToIgnore = [].concat(attributsToIgnore, ATTRIBUTS_TO_IGNORE);

        // Emit all state attibuts separatly
        Object.keys(state).forEach((attribut) => {
            if (attribut === 'key')
                return;

            if (attributsToIgnore.includes(attribut))
                return;

            this.log('Emit event:', 'stateChanged', entityId, attribut, state[attribut]);
            this.emit('stateChanged', entityId, attribut, state[attribut]);
        });
    }

    /**
     * Send a command to the remote device
     * 
     * @param {*} entityId Identifier of the entity
     * @param {*} attribut Attribut to modify
     * @param {*} newValue The new value to set
     */
    sendCommand(entityId, attribut, newValue) {
        this.log('Sending command to remote for entity', entityId, 'and attribut', attribut, '==>', newValue);

        // Retrieve entity type
        let entity = this.client.nativeApiClient.entities[entityId];
        Utils.assert(entity, 'Entity undefined');
        let entityType = entity.type;

        switch (entityType) {
            case 'Cover':
                if (attribut === 'position')
                    this.nativeApiClient.connection.coverCommandService({ key: entityId, position: newValue });
                else if (attribut === 'tilt')
                    this.nativeApiClient.connection.coverCommandService({ key: entityId, tilt: newValue });
                break;

            case 'Switch':
                this.nativeApiClient.connection.switchCommandService({ key: entityId, state: newValue });
                break;

            case 'Button':
                this.client.connection.buttonCommandService({ key: entityId, state: newValue });
                break;

            case 'Number':
                this.client.connection.buttonCommandService({ key: entityId, state: newValue });
                break;

            default:
                this.log('Unsopported entityType:', entityType);
                return;
        }

        this.log('Command sent to remote for entity', entityId, 'and attribut', attribut, '==>', newValue);
    }

    /**
     * Return the configuration of the remove device as known from the native api client
     * 
     * Build list of entities, including:
     * - id
     * - name
     * - type
     * - options
     * - state
     */
    getConfig() {
        this.log('Build config');

        let config = [];

        this.nativeApiClient.entities.forEach(element => {
            let entity = {};

            entity.id = element.id;
            entity.name = element.name;
            entity.type = element.type;
            entity.options = {};
            entity.state = state;

            config.push(entity);
        });

        this.log('Built config:', config);

        return config;
    }

    log(...args) {
        this.physicalDevice.log('[Client]', ...args);
    }

    disconnect() {
        this.log('Disconnecting');

        this.expectConnected = false;
        this.nativeApiClient.disconnect();
    }
}

module.exports = Client;
