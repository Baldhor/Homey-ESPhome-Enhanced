'use strict';

const EventEmitter = require('events');
const PhysicalDevice = require('./physical-device');
const Utils = require('./utils');

class PhysicalDeviceManager extends EventEmitter {
    driver = null;
    physicalDevices = null;

    /**
     * Create a new ESPhome native api client and _start_ connection process
     * 
     * @param {Driver} driver Handle to the Driver for log context
     */
    constructor(driver) {
        Utils.assert(driver != null && typeof driver === 'object' && driver.constructor.name === 'Driver', 'Driver cannot be null or of wrong type');

        super();
        this.driver = driver;
        this.physicalDevices = new Map();
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
    create(reconnect, ipAddress, port, password) {
        this.log('New Physical Device to create:', ipAddress, port);

        Utils.assert(Utils.checkIfValidIpAddress(ipAddress), 'Wrong format of ip address:', ipAddress);
        Utils.assert(Utils.checkIfValidPortnumber(port), 'Wrong format of port:', port)

        let id = PhysicalDevice.buildPhysicalDeviceId(ipAddress, port);

        // If the device already exist, return it
        if (this.physicalDevices.has(id)) {
            this.log('Physical Device already exist');
            return this.physicalDevices[id];
        } else {
            this.log("Physical Device doesn't exist, create a new one");
            return new PhysicalDevice(this.driver, reconnect, ipAddress, port, password);
        }
    }

    /**
     * 
     * @param {*} ipAddress 
     * @param {*} port 
     * @returns null || PhysicalDevice
     */
    get(ipAddress, port) {
        Utils.assert(Utils.checkIfValidIpAddress(ipAddress), 'Wrong format of ip address:', ipAddress);
        Utils.assert(Utils.checkIfValidPortnumber(port), 'Wrong format of port:', port)

        let id = PhysicalDevice.buildPhysicalDeviceId(ipAddress, port);
        return this.physicalDevices[id];
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
    checkDelete(virtualDeviceDeleted, physicalDevice) {
        this.log('Checking if still usefull:', physicalDevice);
        const result = false;
        this.driver.getDevices().forEach(device => {
            if (device !== virtualDeviceDeleted && device.physicalDevice ===  physicalDevice) {
                result = true;
                return; // Still usefull
            }
        });

        if (!result) {
            this.log('Physical device became useless');
            this._delete(physicalDevice);
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
    _delete(physicalDevice) {
        this.physicalDevices.delete(physicalDevice.id);
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
     */
    changeIpAdress(physicalDevice, ipAddress, port) {
        // TODO: to be implemented
    }

    /**
     * This function handle a password change for a physical device
     * 
     * It implies a lot of things:
     * - It is triggered by a virtual device, but there are maybe many others! => we need to change the password of all of them
     * - The Physical device need to renew its client
     * 
     * @param {*} physicalDevice 
     * @param {*} password 
     */
    changePassword(physicalDevice, password) {
        // TODO: to be implemented
    }

    log(...args) {
        this.driver.log('[PhysicalDeviceFactory]', ...args);
    }
}

module.exports = PhysicalDeviceManager;
