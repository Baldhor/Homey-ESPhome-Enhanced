'use strict';

/**
 * This class represent a real world device with ESPhome software installed.
 * Its purpose is to convert the "ESPhome" world to "Homey" world and the opposite.
 * 
 * A physical device:
 * - Has a list of native_capability : built from the remote device newEntity message
 * - Emit native_capability events when remote state change and captured by the virtual device
 * - Expose a sendCommand function to modify a native_capability value
 * - Expose a function to retrieve the remote configuration (used by the wizard)
 * 
 * A Physical device has no idea which native capabilities are used, by which virtual device and for which purpose
 * 
 * Keep in mind:
 * Many virtual device can be linked to a single physical device.
 * But the opposite is not true, a virtual device can be linked to only one physical device.
 * Only the virtual device knows to which physical device is is linked
 */
const EventEmitter = require('events');
const Driver = require('./driver');
const Client = require('./client');
const Utils = require('./utils');

class PhysicalDevice extends EventEmitter {
    id = null;

    driver = null;
    client = null;

    /**
     * Map of native capabilities
     * A native capability is:
     * {
     *     entityId : <unique identifier>,
     *     state : <unique name of the entity attribut>,
     *     value : current value for the state
     * }
     * 
     * The key is built using: <entityId+":"+state>
     */
    native_capabilities = null;


    /**
     * Create a new ESPhome native api client and _start_ connection process
     * 
     * @param {Driver} driver Handle to the Driver for log context and retrieve configuration from driver
     * @param {boolean} reconnect Connection mode: connect once or reconnect
     * @param {string} ipAddress IP address
     * @param {string} port Port number
     * @param {string} password (Optionnal) password
     */
    constructor(driver, reconnect, ipAddress, port, password) {
        Utils.assert(driver != null && typeof driver === 'object' && driver.constructor.name === 'Driver', 'Driver cannot be null or of wrong type');
        Utils.assert(Utils.checkIfValidIpAddress(ipAddress), 'Wrong format of ip address:', ipAddress);
        Utils.assert(Utils.checkIfValidPortnumber(port), 'Wrong format of port:', port)

        super();
        this.driver = driver;
        this.id = PhysicalDevice.buildPhysicalDeviceId(ipAddress, port);
        this.native_capabilities = new Map();

        this.client = new Client(this, reconnect, ipAddress, port, password);

        // Add listener
        this.startClientListener();
    }

    static buildPhysicalDeviceId(ipAddress, port) {
        return ipAddress + ':' + port;
    }

    /**
      * Start all the client listener
      * 
      * Exepect event from remote:
      * - connected
      * - disconnected
      * - state
      * - 
      */
    startClientListener() {
        this.client
            .on('connected', () => this.connectedListener())
            .on('disconnected', () => this.disconnectedListener())
            .on('stateChanged', (entityId, native_capability, value) => this.stateChangedListener(entityId, native_capability, value));
    }

    connectedListener() {
        this.log('Connected: available!');

        this.emit('available');
    }

    disconnectedListener() {
        this.log('Disconnected: unavailable!');

        this.emit('unavailable');
    }

    stateChangedListener(entityId, native_capability, value) {
        this.log('State received');

        let entityState = this.native_capabilities[entityId];
        if (!entityState) {
            entityState = new Map();
            this.native_capabilities[entityId] = entityState;
        }

        // Value changed or not we need to propagate
        entityState[native_capability] = value;
        this.emit('stateChanged.' + entityId + '.' + native_capability, value);
    }

    sendCommand(entityId, native_capability, newValue) {
        this.log('Sending command:', ...args);
        this.client.sendCommand(...args);
    }

    log(...args) {
        this.driver.log('[PhysicalDevice:' + this.id + ']', ...args);
    }
}

module.exports = PhysicalDevice;
