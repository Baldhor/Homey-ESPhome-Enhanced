'use strict';

/**
 * This class handle the connectivity through the native api between a physical device and the remote device.
 * 
 * Functions:
 * - new Client(driver): Create a new client object
 * 
 * Events:
 * - 'connected': The connection with the remote device is established
 * - 'disconnected': The connection with the remote device is lost (volunteer or not)
 * - 'stateChanged': a state has been received
 * 
 */
const Homey = require('homey');
const EventEmitter = require('events');
const PhysicalDevice = require('./physical-device');
const { Client: NativeApiClient } = require('@2colors/esphome-native-api');
const Utils = require('./utils');

// Delay used to reconnect if initilization is wrong (in seconds)
const NATIVE_API_RECONNECTION_DELAY = 30;

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
    encryptionKey = null;
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
     * @param {string} encryptionKey Encryption key
     * @param {string} password (Optionnal) password
     */
    constructor(physicalDevice, reconnect, ipAddress, port, encryptionKey, password) {
        // Check input
        Utils.assert(physicalDevice != null && typeof physicalDevice === 'object' && physicalDevice.constructor.name === 'PhysicalDevice', 'Physical device cannot be null or of wrong type');
        Utils.assert(reconnect != null && typeof reconnect === 'boolean', 'Connection mode cannot be null or of wrong type');
        Utils.assert(Utils.checkIfValidIpAddress(ipAddress), 'Wrong format of ip address:', ipAddress);
        Utils.assert(Utils.checkIfValidPortnumber(port), 'Wrong format of port:', port)

        super();

        this.physicalDevice = physicalDevice;

        this.ipAddress = ipAddress;
        this.port = port;
        this.encryptionKey = encryptionKey && encryptionKey !== '' ? encryptionKey : '';
        this.password = password && password !== '' ? password : '';

        this.log('Initializing:', {
            'ipAddress': ipAddress,
            'port': port,
            'encryptionKey': encryptionKey,
            'password': password
        });

        // We obviosuly expect to connect, so let's start
        this.expectConnected = true;
        this.reconnect = reconnect;
        this.abortController = new AbortController();
        this.processConnection();

        this.log('Created');
    }

    /**
     * This async function process the connection to the remote
     */
    async processConnection() {
        this.log('processConnection');

        // Make sure nothing is wrong
        if (!this.expectConnected) {
            this.error("Processing connection, but expected state is not 'Connected'");
            return;
        }

        // We need to create the native api client and attach the listeners
        if (this.nativeApiClient === null) {
            // Create native api client
            this.nativeApiClient = new NativeApiClient({
                host: this.ipAddress,
                port: this.port,
                encryptionKey: this.encryptionKey === '' ? null : this.encryptionKey,
                password: this.password === '' ? null : this.password,
                initializeSubscribeLogs: true, // We want logs, we like logs
                initializeListEntities: true, // We want the entities configuration²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²
                reconnect: true,
                clientInfo: 'homey'
            });

            // Add listener
            this.startRemoteListener();
        }

        // Connect (after the listener are added!)
        try {
            await this.nativeApiClient.connect();
        } catch (error) {
            this.error('Error while processing connection:', error);
        }
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
        this.nativeApiClient.on('initialized', () => this.initializedListener(), { signal: this.abortController.signal });
        this.nativeApiClient.on('disconnected', () => this.disconnectedListener(), { signal: this.abortController.signal });
        this.nativeApiClient.on('error', (error) => this.errorListener(error), { signal: this.abortController.signal });
        this.nativeApiClient.on('logs', (message) => this.logsListener(message), { signal: this.abortController.signal });
        this.nativeApiClient.on('newEntity', (entity) => this.newEntityListener(entity), { signal: this.abortController.signal });
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
        this.log('Connected and initialized:', this.nativeApiClient.deviceInfo);

        this.connected = true;
        this.emit('connected');
    }

    connectedListener() {
        this.log('Connected');
    }

    disconnectedListener() {
        this.log('Disconnected');

        this.connected = false;
        this.emit('disconnected');
    }

    errorListener(error) {
        this.error('Received an error:', error);

        this.connected = false;
        this.emit('disconnected');
    }

    logsListener(message) {
        this.log('Received a log:', message);
    }


    newEntityListener(entity) {
        this.log('Received a newentity:', entity);

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
        let entity = this.nativeApiClient.entities[entityId];
        Utils.assert(entity, 'Entity undefined');
        let entityType = entity.type;

        switch (entityType) {
            case 'Cover':
                switch (attribut) {
                    case 'position':
                        this.nativeApiClient.connection.coverCommandService({ key: entityId, position: newValue });
                        break;

                    case 'tilt':
                        this.nativeApiClient.connection.coverCommandService({ key: entityId, tilt: newValue });
                        break;

                    default:
                        // do nothing
                        break;
                }
                break;

            case 'Switch':
                this.nativeApiClient.connection.switchCommandService({ key: entityId, state: newValue });
                break;

            case 'Button':
                this.nativeApiClient.connection.buttonCommandService({ key: entityId, state: newValue });
                break;

            case 'Number':
                this.nativeApiClient.connection.numberCommandService({ key: entityId, state: newValue });
                break;

            case 'Light':
                switch (attribut) {
                    case 'state':
                        this.nativeApiClient.connection.lightCommandService({ key: entityId, state: newValue });
                        break;

                    case 'brightness':
                        this.nativeApiClient.connection.lightCommandService({ key: entityId, brightness: newValue });
                        break;

                    default:
                        // do nothing
                        break
                }
                break;

            case 'Select':
                this.nativeApiClient.connection.selectCommandService({ key: entityId, state: newValue });
                break;

            case 'Climate':
                switch (attribut) {
                    case 'mode':
                        this.nativeApiClient.connection.climateCommandService({ key: entityId, mode: newValue });
                        break;

                    case 'targetTemperature':
                        this.nativeApiClient.connection.climateCommandService({ key: entityId, targetTemperature: newValue });
                        break;

                    case 'targetTemperatureLow':
                        this.nativeApiClient.connection.climateCommandService({ key: entityId, targetTemperatureLow: newValue });
                        break;

                    case 'targetTemperatureHigh':
                        this.nativeApiClient.connection.climateCommandService({ key: entityId, targetTemperatureHigh: newValue });
                        break;

                    case 'fanMode':
                        this.nativeApiClient.connection.climateCommandService({ key: entityId, fanMode: newValue });
                        break;

                    case 'swingMode':
                        this.nativeApiClient.connection.climateCommandService({ key: entityId, swingMode: newValue });
                        break;

                    case 'customFanMode':
                        this.nativeApiClient.connection.climateCommandService({ key: entityId, customFanMode: newValue });
                        break;

                    case 'preset':
                        this.nativeApiClient.connection.climateCommandService({ key: entityId, preset: newValue });
                        break;

                    case 'customPreset':
                        this.nativeApiClient.connection.climateCommandService({ key: entityId, customPreset: newValue });
                        break;

                    default:
                        // do nothing
                        break
                }
                break;

            default:
                this.error('Unsopported entityType:', entityType);
                return;
        }

        this.log('Command sent to remote for entity', entityId, 'and attribut', attribut, '==>', newValue);
    }

    log(...args) {
        this.physicalDevice.log('[Client]', ...args);
    }

    error(...args) {
        this.physicalDevice.error('[Client]', ...args);
    }

    disconnect() {
        this.log('Disconnecting');

        this.expectConnected = false;
        this._disconnect();
    }

    async _disconnect() {
        this.log('_disconnect');

        if (this.nativeApiClient !== null) {
            let nativeApiClient = this.nativeApiClient;
            this.nativeApiClient = null;
            nativeApiClient.removeAllListeners();
            Object.keys(nativeApiClient.entities).forEach(entityId => { nativeApiClient.entities[entityId].removeAllListeners(); });
            try {
                await nativeApiClient.disconnect();
            } catch (error) {
                this.error('Error while processing disconnection:', error);
            }
        }
    }
}

module.exports = Client;
