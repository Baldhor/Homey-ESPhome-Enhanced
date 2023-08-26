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
    // Handle to the physical Device
    physicalDeviceId = null;

    // Customer trigger cards
    esphomeNumberCustom = null;

    async onInit() {
        this.log(this.getName(), 'is inited');

        this.setUnavailable(this.homey.__('app.initializing'))
            .catch(this.error);

        let settings = this.getSettings();
        this.log('Settings', settings);

        // Check if physical device already exist
        let existingPhysicalDevice = PhysicalDeviceManager.get(settings.ipAddress, settings.port);
        if (existingPhysicalDevice) {
            // Maybe it's a physical device without virtual device linked? In such case we can clean up
            // Why? It was probably created during the pair session and so by default doesn't automatically reconnect
            PhysicalDeviceManager.checkDelete(null, existingPhysicalDevice);
            existingPhysicalDevice = null;
        }

        // Now we can create it ...
        this.physicalDeviceId = PhysicalDeviceManager.create(true, settings.ipAddress, settings.port, settings.encryptionKey === undefined ? '' : settings.encryptionKey, settings.password);
        if (PhysicalDeviceManager.getById(this.physicalDeviceId).client.connected) {
            this.setAvailable().catch(this.error);
        }

        this.registerCustomerTriggerCards();

        this.startAvailabilityListener();
        this.startUnavailabilityListener();
        this.startNativeCapabilityListener();
        this.startCapabilityListeners();
    }

    registerCustomerTriggerCards() {
    }

    startAvailabilityListener() {
        this.callbackAvailableListener = () => {
            this.setAvailable().catch(this.error);
        };
        PhysicalDeviceManager.getById(this.physicalDeviceId).on('available', this.callbackAvailableListener);
    }

    startUnavailabilityListener() {
        this.callbackUnavailableListener = () => {
            this.setUnavailable().catch(this.error);
        };
        PhysicalDeviceManager.getById(this.physicalDeviceId).on('unavailable', this.callbackUnavailableListener);
    }

    startNativeCapabilityListener() {
        this.log('startNativeCapabilityListener');

        let capabilities = this.getCapabilities();
        let capabilityKeys = this.getStoreValue('capabilityKeys');

        capabilities.forEach(capability => {
            this.log('Processing capability: ', capability);

            let nativeCapabilityId = capabilityKeys[capability];
            if (!nativeCapabilityId) {
                this.log('Capability', capability, 'has no native_capability associated');
                return;
            }

            this.log('Init capability', capability, 'for', nativeCapabilityId);
            this.callbackStateChangedListener = (nativeCapabilityId, value) => this.stateChangedListener(nativeCapabilityId, value);
            PhysicalDeviceManager.getById(this.physicalDeviceId).on('stateChanged', this.callbackStateChangedListener);

            // Get current value
            this._forceUpdateCurrentValue(capability);
        });
    }

    _forceUpdateCurrentValue(capability) {
        this.log('_forceUpdateCurrentValue:', ...arguments);

        let capabilityKeys = this.getStoreValue('capabilityKeys');
        let nativeCapabilityId = capabilityKeys[capability];
        if (!nativeCapabilityId) {
            this.log('Capability', capability, 'has no native_capability associated');
            return;
        }

        this.stateChangedListener(nativeCapabilityId, PhysicalDeviceManager.getById(this.physicalDeviceId).getCurrentValue(nativeCapabilityId));
    }

    /**
     * Even we listen only to the stateChanged event we need, we use a unique function to process it
     * 
     * @param {*} nativeCapabilityId 
     * @param {*} value 
     */
    stateChangedListener(nativeCapabilityId, value) {
        this.log('stateChangedListener:', ...arguments);

        let capabilityKeys = this.getStoreValue('capabilityKeys');

        let filtererdCapabilityKeys = Object.keys(capabilityKeys).filter(capabilityKey => capabilityKeys[capabilityKey] === nativeCapabilityId);

        if (filtererdCapabilityKeys.length === 1) {
            // Check if the value should be converted because of a special case
            let physicalDevice = PhysicalDeviceManager.getById(this.physicalDeviceId);
            let nativeCapability = physicalDevice.nativeCapabilities[nativeCapabilityId];

            if (nativeCapability === undefined) {
                // It's normal if the physical device didn't published his entities yet.
                if (Object.keys(physicalDevice.nativeCapabilities).length === 0) {
                    this.log("Physical device not available yet, cannot retrive current value");
                } else {
                    this.error("Couldn't find the native capability for id:", nativeCapabilityId);
                }
                return;
            }

            switch (nativeCapability.specialCase) {
                case 'templateCover':
                    this.log('templateCover case, converting value')
                    // true => closed => 0.0
                    // false => open => 1.0
                    value = value === 0 ? true : false;
                    break;
            }

            this.setCapabilityValue(filtererdCapabilityKeys[0], value).catch(this.error);
        } else if (filtererdCapabilityKeys.length > 1) {
            this.log('Something is wrong in stateChangedListener, found several matching capabilities:', filtererdCapabilityKeys);
        }
    }

    /**
     * 
     */
    startCapabilityListeners() {
        this.log('startCapabilityListeners');

        let capabilities = this.getCapabilities();
        let capabilityKeys = this.getStoreValue('capabilityKeys');

        capabilities.forEach(capability => {
            this.log('Processing capability: ', capability);

            let nativeCapabilityId = capabilityKeys[capability];
            if (!nativeCapabilityId) {
                this.log('Capability', capability, 'has no native_capability associated');
                return;
            }

            this._addCapabilityListener(capability, nativeCapabilityId);
        });
    }

    _addCapabilityListener(capability, nativeCapabilityId) {
        this.log('_addCapabilityListener:', ...arguments);

        // Remember the callback so we can delete it if needed
        if (this.callbackCapabilityListeners === undefined) {
            this.callbackCapabilityListeners = {};
        }

        // If listener already exist, no need to add it
        if (this.callbackCapabilityListeners[capability] === undefined) {
            this.callbackCapabilityListeners[capability] = (newValue) => this.capabilityListener(capability, nativeCapabilityId, newValue);
            this.registerCapabilityListener(capability, this.callbackCapabilityListeners[capability]);
        }
    }

    /**
     * Used when a capability is removed through the wizard
     * 
     * @param {*} capability 
     */
    _removeCapabilityListener(capability) {
        this.log('_removeCapabilityListener:', ...arguments);

        // If no callback list, there are nothing to remove
        if (this.callbackCapabilityListeners !== undefined) {
            // If no callback registered, there are nothing to remove
            if (this.callbackCapabilityListeners[capability] === undefined) {
                // Actually we cannot remove a capability listener :)
                delete this.callbackCapabilityListeners[capability];
            }

        }
    }

    capabilityListener(capability, nativeCapabilityId, newValue) {
        this.log('Processing new capability value:', ...arguments);

        // Check if the value should be converted because of a special case
        let physicalDevice = PhysicalDeviceManager.getById(this.physicalDeviceId);
        let nativeCapability = physicalDevice.nativeCapabilities[nativeCapabilityId];

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

        PhysicalDeviceManager.getById(this.physicalDeviceId).sendCommand(nativeCapabilityId, newValue);
    }

    _forceDisconnect() {
        this.log('_forceDisconnect');

        if (PhysicalDeviceManager.getById(this.physicalDeviceId)) {
            this.log('Found a physicalDevice');
            this._removeStateChangedListener();

            this._removeAvailableListener();
            this._removeUnavailableListener();
            PhysicalDeviceManager.checkDelete(this, PhysicalDeviceManager.getById(this.physicalDeviceId));
            this.physicalDeviceId = null;
        }
    }

    _removeStateChangedListener() {
        this.log('_removeStateChangedListener');

        if (this.callbackStateChangedListener) {
            this.log('Found a callbackStateChangedListener');

            PhysicalDeviceManager.getById(this.physicalDeviceId).off('stateChanged', this.callbackStateChangedListener);
            this.callbackStateChangedListener = null;
        }
    }

    _removeAvailableListener() {
        this.log('_removeAvailableListener');

        if (this.callbackAvailableListener) {
            this.log('Found a callbackAvailableListener');

            PhysicalDeviceManager.getById(this.physicalDeviceId).off('available', this.callbackAvailableListener);
            this.callbackAvailableListener = null;
        }
    }

    _removeUnavailableListener() {
        this.log('_removeUnavailableListener');

        if (this.callbackUnavailableListener) {
            this.log('Found a callbackUnavailableListener');

            PhysicalDeviceManager.getById(this.physicalDeviceId).off('unavailable', this.callbackUnavailableListener);
            this.callbackUnavailableListener = null;
        }
    }

    async onUninit() {
        this.log('onUnit');
        this._forceDisconnect();
    }

    async onDeleted() {
        this.log('onDeleted');
        this._forceDisconnect();
    }

    async onSettings({ oldSettings, newSettings, changedKeys }) {
        throw new Error('Use the Wizard driver to modify those settings');
    }
}

module.exports = VirtualDevice;
