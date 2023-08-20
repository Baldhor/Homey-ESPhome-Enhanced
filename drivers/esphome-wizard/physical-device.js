'use strict';

/**
 * This class represent a real world device with ESPhome software installed.
 * Its purpose is to convert the "ESPhome" world to "Homey" world and the opposite.
 * 
 * A physical device:
 * - Has a list of nativeCapability : built from the remote device newEntity message
 * - Emit stateChanged events when remote state change and captured by the virtual device
 * - Expose a sendCommand function to modify a nativeCapability value
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
const NativeCapability = require('./native-capability');
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
    nativeCapabilities = null;

    /**
     * Create a new ESPhome native api client and _start_ connection process
     * 
     * @param {Driver} driver Handle to the Driver for log context and retrieve configuration from driver
     * @param {boolean} reconnect Connection mode: connect once or reconnect
     * @param {string} ipAddress IP address
     * @param {string} port Port number
     * @param {string} encryptionKey Encryption key
     * @param {string} password (Optionnal) password
     */
    constructor(driver, reconnect, ipAddress, port, encryptionKey, password) {
        Utils.assert(driver != null && typeof driver === 'object' && driver.constructor.name === 'Driver', 'Driver cannot be null or of wrong type');
        Utils.assert(Utils.checkIfValidIpAddress(ipAddress), 'Wrong format of ip address:', ipAddress);
        Utils.assert(Utils.checkIfValidPortnumber(port), 'Wrong format of port:', port)

        super();
        this.driver = driver;
        this.id = PhysicalDevice.buildPhysicalDeviceId(ipAddress, port);
        this.nativeCapabilities = {};

        this.client = new Client(this, reconnect, ipAddress, port, encryptionKey, password);

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
            .on('stateChanged', (entityId, nativeCapability, value) => this.stateChangedListener(entityId, nativeCapability, value));
    }

    connectedListener() {
        this.log('Connected: available!');

        this.computeNativeCapabilities();

        this.emit('available');
    }

    computeConfigShowUI(entity, configs) {
        let showUI = true;
        if (entity.config.disabledByDefault !== null && typeof entity.config.disabledByDefault === 'boolean' && entity.config.disabledByDefault)
            showUI = false;
        if (!showUI)
            configs['showUI'] = showUI;
    }

    computeConfigDeviceClass(entity, configs) {
        let deviceClass = null;
        try {
            deviceClass = entity.config.deviceClass;
        } catch (e) {
            // do nothing
            this.log(e);
        }
        if (deviceClass && deviceClass !== '')
            configs['deviceClass'] = deviceClass;
    }

    computeConfigReadOnly(entity, configs) {
        configs['readOnly'] = true;
    }

    computeConfigWriteOnly(entity, configs) {
        configs['writeOnly'] = true;
    }

    computeConfigUsage(entity, configs) {
        if (entity.config.entityCategory === null && entity.config.entityCategory === 0) {
            // do nothing
        } else if (entity.config.entityCategory === 1) {
            configs['usage'] = 'setting';
        } else if (entity.config.entityCategory === 2) {
            configs['usage'] = 'diagnostic';
        }
    }

    computeConfigUnit(entity, configs) {
        if (entity.config.unitOfMeasurement !== null && entity.config.unitOfMeasurement !== '') {
            configs['unit'] = entity.config.unitOfMeasurement;
        }
    }
    
    computeConfigPrecision(entity, configs) {
        let precision = 0;
        try {
            if (entity.config.accuracyDecimals !== null) {
                let tmp = parseInt(entity.config.accuracyDecimals, 10);
                if (!isNaN(tmp) && tmp > 0)
                    precision = tmp;
            }
        } catch (e) {
            // do nothing
            this.log(e);
        }
        configs['precision'] = precision;
    }
    
    computeConstraintMode(entity, constraints) {
        let mode = 'box';
        if (entity.config.mode !== null && entity.config.mode === 2) {
            mode = 'slidder';
        }
        constraints['mode'] = mode;
    }

    computeConstraintMinMaxStep(entity, constraints) {
        // Get min
        if (entity.config.minValue === null || typeof entity.config.minValue !== 'number') {
            this.log('minValue is not a number:', typeof entity.config.minValue);
            return false;
        }
        let min = parseFloat(entity.config.minValue);

        // Get max
        if (entity.config.maxValue === null || typeof entity.config.maxValue !== 'number') {
            this.log('maxValue is not a number:', typeof entity.config.maxValue);
            return false;
        }
        let max = parseFloat(entity.config.maxValue);

        // Get step
        if (entity.config.step === null || typeof entity.config.step !== 'number') {
            this.log('step is not a number:', typeof entity.config.step);
            return false;
        }
        let step = parseFloat(entity.config.step);

        constraints['min'] = min;
        constraints['max'] = max;
        constraints['step'] = step;

        return true;
    }

    computeConfigPrecisionFromStepConstraint(entity, configs, constraints) {
        // Get the step
        let step = constraints.step;
        Utils.assert(step !== null, 'Step should be set beforehand:', constraints);

        // little stupid way to find it, but I don't know better one :)
        // Assuming step is a float (even if it is actually an integer)
        for (let i = 0; i <= 10; i++) {
            let stepMultiplied = step * i * 10;

            // For precision 0, we just use initial step value, not 0 :)
            if (i === 0) {
                stepMultiplied = step;
            }

            // Now we compare using double convert trick
            if (parseFloat(parseInt(stepMultiplied)) == stepMultiplied) {
                // Same result, it means the precision is correct!
                this.log('Found precision', i, 'for step', step);
                configs['precision'] = i;
                return;
            }
        }

        // We didn't find it
        this.log("Couldn't find precision for step:", step);
        configs['precision'] = 0;
    }

    computeNativeCapabilities() {
        // Reset existing capabilities
        // In case of reconnection, maybe the remote device behaviour changed, so it's better to restart from the ground up
        this.native_capabilities = {};

        // For each entities, based on its type, we need to identify the native capabilities
        Object.keys(this.client.nativeApiClient.entities).forEach(entityId => {
            let entity = this.client.nativeApiClient.entities[entityId];
            let configs = {};
            let constraints = {};
            let nativeCapability = null;

            // TODO: Add more supported device type here
            switch (entity.type) {
                case 'BinarySensor':
                    // Has a state, but cannot be modified
                    this.computeConfigShowUI(entity, configs);
                    this.computeConfigDeviceClass(entity, configs);
                    this.computeConfigUsage(entity, configs);
                    this.computeConfigReadOnly(entity, configs);
                    nativeCapability = new NativeCapability(entityId, entity.config.name, entity.type, 'state', configs, constraints);
                    this.nativeCapabilities[nativeCapability.getId()] = nativeCapability;
                    break;

                case 'Button':
                    // Has no state, but can be modified
                    this.computeConfigShowUI(entity, configs);
                    this.computeConfigDeviceClass(entity, configs);
                    this.computeConfigUsage(entity, configs);
                    this.computeConfigWriteOnly(entity, configs);
                    nativeCapability = new NativeCapability(entityId, entity.name, entity.type, 'state', configs, constraints);
                    this.nativeCapabilities[nativeCapability.getId()] = nativeCapability;
                    break;

                case 'Cover':
                    // Has 2 states (position and tilt), and can be modified
                    this.computeConfigShowUI(entity, configs);
                    this.computeConfigDeviceClass(entity, configs);
                    this.computeConfigUsage(entity, configs);
                    // Add of a unit config is useless and confusing, it's float between 0 (closed) and 1 (open)
                    // In the UI, it is shown as a %
                    if (entity.config.supportsPosition && entity.config.supportsPosition) {
                        nativeCapability = new NativeCapability(entityId, entity.name, entity.type, 'position', configs, constraints);
                        this.nativeCapabilities[nativeCapability.getId()] = nativeCapability;
                    }
                    if (entity.config.supportsTilt && entity.config.supportsTilt) {
                        nativeCapability = new NativeCapability(entityId, entity.name, entity.type, 'tilt', configs, constraints);
                        this.nativeCapabilities[nativeCapability.getId()] = nativeCapability;
                    }
                    break;

                case 'Number':
                    // Has a state and can be modified
                    // Can have a unit and precision
                    // Has constraints : min, max, step and mode => those are mandatory
                    // Precision is calculated based on the step (a step of 0.3 means a precision of 1)
                    this.computeConfigShowUI(entity, configs);
                    this.computeConfigDeviceClass(entity, configs);
                    this.computeConfigUsage(entity, configs);
                    this.computeConfigUnit(entity, configs);
                    this.computeConstraintMode(entity, constraints);
                    if (!this.computeConstraintMinMaxStep(entity, constraints)) {
                        this.log('MinMaxStep missing for Number entity!');
                        break;
                    }
                    this.log('Constraints after minMaxStep:', constraints);
                    this.computeConfigPrecisionFromStepConstraint(entity, configs, constraints);
                    nativeCapability = new NativeCapability(entityId, entity.name, entity.type, 'state', configs, constraints);
                    this.nativeCapabilities[nativeCapability.getId()] = nativeCapability;
                    break;
            
                case 'Sensor':
                    // Has a state, but cannot be modified
                    // Has a unit and precision
                    this.computeConfigShowUI(entity, configs);
                    this.computeConfigDeviceClass(entity, configs);
                    this.computeConfigUsage(entity, configs);
                    this.computeConfigReadOnly(entity, configs);
                    this.computeConfigUnit(entity, configs);
                    this.computeConfigPrecision(entity, configs);
                    nativeCapability = new NativeCapability(entityId, entity.name, entity.type, 'state', configs, constraints);
                    this.nativeCapabilities[nativeCapability.getId()] = nativeCapability;
                    break;
                
                case 'Switch':
                    // Has a state and can be modified
                    this.computeConfigShowUI(entity, configs);
                    this.computeConfigDeviceClass(entity, configs);
                    this.computeConfigUsage(entity, configs);
                    nativeCapability = new NativeCapability(entityId, entity.name, entity.type, 'state', configs, constraints);
                    this.nativeCapabilities[nativeCapability.getId()] = nativeCapability;
                    break;
                
                case 'TextSensor':
                    // Has a state, but cannot be modified
                    this.computeConfigShowUI(entity, configs);
                    this.computeConfigDeviceClass(entity, configs);
                    this.computeConfigUsage(entity, configs);
                    this.computeConfigReadOnly(entity, configs);
                    nativeCapability = new NativeCapability(entityId, entity.name, entity.type, 'state', configs, constraints);
                    this.nativeCapabilities[nativeCapability.getId()] = nativeCapability;
                    break;
                
                default:
                    // Unhandled entity type
                    this.log('Found unhandled entity type:', entity);
            }
        });

        this.log('Native capabilities computed:', this.nativeCapabilities);
    }

    disconnectedListener() {
        this.log('Disconnected: unavailable!');

        this.emit('unavailable');
    }

    stateChangedListener(entityId, attribut, value) {
        this.log('State received:', ...arguments);

        let nativeCapability = this.nativeCapabilities[NativeCapability.buildId(entityId, attribut)];
        this.log('Native capability:', nativeCapability);
        if (!nativeCapability) {
            this.log('Unknown native capability, ignoring:', ...arguments);
            return;
        }

        // Check if writeOnly (just to detect unexpected issues)
        if (nativeCapability.getConfig('writeOnly')) {
            this.log('Received an unexpected stateChanged event for a writeOnly native capability:', ...arguments);
        }

        // Save new value
        nativeCapability.setValue(value);

        this.log('Emit event stateChanged', nativeCapability.getId(), value);
        this.emit('stateChanged', nativeCapability.getId(), value);
    }

    getCurrentValue(nativeCapabilityId) {
        this.log('Get current value:', nativeCapabilityId);

        let nativeCapability = this.nativeCapabilities[nativeCapabilityId];
        return nativeCapability ? nativeCapability.getValue() : null;
    }

    sendCommand(nativeCapabilityId, newValue) {
        this.log('Sending command:', ...arguments);

        let nativeCapability = this.nativeCapabilities[nativeCapabilityId];
        if (!nativeCapability) {
            this.log('Unknown native capability, ignoring:', ...arguments);
            return;
        }

        // Check if readOnly (just to detect unexpected issues)
        if (nativeCapability.getConfig('readOnly')) {
            this.log('Received an unexpected command for a readOnly native capability:', ...arguments);
            return;
        }

        // TODO:
        // We do not modify the native capability value, we should receive a stateChanged event soon enough
        // Maybe later, we will support optimistic mode

        // Sending ...
        this.client.sendCommand(nativeCapability.entityId, nativeCapability.attribut, newValue);
    }

    log(...args) {
        this.driver.log('[PhysicalDevice:' + this.id + ']', ...args);
    }
}

module.exports = PhysicalDevice;
