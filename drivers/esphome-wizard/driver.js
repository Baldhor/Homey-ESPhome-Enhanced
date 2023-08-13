'use strict';

const Homey = require('homey');
const PhysicalDeviceManager = require('./physical-device-manager');

// Some config of native_capability can/should be ignored
const CONFIG_TO_IGNORE = Object.freeze([
    'key', // Duplicate
    'objectId', // Useless
    'uniqueId', // Useless
    'icon', // Useless => maybe later ???
    'entityCategory', // Useless
    'supportsPosition', // Useless => refer to position attribut for Cover
    'supportsTilt', // Useless => refer to tilt attribut for Cover
    'assumedState', // Useless
    'supportsStop' // Useless
]);

class Driver extends Homey.Driver {
    async onInit() {
        PhysicalDeviceManager.init(this);

        this.log('ESPhomeWizard initialized');
    }

    /**
     * Filter config object to remove useless stuff
     */
    filter_config(config) {
        let newConfig = {};

        this.log('Config:', config);
        Object.keys(config).forEach(key => {
            if (!CONFIG_TO_IGNORE.includes(key)) {
                newConfig[key] = config[key];
            }
        });

        this.log('newConfig:', newConfig);

        return newConfig;
    }
    
    async onPair(session) {
        /**
         * Used by new_device view
         * Connect to a new physical device
         * 
         * data: {
         *     ipAddress,
         *     port,
         *    password
         * }
         * 
         * Emit:
         * - new-device-connected: if success
         * - new-device-failed: if failed
         */
        session.setHandler('connect-new-device', (data) => {
            this.log('connect-new-device started');

            try {
                // Check if physical device already exist
                let existingPhysicalDevice = PhysicalDeviceManager.get(data.ipAddress, data.port);
                if (existingPhysicalDevice) {
                    // Maybe it's a physical device without virtual device linked? In such case we can clean up
                    // Why? PairSession can end without notice, and so the physicalDevice created previosuly may not be cleaned up
                    PhysicalDeviceManager.checkDelete(null, existingPhysicalDevice);
                    existingPhysicalDevice = null;

                    // Let's check again
                    if (PhysicalDeviceManager.get(data.ipAddress, data.port)) {
                        session.emit('new-device-failed', 'A physical device already exist');
                        return;
                    }
                }

                // Create a new physical device and add listeners
                let physicalDevice = PhysicalDeviceManager.create(false, data.ipAddress, data.port, data.password);
                session.newPhysicalDevice = physicalDevice;
                
                physicalDevice.on('available', () => {
                    this.log('Received available event');

                    if (session.newPhysicalDevice === physicalDevice) {
                        session.emit('new-device-connected', physicalDevice.id);
                    }
                });

                physicalDevice.on('unavailable', () => {
                    this.log('Received unavailable event');

                    if (session.newPhysicalDevice === physicalDevice) {
                        session.emit('new-device-failed', 'Could not connect to the device, or something went wrong');
                        PhysicalDeviceManager._delete(physicalDevice);
                        this.newPhysicalDevice = null;
                    }
                });

                this.log('connect-new-device finished');
            } catch (error) {
                this.log(error);
                throw error;
            }
        });

        /**
         * Used by update_device view
         * Get the list of existing physical device
         * 
         * return: [
         *     {
         *         id,
         *         ipAddress,
         *         port,
         *         bound
         *     }
         * ]
         */
        session.setHandler('get-existing-devices', () => {
            this.log('get-existing-devices started');

            let result = [];
            try {
                PhysicalDeviceManager.physicalDevices.forEach((physicalDevice) => {
                    // Find num of bound virtual devices
                    let bound = 0;
                    this.driver.getDevices().forEach(device => {
                        if (device.physicalDevice ===  physicalDevice) {
                            ++bound;
                        }
                    });

                    result.push({
                        'id': physicalDevice.id,
                        'ipAddress': physicalDevice.client.ipAddress,
                        'port': physicalDevice.client.port,
                        'bound': bound
                    });
                });

                this.log('get-existing-devices result:', result);
            } catch (error) {
                this.log(error);
                throw error;
            }

            return result;
        });

        /**
         * Used by conf_main view
         * Get the initial_configuration
         * 
         * return: refer to store.html
         */
        session.setHandler('get-initial-configuration', (data) => {
            this.log('get-initial-configuration started:', data);
            let mode = data.mode;
            let physical_device_id = data.physical_device_id;

            this.log('Processed data:', mode, physical_device_id);

            let result = {};

            try {
                // Get the physical device
                let physical_device = PhysicalDeviceManager.getById(physical_device_id);

                // Add physical device to configuration
                result.physical_device = {
                    'id' : physical_device.id,
                    'ipAddress' : physical_device.client.ipAddress,
                    'port' :physical_device.client.port
                }

                // We will build a list of bound_native_capabilities
                let bound_native_capabilities = [];

                // Get the virtual devices and add them to configuration
                result.virtual_devices = [];
                if (mode === 'existing_physical_device') {
                    this.getDevices().foreach(device => {
                        if (device.physicalDevice === physicalDevice) {
                            let capabilities = device.getCapabilities();
                            let capabilitiesConfig = device.getStoreValue('capabilitiesConfig');

                            let tmp = {
                                'homey_id' : device.id,
                                'name' : device.getName(),
                                'nameMustBeChanged' : false,
                                'state' : 'unmodified',
                                'capabilities' : []
                            };

                            capabilities.foreach(capability => {
                                let nativeCapabilityId = capabilitiesConfig[capability].nativeCapabilityId;
                                tmp.capabilities.push({
                                    'name' : capability,
                                    'native_capability_id' : nativeCapabilityId,
                                    'state' : 'unmodified',
                                    'options' : device.getCapabilityOptions(capability)
                                });

                                bound_native_capabilities.push(nativeCapabilityId);
                            });
                        }
                    });
                }

                // Get the native capabilities and add them to configuration
                result.native_capabilities = [];
                this.log('Processing native capabilities:', physical_device.native_capabilities);
                Object.keys(physical_device.native_capabilities).forEach(nativeCapabilityId => {
                    let native_capability = physical_device.native_capabilities[nativeCapabilityId];
                    this.log('Processing a native capability:', native_capability);

                    let tmp = {
                        'id' : nativeCapabilityId,
                        'entity_id' : native_capability.entityId,
                        'entity_name' : native_capability.entityName,
                        'type' : native_capability.type,
                        'attribut' : native_capability.attribut,
                        'state' : bound_native_capabilities.includes(nativeCapabilityId) ? 'bound' : 'unbind',
                        'value' : native_capability.value,
                        'configs' : native_capability.configs,
                        'constraints' : native_capability.constraints
                    };

                    result.native_capabilities.push(tmp);
                });

                this.log('get-initial-configuration result:', result);
            } catch (error) {
                this.log(error);
                throw error;
            }

            return result;
        });
    }
}

module.exports = Driver;
