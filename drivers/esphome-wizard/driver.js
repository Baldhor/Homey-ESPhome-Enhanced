'use strict';

const Homey = require('homey');
const PhysicalDeviceManager = require('./physical-device-manager');

class Driver extends Homey.Driver {
    physicalDeviceManager = null;

    async onInit() {
        this.physicalDeviceManager = new PhysicalDeviceManager(this);

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
            // Check if physical device already exist
            let existingPhysicalDevice = this.physicalDeviceManager.get(data.ipAddress, data.port);
            if (existingPhysicalDevice) {
                // Maybe it's a physical device without virtual device linked? In such case we can clean up
                // Why? PairSession can end without notice, and so the physicalDevice created previosuly may not be cleaned up
                this.physicalDeviceManager.checkDelete(null, existingPhysicalDevice);
                existingPhysicalDevice = null;

                // Let's check again
                if (this.physicalDeviceManager.get(data.ipAddress, data.port)) {
                    this.emit('new-device-failed', 'A physical device already exist');
                    return;
                }
            }

            // Create a new physical device and add listeners
            let physicalDevice = this.physicalDeviceManager.create(false, data.ipAddress, data.port, data.password);

            physicalDevice.on('available', () => {
                this.log('Received available event');

                // Get what we need and disconnect
                session.newPhysicalDevice = physicalDevice;
                session.emit('new-device-connected');
            });

            physicalDevice.on('unavailable', () => {
                this.log('Received unavailable event');
                
                session.emit('new-device-failed', 'Could not connect to the device, or something went wrong');
            });
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
        session.setHandler('get-existing-device', () => {
            let result = [];
            this.physicalDeviceManager.physicalDevices.forEach((physicalDevice) => {
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

            return result;
        });
    }
}

module.exports = Driver;
