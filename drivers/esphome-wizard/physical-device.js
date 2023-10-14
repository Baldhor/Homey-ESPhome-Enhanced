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
    name = null;

    driver = null;
    client = null;

    available = false;

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
     * @param {string} name Name of the physical device
     * @param {string} ipAddress IP address
     * @param {string} port Port number
     * @param {string} encryptionKey Encryption key
     * @param {string} password (Optionnal) password
     */
    constructor(driver, reconnect, physicalDeviceId, name, ipAddress, port, encryptionKey, password) {
        Utils.assert(driver != null && typeof driver === 'object' && driver.constructor.name === 'Driver', 'Driver cannot be null or of wrong type');
        Utils.assert(Utils.checkIfValidIpAddress(ipAddress), 'Wrong format of ip address:', ipAddress);
        Utils.assert(Utils.checkIfValidPortnumber(port), 'Wrong format of port:', port)

        super();
        this.driver = driver;
        this.id = physicalDeviceId;
        this.name = name;
        this.nativeCapabilities = {};

        this.client = new Client(this, reconnect, ipAddress, port, encryptionKey, password);

        // Add listener
        this.startClientListener();
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
            .on('stateChanged', (entityId, attribut, value) => this.stateChangedListener(entityId, attribut, value));
    }

    connectedListener() {
        this.log('Connected: available!');

        this.computeNativeCapabilities();

        this.available = true;
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
            this.error('minValue is not a number:', typeof entity.config.minValue);
            return false;
        }
        let min = parseFloat(entity.config.minValue);

        // Get max
        if (entity.config.maxValue === null || typeof entity.config.maxValue !== 'number') {
            this.error('maxValue is not a number:', typeof entity.config.maxValue);
            return false;
        }
        let max = parseFloat(entity.config.maxValue);

        // Get step
        if (entity.config.step === null || typeof entity.config.step !== 'number') {
            this.error('step is not a number:', typeof entity.config.step);
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

        // We didn't find it, but it's not an error
        this.log("Couldn't find precision for step:", step);
        configs['precision'] = 0;
    }

    computeNativeCapabilities() {
        this.log('computeNativeCapabilities');

        // Reset existing capabilities
        // In case of reconnection, maybe the remote device behaviour changed, so it's better to restart from the ground up
        this.native_capabilities = {};

        // For each entities, based on its type, we need to identify the native capabilities
        Object.keys(this.client.nativeApiClient.entities).forEach(entityId => {
            this.log('computeNativeCapability for entityId', entityId + ':', this.client.nativeApiClient.entities[entityId]);

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
                    constraints.type = 'boolean';
                    nativeCapability = new NativeCapability(entityId, entity.config.name, entity.type, 'state', configs, constraints, null);
                    this.nativeCapabilities[nativeCapability.getId()] = nativeCapability;
                    break;

                case 'Button':
                    // Has no state, but can be modified
                    this.computeConfigShowUI(entity, configs);
                    this.computeConfigDeviceClass(entity, configs);
                    this.computeConfigUsage(entity, configs);
                    this.computeConfigWriteOnly(entity, configs);
                    constraints.type = 'boolean';
                    nativeCapability = new NativeCapability(entityId, entity.name, entity.type, 'state', configs, constraints, null);
                    this.nativeCapabilities[nativeCapability.getId()] = nativeCapability;
                    break;

                case 'Cover':
                    // Has 2 states (position and tilt), and can be modified
                    // Cover can be of subtype template:
                    //     In such case, the cover doesn't support either position or tilt
                    //     but in practice, the position attribut is used in both stateChanged and command ...
                    this.computeConfigShowUI(entity, configs);
                    this.computeConfigDeviceClass(entity, configs);
                    this.computeConfigUsage(entity, configs);
                    constraints.type = 'number';
                    // Add of a unit config is useless and confusing, it's float between 0 (closed) and 1 (open)
                    // In the UI, it is shown as a %
                    if (entity.config.supportsPosition) {
                        nativeCapability = new NativeCapability(entityId, entity.name, entity.type, 'position', configs, constraints, null);
                        this.nativeCapabilities[nativeCapability.getId()] = nativeCapability;
                    }
                    if (entity.config.supportsTilt) {
                        nativeCapability = new NativeCapability(entityId, entity.name, entity.type, 'tilt', configs, constraints, null);
                        this.nativeCapabilities[nativeCapability.getId()] = nativeCapability;
                    }
                    if (!entity.config.supportsPosition && !entity.config.supportsTilt) {
                        // Template cover case!
                        nativeCapability = new NativeCapability(entityId, entity.name, entity.type, 'position', configs, constraints, 'templateCover');
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
                    constraints.type = 'number';
                    if (!this.computeConstraintMinMaxStep(entity, constraints)) {
                        this.error('MinMaxStep missing for Number entity!');
                        break;
                    }
                    this.log('Constraints after minMaxStep:', constraints);
                    this.computeConfigPrecisionFromStepConstraint(entity, configs, constraints);
                    nativeCapability = new NativeCapability(entityId, entity.name, entity.type, 'state', configs, constraints, null);
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
                    constraints.type = 'number';
                    nativeCapability = new NativeCapability(entityId, entity.name, entity.type, 'state', configs, constraints, null);
                    this.nativeCapabilities[nativeCapability.getId()] = nativeCapability;
                    break;

                case 'Switch':
                    // Has a state and can be modified
                    this.computeConfigShowUI(entity, configs);
                    this.computeConfigDeviceClass(entity, configs);
                    this.computeConfigUsage(entity, configs);
                    constraints.type = 'boolean';
                    nativeCapability = new NativeCapability(entityId, entity.name, entity.type, 'state', configs, constraints, null);
                    this.nativeCapabilities[nativeCapability.getId()] = nativeCapability;
                    break;

                case 'TextSensor':
                    // Has a state, but cannot be modified
                    this.computeConfigShowUI(entity, configs);
                    this.computeConfigDeviceClass(entity, configs);
                    this.computeConfigUsage(entity, configs);
                    this.computeConfigReadOnly(entity, configs);
                    constraints.type = 'string';
                    nativeCapability = new NativeCapability(entityId, entity.name, entity.type, 'state', configs, constraints, null);
                    this.nativeCapabilities[nativeCapability.getId()] = nativeCapability;
                    break;

                case 'Select':
                    if (entity.config.optionsList.length > 0 && this._checkAllValuesAreString(entity.config.optionsList)) {
                        this.computeConfigShowUI(entity, configs);
                        this.computeConfigDeviceClass(entity, configs);
                        this.computeConfigUsage(entity, configs);
                        constraints.type = 'string';
                        constraints.values = [...entity.config.optionsList];
                        nativeCapability = new NativeCapability(entityId, entity.name, entity.type, 'state', configs, constraints, null);
                        this.nativeCapabilities[nativeCapability.getId()] = nativeCapability;
                    }
                    break;

                case 'Climate':
                    this.computeConfigShowUI(entity, configs);
                    this.computeConfigDeviceClass(entity, configs);
                    this.computeConfigUsage(entity, configs);

                    // There are many native capabilities

                    // currentTemperature
                    let currentTemperatureConfigs = Object.assign({}, configs);
                    this.computeConfigPrecision(entity, currentTemperatureConfigs);
                    this.computeConfigReadOnly(entity, currentTemperatureConfigs);
                    let currentTemperatureConstraints = Object.assign({}, constraints);
                    currentTemperatureConstraints.type = 'number';
                    nativeCapability = new NativeCapability(entityId, entity.name, entity.type, 'currentTemperature', currentTemperatureConfigs, currentTemperatureConstraints, null);
                    this.nativeCapabilities[nativeCapability.getId()] = nativeCapability;

                    // common targetTemperature, targetTemperatureLow and targetTemperatureHigh constraints
                    let targetTemperatureConstraints = Object.assign({}, constraints);
                    targetTemperatureConstraints['min'] = entity.config.target_temperature_low;
                    targetTemperatureConstraints['max'] = entity.config.target_temperature_high;
                    targetTemperatureConstraints['step'] = entity.config.visualTargetTemperatureStep;
                    targetTemperatureConstraints.type = 'number';

                    // targetTemperature
                    if (!entity.config.supportsTwoPointTargetTemperature) {
                        nativeCapability = new NativeCapability(entityId, entity.name, entity.type, 'targetTemperature', configs, targetTemperatureConstraints, null);
                        this.nativeCapabilities[nativeCapability.getId()] = nativeCapability;
                    }

                    // targetTemperatureLow and targetTemperatureHigh
                    if (entity.config.supportsTwoPointTargetTemperature) {
                        nativeCapability = new NativeCapability(entityId, entity.name, entity.type, 'targetTemperatureLow', configs, targetTemperatureConstraints, null);
                        this.nativeCapabilities[nativeCapability.getId()] = nativeCapability;

                        nativeCapability = new NativeCapability(entityId, entity.name, entity.type, 'targetTemperatureHigh', configs, targetTemperatureConstraints, null);
                        this.nativeCapabilities[nativeCapability.getId()] = nativeCapability;
                    }

                    // mode
                    if (entity.config.supportedModesList.length > 0) {
                        let modeConstraints = Object.assign({}, constraints);
                        modeConstraints.values = [];
                        // Need to convert the numerical values to string
                        entity.config.supportedModesList.forEach(e => modeConstraints.values.push(['off', "heat_cool", "cool", "heat", "fan_only", "dry", "auto"][e]));
                        modeConstraints.type = 'string';
                        nativeCapability = new NativeCapability(entityId, entity.name, entity.type, 'mode', configs, modeConstraints, null);
                        this.nativeCapabilities[nativeCapability.getId()] = nativeCapability;
                    }

                    // swingMode
                    if (entity.config.supportedSwingModesList.length > 0 && this._checkAllValuesAreString(entity.config.supportedSwingModesList)) {
                        let swingModeConstraints = Object.assign({}, constraints);
                        swingModeConstraints.values = [...entity.config.supportedSwingModesList];
                        swingModeConstraints.type = 'string';
                        nativeCapability = new NativeCapability(entityId, entity.name, entity.type, 'swingMode', configs, swingModeConstraints, null);
                        this.nativeCapabilities[nativeCapability.getId()] = nativeCapability;
                    }

                    // fanMode
                    if (entity.config.supportedFanModesList.length > 0 && this._checkAllValuesAreString(entity.config.supportedFanModesList)) {
                        let fanModeConstraints = Object.assign({}, constraints);
                        fanModeConstraints.values = [...entity.config.supportedFanModesList];
                        fanModeConstraints.type = 'string';
                        nativeCapability = new NativeCapability(entityId, entity.name, entity.type, 'fanMode', configs, fanModeConstraints, null);
                        this.nativeCapabilities[nativeCapability.getId()] = nativeCapability;
                    }

                    // customFanMode
                    if (entity.config.supportedCustomFanModesList.length > 0 && this._checkAllValuesAreString(entity.config.supportedCustomFanModesList)) {
                        let customFanModeConstraints = Object.assign({}, constraints);
                        customFanModeConstraints.values = [...entity.config.supportedCustomFanModesList];
                        customFanModeConstraints.type = 'string';
                        nativeCapability = new NativeCapability(entityId, entity.name, entity.type, 'customFanMode', configs, customFanModeConstraints, null);
                        this.nativeCapabilities[nativeCapability.getId()] = nativeCapability;
                    }

                    // preset
                    if (entity.config.supportedPresetsList.length > 0 && this._checkAllValuesAreString(entity.config.supportedPresetsList)) {
                        let presetConstraints = Object.assign({}, constraints);
                        presetConstraints.values = [...entity.config.supportedPresetsList];
                        presetConstraints.type = 'string';
                        nativeCapability = new NativeCapability(entityId, entity.name, entity.type, 'preset', configs, presetConstraints, null);
                        this.nativeCapabilities[nativeCapability.getId()] = nativeCapability;
                    }

                    // customPreset
                    if (entity.config.supportedCustomPresetsList.length > 0 && this._checkAllValuesAreString(entity.config.supportedCustomPresetsList)) {
                        let customPresetConstraints = Object.assign({}, constraints);
                        customPresetConstraints.values = [...entity.config.supportedCustomPresetsList];
                        customPresetConstraints.type = 'string';
                        nativeCapability = new NativeCapability(entityId, entity.name, entity.type, 'customPreset', configs, customPresetConstraints, null);
                        this.nativeCapabilities[nativeCapability.getId()] = nativeCapability;
                    }

                    break;

                default:
                    // Unhandled entity type
                    this.error('Found unhandled entity type:', entity);
            }
        });

        this.log('Native capabilities computed:', this.nativeCapabilities);
    }

    _checkAllValuesAreString(values) {
        return values.find(e => typeof e !== "string") === undefined;
    }

    disconnectedListener() {
        this.log('Disconnected: unavailable!');

        // We reset the list of native capabilities
        this.nativeCapabilities = {};

        this.available = false;
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
            this.error('Received an unexpected stateChanged event for a writeOnly native capability:', ...arguments);
            return;
        }

        // Convert if needed
        if (nativeCapability.type === "Climate" && nativeCapability.attribut === "mode") {
            value = ['off', "heat_cool", "cool", "heat", "fan_only", "dry", "auto"][value];
            if (newValue === undefined) {
                this.error('Received an incompatible value for a native capability:', ...arguments);
                return;
            }
        }

        // Save new value
        nativeCapability.setValue(value);

        this.log('Emit event stateChanged.' + nativeCapability.getId(), nativeCapability.getId(), value);
        this.emit('stateChanged.' + nativeCapability.getId(), nativeCapability.getId(), value);
    }

    getCurrentValue(nativeCapabilityId) {
        this.log('Get current value:', nativeCapabilityId);

        let nativeCapability = this.nativeCapabilities[nativeCapabilityId];
        return nativeCapability !== undefined ? nativeCapability.getValue() : null;
    }

    sendCommand(nativeCapabilityId, newValue) {
        this.log('Sending command:', ...arguments);

        let nativeCapability = this.nativeCapabilities[nativeCapabilityId];
        if (!nativeCapability) {
            this.error('Unknown native capability, ignoring:', ...arguments);
            return;
        }

        // Check if readOnly (just to detect unexpected issues)
        if (nativeCapability.getConfig('readOnly')) {
            this.error('Received an unexpected command for a readOnly native capability:', ...arguments);
            return;
        }

        if (nativeCapability.type === "Climate" && nativeCapability.attribut === "mode") {
            newValue = ['off', "heat_cool", "cool", "heat", "fan_only", "dry", "auto"].indexOf(newValue);
            if (newValue === -1) {
                this.error('Received a command with an incompatible value for a native capability:', ...arguments);
                return;
            }
        }

        // Sending ...
        this.client.sendCommand(nativeCapability.entityId, nativeCapability.attribut, newValue);
    }

    getRawData() {
        this.log('getRawData');

        let result = [];

        Object.keys(this.client.nativeApiClient.entities).forEach(entityId => {
            let tmpRawData = {
                id: this.client.nativeApiClient.entities[entityId].id,
                type: this.client.nativeApiClient.entities[entityId].type,
                name: this.client.nativeApiClient.entities[entityId].name,
                config: this.client.nativeApiClient.entities[entityId].config
            };

            result.push(tmpRawData);
        });

        return result;
    }

    log(...args) {
        this.driver.log('[PhysicalDevice:' + this.name + ']', ...args);
    }

    error(...args) {
        this.driver.error('[PhysicalDevice:' + this.name + ']', ...args);
    }
}

module.exports = PhysicalDevice;
