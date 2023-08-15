'use strict';

const Homey = require('homey');
const PhysicalDeviceManager = require('./physical-device-manager');

class Driver extends Homey.Driver {
    async onInit() {
        PhysicalDeviceManager.init(this);

        this.log('ESPhomeWizard initialized');
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
                        PhysicalDeviceManager.checkDelete(null, physicalDevice);
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
            let physicalDeviceId = data.physicalDeviceId;

            this.log('Processed data:', mode, physicalDeviceId);

            let result = {
                physicalDevice : null,
                virtualDevices : [],
                nativeCapabilities : []
            };

            try {
                // Get the physical device
                let physicalDevice = PhysicalDeviceManager.getById(physicalDeviceId);

                // Add physical device to configuration
                result.physicalDevice = {
                    'id' : physicalDevice.id,
                    'ipAddress' : physicalDevice.client.ipAddress,
                    'port' : physicalDevice.client.port,
                    'password' : physicalDevice.client.password
                }

                // We will build a list of bound_native_capabilities
                let boundNativeCapabilities = [];

                // Get the virtual devices and add them to configuration
                if (mode === 'existing_physical_device') {
                    this.getDevices().foreach(device => {
                        if (device.physicalDevice === physicalDevice) {
                            let capabilities = device.getCapabilities();
                            let capabilitiesConfig = device.getStoreValue('capabilitiesConfig');

                            let tmp = {
                                'id' : device.data.id,
                                'homeyId' : device.data.id,
                                'name' : device.getName(),
                                'nameMustBeChanged' : false,
                                'state' : 'unmodified',
                                'capabilities' : []
                            };

                            capabilities.foreach(capability => {
                                let nativeCapabilityId = capabilitiesConfig[capability].nativeCapabilityId;
                                tmp.capabilities.push({
                                    'name' : capability,
                                    'nativeCapabilityId' : nativeCapabilityId,
                                    'state' : 'unmodified',
                                    'options' : device.getCapabilityOptions(capability)
                                });

                                boundNativeCapabilities.push(nativeCapabilityId);
                            });

                            result.virtualDevices.push(tmp);
                        }
                    });
                }

                // Get the native capabilities and add them to configuration
                this.log('Processing native capabilities:', physicalDevice.nativeCapabilities);
                Object.keys(physicalDevice.nativeCapabilities).forEach(nativeCapabilityId => {
                    let nativeCapability = physicalDevice.nativeCapabilities[nativeCapabilityId];
                    this.log('Processing a native capability:', nativeCapability);

                    let tmp = {
                        'id' : nativeCapabilityId,
                        'entityId' : nativeCapability.entityId,
                        'entityName' : nativeCapability.entityName,
                        'type' : nativeCapability.type,
                        'attribut' : nativeCapability.attribut,
                        'state' : boundNativeCapabilities.includes(nativeCapabilityId) ? 'bound' : 'unbind',
                        'value' : nativeCapability.value,
                        'configs' : nativeCapability.configs,
                        'constraints' : nativeCapability.constraints
                    };

                    result.nativeCapabilities.push(tmp);
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
