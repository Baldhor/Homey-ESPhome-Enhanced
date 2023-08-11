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
 * Device capabilites and capability options supported:
 * - windowcoverings_set
 * - windowcovering_tilt
 * - ...
 *
 * Device store includes:
 * {
 *     capabilitiesConfig : {
 *         <capabilityName> : {
 *             entityId : string
 *             native_capability : string
 *             options : [string]
 *         }
 *     },
 *     settingsConfig : [
 *         {
 *             entityId : string,
 *             native_capability : string,
 *             options : {
 *                 uiComponent : default, slidder, box,
 *                 minValue,
 *                 maxValue,
 *                 step,
 *                 ...
 *                 to be completed
 *             }
 *         }
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
const { PhysicalDeviceManager } = require('./physical-device-manager');
const { PhysicalDevice } = require('./physical-device');

class VirtualDevice extends Device {
    // Handle to the physical Device
    physicalDevice = null;

    // Customer trigger cards
    esphome_number_custom = null;

    async onInit() {
        this.log(this.getName(), 'is inited');

        this.setUnavailable(this.homey.__('app.initializing'))
            .catch(this.error);

        let settings = this.getSettings();
        this.log('Settings', settings);

        this.PhysicalDevice = this.driver.physicalDeviceManager.create(ClientConnectionMode.Reconnect, settings.ipAddress, settings.port, settings.password);

        this.registerCustomerTriggerCards();

        this.startAvailabilityListner();
        this.startUnavailabilityListener();
        this.startNativeCapabilityListener();


        await this.getDeviceDetails();
        await this.connectToDevice();
        await this.startDeviceListeners();
        await this.registerCapabilityListeners();
        await this.registerHomeyTriggerCards();
    }

    registerCustomerTriggerCards() {
        this.esphome_number_custom = this.homey.flow.getDeviceTriggerCard('esphome_number_custom2');
    }

    startAvailabilityListner() {
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
        let capabilitiesConfig = this.getStoreValue('capabilitiesConfig');

        capabilities.forEach(capability => {
            this.log('Processing capability: ', capability);

            let capabilityConfig = capabilitiesConfig[capability];
            if (!capabilityConfig) {
                this.log('Capability', capability, 'config not found');
                return;
            }

            this.log('Init capability', capability, 'with config:', capabilityConfig);
            this.physicalDevice.on('stateChanged.' + capabilityConfig.entityId + '.' + capabilityConfig.native_capability, (entityId, native_capability, value) => this.stateChangedListener(capability, capabilityConfig, entityId, native_capability, value));
        });
    }

    /**
     * Even we listen only to the stateChanged event we need, we use a unique function to process it
     * 
     * @param {*} capability 
     * @param {*} capabilityConfig 
     * @param {*} entityId 
     * @param {*} native_capability 
     * @param {*} value 
     */
    stateChangedListener(capability, capabilityConfig, entityId, native_capability, value) {
        const capabilityType = capability.split(".")[0].toLowerCase();

        switch (capabilityType) {
            case 'esphome_text':
                value = String(value);
                break;

            case 'onoff':
                if (typeof (value) === "boolean") {
                    value = value;
                } else {
                    value = (value === 'true') ? true : false;
                }
                break;

            case 'esphome_number':
                value = parseFloat(value);
                this.triggerEsphome_numberFlowTrigger(entityId + '.' + native_capability, value);
                break;

            case 'windowcoverings_set':
            case 'windowcoverings_tilt':
            default:
                value = parseFloat(value);
                break;
        }

        this.log('Setting ' + capability + ' to ' + value);
        this.setCapabilityValue(capability, value).catch(this.error);
    }

    /**
     * 
     */
    startCapabilityListeners() {
        this.log('Start capability listeners');

        let capabilities = this.getCapabilities();
        let capabilitiesConfig = this.getStoreValue('capabilitiesConfig');

        capabilities.forEach(capability => {
            this.log('Processing capability: ', capability);

            let capabilityConfig = capabilitiesConfig[capability];
            if (!capabilityConfig) {
                this.log('Capability', capability, 'config not found');
                return;
            }

            this.log('Init capability', capability, 'with config:', capabilityConfig);
            this.registerCapabilityListener(capability, (newValue) => this.capabilityListener(capability, capabilityConfig, value));
        });
    }

    capabilityListener(capability, capabilityConfig, newValue) {
        this.log('Processing new capability value', capability, capabilityConfig, newValue);
        this.physicalDevice.sendCommand(capabilityConfig.entityId, capabilityConfig.native_capability, newValue);
    }

    async triggerEsphome_numberFlowTrigger(entityId, value) {
        const entityName = this.deviceInfo[entityId].config.name;

        const tokens = {
            entityName: entityName,
            value: value
        };

        this.esphome_number_custom.trigger(this, tokens)
            .then(value => {
                this.log('Flow card esphome_number_custom2 triggered:', entityId, this.deviceInfo[entityId]);
            })
            .catch(error => {
                this.log('Failed to trigger esphome_number_custom2 flow card:', error);
            })
    }

    async onDeleted() {
        this.driver.physicalDeviceManager.checkDelete(this, this.physicalDevice);
    }
}

module.exports = VirtualDevice;
