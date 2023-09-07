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

        this.startAvailabilityListener();
        this.startUnavailabilityListener();
        this.startNativeCapabilityListener();
        this.startCapabilityListeners();

        // We need to initialize the availablity state
        await this._checkAvailability().catch(this.error);
    }

    registerCustomerTriggerCards() {
    }

    startAvailabilityListener() {
        this.log('startAvailabilityListener');

        let callback = async () => {
            await this._checkAvailability().catch(this.error);
        };
        this.log('startAvailabilityListener 2');

        let listPhysicalDeviceIds = [];
        let capabilityKeysV2 = this.getStoreValue('capabilityKeysV2');
        Object.keys(capabilityKeysV2).forEach(capabilityKeyV2 => {
            this.log('startAvailabilityListener 3:', capabilityKeyV2);
            let capabilityValueV2 = capabilityKeysV2[capabilityKeyV2];
            if (!listPhysicalDeviceIds.includes(capabilityValueV2.physicalDeviceId)) {
                this.log('startAvailabilityListener 4:', capabilityKeyV2);
                listPhysicalDeviceIds.push(capabilityValueV2.physicalDeviceId);
                PhysicalDeviceManager.getById(capabilityValueV2.physicalDeviceId).on('available', callback);

                // Register listener
                this._registerListener(PhysicalDeviceManager.getById(capabilityValueV2.physicalDeviceId), 'available', callback);
            }
        });
    }

    startUnavailabilityListener() {
        this.log('startUnavailabilityListener');

        let callback = () => {
            this.setUnavailable().catch(this.error);
        };

        let listPhysicalDeviceIds = [];
        let capabilityKeysV2 = this.getStoreValue('capabilityKeysV2');
        Object.keys(capabilityKeysV2).forEach(capabilityKeyV2 => {
            let capabilityValueV2 = capabilityKeysV2[capabilityKeyV2];
            if (!listPhysicalDeviceIds.includes(capabilityValueV2.physicalDeviceId)) {
                listPhysicalDeviceIds.push(capabilityValueV2.physicalDeviceId);
                PhysicalDeviceManager.getById(capabilityValueV2.physicalDeviceId).on('unavailable', callback);

                // Register listener
                this._registerListener(PhysicalDeviceManager.getById(capabilityValueV2.physicalDeviceId), 'unavailable', callback);
            }
        });
    }

    async _checkAvailability() {
        this.log('_checkAvailability');

        let available = true;

        let listPhysicalDeviceIds = [];
        let capabilityKeysV2 = this.getStoreValue('capabilityKeysV2');
        Object.keys(capabilityKeysV2).forEach(capabilityKeyV2 => {
            let capabilityValueV2 = capabilityKeysV2[capabilityKeyV2];
            if (!listPhysicalDeviceIds.includes(capabilityValueV2.physicalDeviceId)) {
                listPhysicalDeviceIds.push(capabilityValueV2.physicalDeviceId);
                if (!PhysicalDeviceManager.getById(capabilityValueV2.physicalDeviceId).available) {
                    available = false;
                    return;
                }
            }
        });

        if (available) {
            await this.setAvailable().catch(this.error);
        } else {
            await this.setUnavailable().catch(this.error);
        }
    }

    startNativeCapabilityListener() {
        this.log('startNativeCapabilityListener');

        let callback = (nativeCapabilityId, value) => this.stateChangedListener(nativeCapabilityId, value);

        let listNativeCapabilityIds = [];
        let capabilityKeysV2 = this.getStoreValue('capabilityKeysV2');
        Object.keys(capabilityKeysV2).forEach(capabilityKeyV2 => {
            let capabilityValueV2 = capabilityKeysV2[capabilityKeyV2];
            if (!listNativeCapabilityIds.includes(capabilityValueV2.physicalDeviceId + ':' + capabilityValueV2.nativeCapabilityId)) {
                listNativeCapabilityIds.push(capabilityValueV2.physicalDeviceId + ':' + capabilityValueV2.nativeCapabilityId);

                PhysicalDeviceManager.getById(capabilityValueV2.physicalDeviceId).on('stateChanged.' + capabilityValueV2.nativeCapabilityId, callback);

                // Register listener
                this._registerListener(PhysicalDeviceManager.getById(capabilityValueV2.physicalDeviceId), 'stateChanged.' + capabilityValueV2.nativeCapabilityId, callback);

                // Get current value
                this._forceUpdateCurrentValue(capabilityKeyV2);
            }
        });

    }

    /**
     * 
     */
    startCapabilityListeners() {
        this.log('startCapabilityListeners');

        this.getCapabilities().forEach(capability => {
            this._addCapabilityListener(capability);
        });
    }

    _forceUpdateCurrentValue(capability) {
        this.log('_forceUpdateCurrentValue:', ...arguments);

        let capabilityKeysV2 = this.getStoreValue('capabilityKeysV2');
        let capabilityValueV2 = capabilityKeysV2[capability];
        if (!capabilityValueV2) {
            this.log('Capability', capability, 'has no native_capability associated');
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

    _addCapabilityListener(capability) {
        this.log('_addCapabilityListener:', ...arguments);

        let callback = (newValue) => this.capabilityListener(capability, newValue);
        this.registerCapabilityListener(capability, callback);

        // No need to register the callback, the listeners will be removed automatically when the capability is removed
    }

    /**
     * Used when a capability is removed through the wizard
     * 
     * @param {*} capability 
     */
    _removeCapabilityListener(capability) {
        this.log('_removeCapabilityListener:', ...arguments);

        // No need to remove anything (refer to _addCapabilityListener)
    }

    _forceDisconnect() {
        this.log('_forceDisconnect');

        this._unregisterListeners();

        let listPhysicalDeviceIds = [];
        let capabilityKeysV2 = this.getStoreValue('capabilityKeysV2');
        Object.keys(capabilityKeysV2).forEach(capabilityKeyV2 => {
            let capabilityValueV2 = capabilityKeysV2[capabilityKeyV2];
            if (!listPhysicalDeviceIds.includes(capabilityValueV2.physicalDeviceId)) {
                listPhysicalDeviceIds.push(capabilityValueV2.physicalDeviceId);
                PhysicalDeviceManager.checkDelete(this, PhysicalDeviceManager.getById(capabilityValueV2.physicalDeviceId));
            }
        });
    }

    _registerListener(obj, event, callback) {
        this.log('_registerListeners:', obj, event); // FIXMEIf callback is logged, I get a u error from JSON parser

        this.listeners.push({
            'obj': obj,
            'event': event,
            'callback': callback
        });
    }

    _unregisterListeners() {
        this.log('_unregisterListeners');

        this.listeners.forEach(listener => {
            listener.obj.off(listener.event, listener.callback);
        });
    }

    async onUninit() {
        this.log('onUnit');

        this._forceDisconnect();
    }

    async onDeleted() {
        this.log('onDeleted');

        this._forceDisconnect();
    }
}

module.exports = VirtualDevice;
