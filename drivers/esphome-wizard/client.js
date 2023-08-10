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
const { PhysicalDevice } = require('./physical-device');
const { NativeApiClient } = require('@2colors/esphome-native-api');
const { Utils } = require('./utils');

const ClientState = Object.freeze({
    Disconnected: Symbol("disconnected"),
    Connected: Symbol("connected")
});

const ClientConnectionMode = Object.freeze({
    ConnectOnce: Symbol("connectonce"),
    Reconnect: Symbol("reconnect")
});

// Delay used to reconnect if initilization is wrong
const NATIVE_API_RECONNECTION_DELAY = 3000;

// Some attributs can/should be ignored
const ATTRIBUTS_TO_IGNORE_PER_TYPE = Object.freeze({
    'Cover': ['legacyState'] // Deprecated
});

class Client extends EventEmitter {
    physicalDevice = null;

    ipAddress = null;
    port = null;
    password = null;

    expectedState = ClientState.Disconnected;
    connectionMode = ClientConnectionMode.Reconnect;
    state = ClientState.Disconnected;

    nativeApiClient = null;

    /**
     * Create a new ESPhome native api client and _start_ connection process
     * 
     * @param {PhysicalDevice} physicalDevice Handle to the Driver for log context
     * @param {ClientConnectionMode} connectionMode Connection mode: connect once or reconnect
     * @param {string} ipAddress IP address
     * @param {string} port Port number
     * @param {string} password (Optionnal) password
     */
    constructor(physicalDevice, connectionMode, ipAddress, port, password) {
        // Check input
        Utils.assert(physicalDevice != null && typeof physicalDevice === 'object' && physicalDevice.constructor.name === 'PhysicalDevice', 'Physical device cannot be null or of wrong type');
        Utils.assert(connectionMode != null && typeof connectionMode === 'symbol' && ClientConnectionMode.values().include(connectionMode), 'Connection mode cannot be null or of wrong type');
        Utils.assert(Utils.checkIfValidIpAddress(ipAddress), 'Wrong format of ip address:', ipAddress);
        Utils.assert(Utils.checkIfValidPortnumber(port), 'Wrong format of port:', port)

        super();

        this.physicalDevice = physicalDevice;

        this.ipAddress = ipAddress;
        this.port = port;
        this.password = password && password !== '' ? password : '';

        this.log('Client initializing:', ipAdress, port, password !== '' ? '<password hidden>' : '<no password>');

        // We obviosuly expect to connect, so let's start
        this.expectedState = ClientState.Connected;
        this.connectionMode = ClientConnectionMode.ConnectOnce;
        this.processConnection();

        this.log('Client created');
    }

    /**
     * This async function process the connection to the remote
     */
    async processConnection() {
        // Make sure nothing is wrong
        if (this.expectedState != ClientState.Connected) {
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
                reconnect: this.connectionMode === ClientConnectionMode.Reconnect,
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

    initializedListener() {
        this.log('Connected:', this.deviceInfo);

        this.state = ClientState.Connected;
        this.emit('connected');
    }

    disconnectedListener() {
        this.log('Disconnected');

        this.state = ClientState.Disconnected;
        this.emit('disconnected');
    }

    errorListener(error) {
        this.log('Received an error:', error);
    }

    logsListener(message) {
        this.log('Received a log:', message);
    }


    newEntityListener(entity) {
        this.log('Received a newentity:', entity);
        startRemoteEntityListener(entity.id);
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
        let entity = this.client.nativeApiClient.entities[entityId];
        Utils.assert(entity, 'Entity undefined');
        let entityType = entity.type;

        // List of attributs to ignore
        let attributsToIgnore = ATTRIBUTS_TO_IGNORE_PER_TYPE[entityType];
        attributsToIgnore = attributsToIgnore ? attributsToIgnore : [];

        // Emit all state attibuts separatly
        Object.keys(state).forEach((element) => {
            if (element === 'key')
                return;

            if (attributsToIgnore.includes(element))
                return;

            this.log('Emit event:', 'state.' + element, entityId, state.element);
            this.emit('stateChanged', entityId, 'state.' + element, state.element);
        });
    }

    /**
     * Send a command to the remote device
     * 
     * @param {*} entityId Identifier of the entity
     * @param {*} native_capability native_capability in the format: state.<remote_attribut>
     * @param {*} newValue The new value to set
     */
    sendCommand(entityId, native_capability, newValue) {
        this.log('Sending command to remote for entity', entityId, ':', native_capability, '==', newValue);

        // Retrieve entity type
        let entity = this.client.nativeApiClient.entities[entityId];
        Utils.assert(entity, 'Entity undefined');
        let entityType = entity.type;

        switch (entityType) {
            case 'Cover':
                if (native_capability.startsWith('position.'))
                    this.nativeApiClient.connection.coverCommandService({ key: entityId, position: newValue });
                else if (native_capability.startsWith('tilt.'))
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
        }

        this.log('Command sent to remote for entity', entityId, ':', native_capability, '==', newValue);
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

            entities.push(entity);
        });

        this.log('Built config:', entities);

        return entities;
    }

    log(...args) {
        this.physicalDevice.log('Client', ...args);
    }

    disconnect() {
        this.log('Client disconnecting');

        this.expectedState = ClientState.Disconnected;
        this.nativeApiClient.disconnect();

        this.log('Client disconnected');
    }
}

module.exports = Client;
