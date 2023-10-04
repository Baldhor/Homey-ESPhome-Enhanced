'use strict';

/**
 * This class represent a device as they appear in Homey.
 * It handle its configuration and manage the dependancy to the corresponding physical device through the driver.
 *
 * Keep in mind:
 * Many virtual device can be linked to a single physical device.
 * But the opposite is not true, a virtual device can be linked to only one physical device.
 * Only the virtual device knows to which physical device is is linked
 *
 * Device settings includes:
 * {
 *     ipAddress : string
 *     port : string
 *     encryptionKey : string
 *     password : string
 * }
 *
 * Device store includes:
 * {
 *     capabilityKeys : {
 *         <capabilityName> : <native_capability_id>
 *     }
 * }
 *
 * /!\ capabilityConfig is 'unique' for the virtual device. But settingsConfig is copied over to all virtual devices linked to the same physical device. Thank to the wizard!
 *
 * The physical device linked is determined by the settings.
 * The capability config determine the physical device's events to listen to.
 * The settings config determine the settings view of a virtual device.
 *
 */

const { Device } = require('homey');
const PhysicalDeviceManager = require('./physical-device-manager');

class VirtualDevice extends Device {
    listeners = [];

    async onInit() {
        this.log('onInit:', this.getName());

        this.setUnavailable(this.homey.__('app.initializing'))
            .catch(this.error);

        this.registerCustomerTriggerCards();

        this._setupCapabilities();

        // We need to initialize the availablity state
        await this._checkAvailability().catch(this.error);
    }

    registerCustomerTriggerCards() {
    }

    _setupCapabilities() {
        this.log('_setupCapabilities');

        let capabilityKeysV2 = this.getStoreValue('capabilityKeysV2');

        if (capabilityKeysV2 === null) {
            return;
        }

        // Clean up text capability
        let modified = false;
        Object.keys(capabilityKeysV2).forEach(capabilityKeyV2 => {
            if (capabilityKeyV2 === 'text' || capabilityKeyV2.startsWith('text.')) {
                delete capabilityKeysV2[capabilityKeyV2];
                modified = true;
            }
        })
        this.setStoreValue('capabilityKeysV2', capabilityKeysV2);

        Object.keys(capabilityKeysV2).forEach(capabilityKeyV2 => {
            this._setupCapability(capabilityKeyV2);
        });
    }

    _setupCapability(capabilityId) {
        this.log('_setupCapability:', ...arguments);

        let capabilityValueV2 = this.getStoreValue('capabilityKeysV2')[capabilityId];

        let physicalDevice = PhysicalDeviceManager.getById(capabilityValueV2.physicalDeviceId);

        this._setupAvailableListener(physicalDevice);
        this._setupUnavailableListener(physicalDevice);
        this._setupNativeCapabilityListener(physicalDevice, capabilityValueV2.nativeCapabilityId);
        
        this._addCapabilityListener(capabilityId);
        this._forceUpdateCurrentValue(capabilityId);
    }

    _unsetupCapability(capabilityId) {
        this.log('_unsetupCapability:', ...arguments);

        let capabilityKeysV2 = this.getStoreValue('capabilityKeysV2');
        let capabilityValueV2 = this.getStoreValue('capabilityKeysV2')[capabilityId];

        // Check if the physical device is used by other capabilities
        if(!Object.keys(capabilityKeysV2).find(capabilityKey => capabilityKey !== capabilityId && capabilityKeysV2[capabilityKey].physicalDeviceId === capabilityValueV2.physicalDeviceId)) {
            // Not used by any other
            let physicalDevice = PhysicalDeviceManager.getById(capabilityValueV2.physicalDeviceId);

            // Remove the listeners
            this._unregisterListeners(physicalDevice);
        }
    }

    _setupAvailableListener(physicalDevice) {
        this.log('_setupAvailableListener:', ...arguments);

        // Add available event listener if not already registered
        if (!this.listeners.find(listener => listener.obj === physicalDevice && listener.event === 'available')) {
            let callback = async () => {
                await this._checkAvailability().catch(this.error);
            };
            physicalDevice.on('available', callback);
            this._registerListener(physicalDevice, 'available', callback);
        }
    }

    _setupUnavailableListener(physicalDevice) {
        this.log('_setupUnavailableListener:', ...arguments);

        // Add available event listener if not already registered
        if (!this.listeners.find(listener => listener.obj === physicalDevice && listener.event === 'unavailable')) {
            let callback = () => {
                this.setUnavailable().catch(this.error);
            };
            physicalDevice.on('unavailable', callback);
            this._registerListener(physicalDevice, 'unavailable', callback);
        }
    }

    _setupNativeCapabilityListener(physicalDevice, nativeCapabilityId) {
        this.log('_setupNativeCapabilityListener:', ...arguments);

        // Add available event listener if not already registered
        if (!this.listeners.find(listener => listener.obj === physicalDevice && listener.event === 'stateChanged.' + nativeCapabilityId)) {
            let callback = (nativeCapabilityId, value) => {
                this.stateChangedListener(nativeCapabilityId, value);
            };

            physicalDevice.on('stateChanged.' + nativeCapabilityId, callback);
            this._registerListener(physicalDevice, 'stateChanged.' + nativeCapabilityId, callback);
        }
    }

