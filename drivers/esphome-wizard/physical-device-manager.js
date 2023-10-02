'use strict';

const EventEmitter = require('events');
const PhysicalDevice = require('./physical-device');
const Utils = require('./utils');

// Singleton
// Avoid 2 circular references:
//    - Driver->Manager->Driver->...
//    - Driver->Manager->PhysicalDevice->Driver->...
class PhysicalDeviceManager extends EventEmitter {
    driver = null;
    physicalDevices = null;

    instance = new PhysicalDeviceManager();

    /**
     * 
     * @returns Singleton instance
     */
    static getInstance() {
        // Execute outside or inside the instance
        if (this.instance == null) {
            return this;
        } else {
            return this.instance;
        }
    }

    /**
     * Init the factory
     * 
     * @param {Driver} driver Handle to the Driver for log context and virtual devices handling
     */
    static init(driver) {
        Utils.assert(driver != null && typeof driver === 'object' && driver.constructor.name === 'Driver', 'Driver cannot be null or of wrong type');

        let instance = this.getInstance();
        instance.driver = driver;
        instance.physicalDevices = new Map();
    }

    /**
     * Create a new physical device if it doesn't exist
     * Otherwise, return the existing one for the couple ipAdress/port
     * 
     * @param {*} reconnect Connection mode: connect once or reconnect
     * @param {*} ipAddress IP address
     * @param {*} port Port number
     * @param {*} encryptionKey Encryption key
     * @param {*} password (Optionnal) password
     * @returns PhysicalDevice
     */
    static create(reconnect, physicalDeviceId, name, ipAddress, port, encryptionKey, password) {
        this.log('New Physical Device to create:', ipAddress, port);

        Utils.assert(Utils.checkIfValidIpAddress(ipAddress), 'Wrong format of ip address:', ipAddress);
        Utils.assert(Utils.checkIfValidPortnumber(port), 'Wrong format of port:', port)

        // If the device already exist, return it
        let instance = this.getInstance();
        if (instance.physicalDevices.has(physicalDeviceId)) {
            this.log('Physical Device already exist');
        } else {
            this.log("Physical Device doesn't exist, create a new one");
            instance.physicalDevices.set(physicalDeviceId, new PhysicalDevice(instance.driver, reconnect, physicalDeviceId, name, ipAddress, port, encryptionKey, password));
        }
    }

    /**
     * 
     * @param {*} id
     * @returns null || PhysicalDevice
     */
    static getById(id) {
        return this.getInstance().physicalDevices.get(id);
    }

    /**
     * 
     * @param {*} ipAddress
     * @param {*} port
     * @returns null || PhysicalDevice
     */
    static get(ipAddress, port) {
        Utils.assert(Utils.checkIfValidIpAddress(ipAddress), 'Wrong format of ip address:', ipAddress);
        Utils.assert(Utils.checkIfValidPortnumber(port), 'Wrong format of port:', port)

        let instance = this.getInstance();
        instance.physicalDevices.forEach(physicalDevice => {
            if (physicalDevice.ipAddress === ipAddress && physicalDevice.port === port) {
                return physicalDevice;
            }
        });
        return null;
    }

    /**
     * For internal use only!
     * 
     * Unmap the physical device and disconnect/destroy it
     * 
     * @param {*} physicalDevice The physical device to disconnect/destroy
     */
    static _delete(physicalDevice) {
        this.log('Delete a physical device:', physicalDevice.id);
        this.getInstance().physicalDevices.delete(physicalDevice.id);
        physicalDevice.removeAllListeners();
        if (physicalDevice.client) {
            physicalDevice.client.disconnect();
        }
    }

    static log(...args) {
        this.getInstance().driver.log('[PhysicalDeviceManager]', ...args);
    }

    static error(...args) {
        this.getInstance().driver.error('[PhysicalDeviceManager]', ...args);
    }
}

module.exports = PhysicalDeviceManager;
