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
    physicalDevice = null;

    // Customer trigger cards
    esphomeNumberCustom = null;

    async onInit() {
        this.log(this.getName(), 'is inited');

        this.setUnavailable(this.homey.__('app.initializing'))
            .catch(this.error);

        let settings = this.getSettings();
        this.log('Settings', settings);

        this.physicalDevice = PhysicalDeviceManager.create(true, settings.ipAddress, settings.port, settings.password);
        if (this.physicalDevice.client.connected) {
            this.setAvailable().catch(this.error);
        }

        this.registerCustomerTriggerCards();

        this.startAvailabilityListener();
        this.startUnavailabilityListener();
        this.startNativeCapabilityListener();
        this.startCapabilityListeners();
    }

    registerCustomerTriggerCards() {
        this.esphomeNumberCustom = this.homey.flow.getDeviceTriggerCard('esphome_number_custom2');
    }

    startAvailabilityListener() {
        this.physicalDevice.on('available', () => {
            this.setAvailable().catch(this.error);
        });
    }

    startUnavailabilityListener() {
        this.physicalDevice.on('unavailable', () => {
            this.setUnavailable().catch(this.error);
        });
    }

    startNativeCapabilityListener() {
        this.log('Start native capability listeners');

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
            this.physicalDevice.on('stateChanged', (nativeCapabilityId, value) => this.stateChangedListener(nativeCapabilityId, value));

            // Get current value
            this.stateChangedListener(nativeCapabilityId, this.physicalDevice.getCurrentValue(nativeCapabilityId));
        });
    }

    /**
     * Even we listen only to the stateChanged event we need, we use a unique function to process it
     * 
     * @param {*} nativeCapabilityId 
     * @param {*} value 
     */
    stateChangedListener(nativeCapabilityId, value) {
        let capabilityKeys = this.getStoreValue('capabilityKeys');
        let filtererdCapabilityKeys = Object.keys(capabilityKeys).filter(capabilityKey => capabilityKeys[capabilityKey] === nativeCapabilityId);

        if (filtererdCapabilityKeys.length === 1) {
            this.setCapabilityValue(filtererdCapabilityKeys[0], value).catch(this.error);
        } else if (filtererdCapabilityKeys.length > 1){
            this.log('Something is wrong in changedListener, found several matching capabilities:', filtererdCapabilityKeys);
        }
    }

    /**
     * 
     */
    startCapabilityListeners() {
        this.log('Start capability listeners');

        let capabilities = this.getCapabilities();
        let capabilityKeys = this.getStoreValue('capabilityKeys');

        capabilities.forEach(capability => {
            this.log('Processing capability: ', capability);

            let nativeCapabilityId = capabilityKeys[capability];
            if (!nativeCapabilityId) {
                this.log('Capability', capability, 'has no native_capability associated');
                return;
            }

            this.log('Init capability', capability, 'with :', nativeCapabilityId);
            this.registerCapabilityListener(capability, (newValue) => this.capabilityListener(capability, nativeCapabilityId, newValue));
        });
    }

    capabilityListener(capability, nativeCapabilityId, newValue) {
        this.log('Processing new capability value', capability, nativeCapabilityId, newValue);
        this.physicalDevice.sendCommand(nativeCapabilityId, newValue);
    }
    
    async onDeleted() {
        PhysicalDeviceManager.checkDelete(this, this.physicalDevice);
        this.physicalDevice = null;
    }
}

module.exports = VirtualDevice;