    async _checkAvailability() {
        this.log('_checkAvailability');

        let available = true;
        let message = "";

        let listPhysicalDeviceIds = [];
        let capabilityKeysV2 = this.getStoreValue('capabilityKeysV2');

        // Maybe there are no capabilities
        if (capabilityKeysV2 !== null) {
            Object.keys(capabilityKeysV2).forEach(capabilityKeyV2 => {
                let capabilityValueV2 = capabilityKeysV2[capabilityKeyV2];
                if (!listPhysicalDeviceIds.includes(capabilityValueV2.physicalDeviceId)) {
                    listPhysicalDeviceIds.push(capabilityValueV2.physicalDeviceId);
                    let physicalDevice = PhysicalDeviceManager.getById(capabilityValueV2.physicalDeviceId);
                    if (!PhysicalDeviceManager.getById(capabilityValueV2.physicalDeviceId).available) {
                        available = false;
                        message = "Physical device " + physicalDevice.name + " is unavailable";
                        return;
                    }
                }
            });
        } else {
            message = "No capability assigned";
            available = false;
        }

        if (available) {
            await this.setAvailable().catch(this.error);
        } else {
            await this.setUnavailable(message).catch(this.error);
        }
    }

    _forceUpdateCurrentValue(capabilityId) {
        this.log('_forceUpdateCurrentValue:', ...arguments);

        let capabilityKeysV2 = this.getStoreValue('capabilityKeysV2');
        let capabilityValueV2 = capabilityKeysV2[capabilityId];
        if (!capabilityValueV2) {
            this.log('Capability', capabilityId, 'has no native_capability associated');
            return;
        }

        this.stateChangedListener(capabilityValueV2.nativeCapabilityId, PhysicalDeviceManager.getById(capabilityValueV2.physicalDeviceId).getCurrentValue(capabilityValueV2.nativeCapabilityId));
    }

    /**
     * Even we listen only to the stateChanged event we need, we use a unique function to process it
     * 
     * @param {*} nativeCapabilityId 
     * @param {*} value 
     */
    stateChangedListener(nativeCapabilityId, value) {
        this.log('stateChangedListener:', ...arguments);

        let capabilityKeysV2 = this.getStoreValue('capabilityKeysV2');
        Object.keys(capabilityKeysV2).forEach(capabilityKeyV2 => {
            let capabilityValueV2 = capabilityKeysV2[capabilityKeyV2];
            if (capabilityValueV2.nativeCapabilityId === nativeCapabilityId) {
                let physicalDevice = PhysicalDeviceManager.getById(capabilityValueV2.physicalDeviceId);
                let nativeCapability = physicalDevice.nativeCapabilities[nativeCapabilityId];

                if (nativeCapability !== undefined) {
                    switch (nativeCapability.specialCase) {
                        case 'templateCover':
                            this.log('templateCover case, converting value')
                            // true => closed => 0.0
                            // false => open => 1.0
                            value = value === 0 ? true : false;
                            break;
                    }

                    this.setCapabilityValue(capabilityKeyV2, value).catch(this.error);
                } else {
                    this.log('Unknown native capability', nativeCapabilityId, 'for physical device', capabilityValueV2.physicalDeviceId);
                }
            }
        });
    }

    capabilityListener(capability, newValue) {
        this.log('capabilityListener:', ...arguments);

        let capabilityKeysV2 = this.getStoreValue('capabilityKeysV2');
        let capabilityValueV2 = capabilityKeysV2[capability];

        // Check if the value should be converted because of a special case
        let physicalDevice = PhysicalDeviceManager.getById(capabilityValueV2.physicalDeviceId);
        let nativeCapability = physicalDevice.nativeCapabilities[capabilityValueV2.nativeCapabilityId];

        if (nativeCapability === undefined) {
            throw new Error('Capability', capability, "doesn't have a matching native capability. the configuration of your physical device probably changed in an incompatible way. Use the Wizard to 'repair' your physical device!");
        }

        switch (nativeCapability.specialCase) {
            case 'templateCover':
                this.log('templateCover case, converting value')
                // true => closed => 0.0
                // false => open => 1.0
                newValue = newValue ? 0 : 1;
                break;
        }

        physicalDevice.sendCommand(capabilityValueV2.nativeCapabilityId, newValue);
    }

    _addCapabilityListener(capabilityId) {
        this.log('_addCapabilityListener:', ...arguments);

        let callback = (newValue) => this.capabilityListener(capabilityId, newValue);
        this.registerCapabilityListener(capabilityId, callback);

        // No need to register the callback, the listeners will be removed automatically when the capability is removed
    }

    /**
     * Used when a capability is removed through the wizard
     * 
     * @param {*} capability 
     */
    _removeCapabilityListener(capabilityId) {
        this.log('_removeCapabilityListener:', ...arguments);

        // No need to remove anything (refer to _addCapabilityListener)
    }

    _registerListener(obj, event, callback) {
        this.log('_registerListeners:', obj, event); // FIXMEIf callback is logged, I get a u error from JSON parser

        this.listeners.push({
            'obj': obj,
            'event': event,
            'callback': callback
        });
    }

    _unregisterListeners(obj) {
        this.log('_unregisterAllListeners:', ...arguments);

        for(let i = this.listeners.length - 1; i >= 0; --i) {
            let listener = this.listeners[i];
            if (listener.obj === obj) {
                listener.obj.off(listener.event, listener.callback);
                this.listeners.splice(i, 1);
            }
        }
    }

    _unregisterAllListeners() {
        this.log('_unregisterAllListeners');

        this.listeners.forEach(listener => {
            listener.obj.off(listener.event, listener.callback);
        });
        this.listeners = [];
    }

    async onUninit() {
        this.log('onUnit');

        this._unregisterAllListeners();
    }

    async onDeleted() {
        this.log('onDeleted');

        // Async processing!
        this.driver.cleanUpConf();
    }
}

module.exports = VirtualDevice;
