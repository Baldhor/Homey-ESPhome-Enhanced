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
                let physicalDeviceId = PhysicalDeviceManager.create(false, data.ipAddress, data.port, data.password);
                session.newPhysicalDeviceId = physicalDeviceId;

                PhysicalDeviceManager.getById(physicalDeviceId).on('available', () => {
                    this.log('Received available event');

                    if (session.newPhysicalDeviceId === physicalDeviceId) {
                        session.emit('new-device-connected', physicalDeviceId);
                    }
                });

                PhysicalDeviceManager.getById(physicalDeviceId).on('unavailable', () => {
                    this.log('Received unavailable event');

                    if (session.newPhysicalDeviceId === physicalDeviceId) {
                        session.emit('new-device-failed', 'Could not connect to the device, or something went wrong');
                        PhysicalDeviceManager.checkDelete(null, PhysicalDeviceManager.getById(physicalDeviceId));
                        this.newPhysicalDeviceId = null;
                    }
                });

                this.log('connect-new-device finished');
            } catch (error) {
                this.log(error.stack);
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
        session.setHandler('get-existing-physical-devices', () => {
            this.log('get-existing-physical-devices started');

            let result = [];
            try {
                PhysicalDeviceManager.physicalDevices.forEach((physicalDevice) => {
                    // Find num of bound virtual devices
                    let bound = 0;
                    this.getDevices().forEach(device => {
                        if (device.physicalDeviceId === physicalDevice.id) {
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

                this.log('get-existing-physical-devices result:', result);
            } catch (error) {
                this.log(error.stack);
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
                physicalDevice: null,
                virtualDevices: [],
                nativeCapabilities: []
            };

            try {
                // Get the physical device
                let physicalDevice = PhysicalDeviceManager.getById(physicalDeviceId);

                // Add physical device to configuration
                result.physicalDevice = {
                    'id': physicalDevice.id,
                    'ipAddress': physicalDevice.client.ipAddress,
                    'port': physicalDevice.client.port,
                    'password': physicalDevice.client.password
                }

                // We will build a list of bound_native_capabilities
                let boundNativeCapabilities = [];

                // Get the virtual devices and add them to configuration
                if (mode === 'existing_physical_device') {
                    this.getDevices().forEach(device => {
                        if (device.physicalDeviceId === physicalDevice.id) {
                            let capabilities = device.getCapabilities();
                            let capabilityKeys = device.getStoreValue('capabilityKeys');

                            let tmp = {
                                'id': device.getData().id,
                                'homeyId': device.getData().id,
                                'name': device.getName(),
                                'nameMustBeChanged': false,
                                'state': 'existing',
                                'capabilities': []
                            };

                            capabilities.forEach(capability => {
                                let nativeCapabilityId = capabilityKeys[capability];
                                tmp.capabilities.push({
                                    'type': capability.split(".")[0],
                                    'name': capability,
                                    'nativeCapabilityId': nativeCapabilityId,
                                    'state': 'unmodified',
                                    'options': device.getCapabilityOptions(capability)
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
                        'id': nativeCapabilityId,
                        'entityId': nativeCapability.entityId,
                        'entityName': nativeCapability.entityName,
                        'type': nativeCapability.type,
                        'attribut': nativeCapability.attribut,
                        'state': boundNativeCapabilities.includes(nativeCapabilityId) ? 'bound' : 'unbind',
                        'value': nativeCapability.value === null ? (nativeCapability.configs['writeOnly'] === true ? '' : 'undefined') : nativeCapability.value,
                        'configs': nativeCapability.configs,
                        'constraints': nativeCapability.constraints
                    };

                    result.nativeCapabilities.push(tmp);
                });

                this.log('get-initial-configuration result:', result);
            } catch (error) {
                this.log(error.stack);
                throw error;
            }

            return result;
        });

        /**
         * data: {
         *     devices : [
         *         deviceId : string,
         *         capabilities : [string]
         *     ]
         * }
         */
        session.setHandler('remove-capabilities', async (data) => {
            this.log('remove-capabilities started:', data);
            let devices = data.devices;

            try {
                await devices.forEach(async device => {
                    let capabilities = device.capabilities;
                    let realDevices = this.getDevices().filter(realDevice => realDevice.getData().id === device.deviceId);

                    if (realDevices.length !== 1) {
                        this.log('Found', realDevices.length, 'devices for id', device.deviceId, 'expecting only one!');
                    } else {
                        let realDevice = realDevices[0];

                        this.log('Processing device with id', device.deviceId);

                        // Removing capabilityKeys first
                        let capabilityKeys = realDevice.getStoreValue('capabilityKeys');
                        capabilities.forEach(capability => {
                            this.log('Removing capabilityKey:', capability);
                            delete capabilityKeys[capability];
                        });
                        realDevice.setStoreValue('capabilityKeys', capabilityKeys);

                        // Removing capability
                        await capabilities.forEach(async capability => {
                            this.log('Removing capability:', capability);
                            await realDevice.removeCapability(capability);
                        });

                        this.log('Device with id', device.deviceId, 'is processed');
                    }
                });
            } catch (error) {
                this.log(error.stack);
                throw error;
            } finally {
                this.log('remove-capabilities finished');
            }
        });

        /**
         * data: {
         *     devices : [
         *         deviceId: string,
         *         capabilities: [
         *             {
         *                 capabilityName : string,
         *                 nativeCapabilityId : string,
         *                 options : {
         *                     <key: string>: <value: any>
         *                 }
         *             }
         *         ]
         *     ]
         * }
         */
        session.setHandler('add-capabilities', async (data) => {
            this.log('add-capabilities started:', data);
            let devices = data.devices;

            try {
                await devices.forEach(async device => {
                    let capabilities = device.capabilities;
                    let realDevices = this.getDevices().filter(realDevice => realDevice.getData().id === device.deviceId);

                    if (realDevices.length !== 1) {
                        this.log('Found', realDevices.length, 'devices for id', device.deviceId, 'expecting only one!');
                    } else {
                        let realDevice = realDevices[0];

                        this.log('Processing device with id', device.deviceId);

                        // Adding capability first
                        await capabilities.forEach(async capability => {
                            this.log('Adding capability:', capability.capabilityName);
                            await realDevice.addCapability(capability.capabilityName);
                            await realDevice.setCapabilityOptions(capability.capabilityName, capability.options);
                            realDevice._addCapabilityListener(capability.capabilityName, capability.nativeCapabilityId);
                        });

                        // Adding capabilityKeys
                        let capabilityKeys = realDevice.getStoreValue('capabilityKeys');
                        capabilities.forEach(capability => {
                            this.log('Adding capabilityKey:', capability.capabilityName);
                            capabilityKeys[capability.capabilityName] = capability.nativeCapabilityId;
                        });
                        realDevice.setStoreValue('capabilityKeys', capabilityKeys);

                        // Force update current value
                        capabilities.forEach(capability => {
                            realDevice._forceUpdateCurrentValue(capability.capabilityName);
                        });

                        this.log('Device with id', device.deviceId, 'is processed');
                    }
                });
            } catch (error) {
                this.log(error.stack);
                throw error;
            } finally {
                this.log('add-capabilities finished');
            }
        });

        /**
         * data: {
         *     devices : [
         *         deviceId: string,
         *         capabilities: [
         *             {
         *                 capabilityName : string,
         *                 options : {
         *                     <key: string>: <value: any>
         *                 }
         *             }
         *         ]
         *     ]
         * }
         */
        session.setHandler('modify-capabilities', async (data) => {
            this.log('modify-capabilities started:', data);
            let devices = data.devices;

            try {
                await devices.forEach(async device => {
                    let capabilities = device.capabilities;
                    let realDevices = this.getDevices().filter(realDevice => realDevice.getData().id === device.deviceId);

                    if (realDevices.length !== 1) {
                        this.log('Found', realDevices.length, 'devices for id', device.deviceId, 'expecting only one!');
                    } else {
                        let realDevice = realDevices[0];

                        this.log('Processing device with id', device.deviceId);

                        // Modify capability
                        await capabilities.forEach(async capability => {
                            this.log('Modify capability:', capability.capabilityName);
                            await realDevice.setCapabilityOptions(capability.capabilityName, capability.options);
                        });

                        this.log('Device with id', device.deviceId, 'is processed');
                    }
                });
            } catch (error) {
                this.log(error.stack);
                throw error;
            } finally {
                this.log('modify-capabilities finished');
            }
        });

        session.setHandler('logme', (data) => {
            try {
                this.log('browser log:', ...Object.values(data));
            } catch (error) {
                this.log(error.stack);
                throw error;
            }
        });
    }
}

module.exports = Driver;
