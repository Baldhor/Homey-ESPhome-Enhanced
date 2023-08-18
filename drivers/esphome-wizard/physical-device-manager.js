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
     * @param {*} password (Optionnal) password
     * @returns PhysicalDevice
     */
    static create(reconnect, ipAddress, port, password) {
        this.log('New Physical Device to create:', ipAddress, port);

        Utils.assert(Utils.checkIfValidIpAddress(ipAddress), 'Wrong format of ip address:', ipAddress);
        Utils.assert(Utils.checkIfValidPortnumber(port), 'Wrong format of port:', port)

        let id = PhysicalDevice.buildPhysicalDeviceId(ipAddress, port);

        // If the device already exist, return it
        let instance = this.getInstance();
        if (instance.physicalDevices.has(id)) {
            this.log('Physical Device already exist');
            return instance.physicalDevices.get(id);
        } else {
            this.log("Physical Device doesn't exist, create a new one");
            instance.physicalDevices.set(id, new PhysicalDevice(instance.driver, reconnect, ipAddress, port, password));
            return instance.physicalDevices.get(id);
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

        let id = PhysicalDevice.buildPhysicalDeviceId(ipAddress, port);
        return this.getInstance().physicalDevices.get(id);
    }

    /**
     * Need to trigger this function when all virtual devices linked to a physical device are deleted
     * 
     * A deleted virtual device need to send an event to capture (existing?)
     * Then we need to check if any remaining virtual device is using this ipAddress/port
     * 
     * @param {*} virtualDeviceDeleted The virtual device being deleted
     * @param {*} physicalDevice The physical device currently used by the virtual device
     */
    static checkDelete(virtualDeviceDeleted, physicalDevice) {
        this.log('Checking if still usefull:', physicalDevice.id);
        let result = false;
        this.getInstance().driver.getDevices().forEach(device => {
            if (device !== virtualDeviceDeleted && device.physicalDevice === physicalDevice) {
                result = true;
                return; // Still usefull
            }
        });

        if (!result) {
            this.log('Physical device became useless');
            PhysicalDeviceManager._delete(physicalDevice);
        } else
            this.log('Physical device is usefull');
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
        physicalDevice.client.disconnect();
    }

    /**
     * This function change the ipAdress/port of a physical device
     * 
     * /!\ It is considered that the unicity of the ipAdress/port has already been checked! (using getDevice function)
     * 
     * It implies a lot of things:
     * - It is triggered by a virtual device, but there are maybe many others! => we need to change the link of all of them
     * - The old physicalDevice must be disconnected / destroyed, and removed from the physicalDevices map
     * - There are no need to create the new physical device, it will be created by the virtual device(s) ... hopefully
     * 
     * @param {*} physicalDevice The physical device to modify
     * @param {*} ipAddress The new IP address
     * @param {*} port The new port
     * @param {*} password The new password
     */
    static changeSettings(physicalDeviceId, newIpAddress, newPort, newPassword) {
        this.log('changeSettings:', ...arguments);
        
        // We need to update the settings of all the virtual devices using this physical device
        // Then we need to force disconnect the old physical device
        // Finaly, we can force the virtual devices to 'reconect'

        // TODO: to be implemented

    }

    static log(...args) {
        this.getInstance().driver.log('[PhysicalDeviceManager]', ...args);
    }
}

module.exports = PhysicalDeviceManager;
