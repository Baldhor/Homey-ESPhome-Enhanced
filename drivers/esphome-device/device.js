'use strict';

const { Device } = require('homey');
const { Client } = require('esphome-native-api');

class MyDevice extends Device {

  /**
   * onInit is called when the device is initialized.
   */
  async onInit() {
    this.log(this.getName(), 'has been inited');

    this.setUnavailable(this.homey.__('app.initializing'))
    .catch(this.error);

    await this.getDeviceDetails();

    let deviceIP = this.settings.ip4;
    let port = this.settings.port;
    let password = this.settings.password;

    this.log(`Connecting to ${deviceIP}`);
    this.client = new Client({
      host: deviceIP,
      port: port,
      initializeSubscribeLogs: true,
      clientInfo: 'homey'
    });

    this.client.connect();
    
    this.client.on('deviceInfo', deviceInfo => {
        this.log('Device info:', deviceInfo);
        this.deviceInfo = deviceInfo;
        this.deviceInfo.ip = deviceIP;
        this.deviceInfo.port = port;
    });

    this.client.on('logs', ({ message }) => {
      this.log(message);
    });

    this.client.on('newEntity', entity => {

      this.deviceInfo[entity.id] = {
        config : entity.config,
        name : entity.name,
        type : entity.type,
        unit: entity.config.unitOfMeasurement !== undefined ? entity.config.unitOfMeasurement || '' : ''
      };

      entity.connection.subscribeStatesService();
      entity.on(`state`, async (state) => {
        this.updateHomeyData(entity.id, state);
      });

      entity.connection.on(`destroyed`, async (state) => {
        this.log(`Device entity connection destroyed for entity ${this.deviceInfo[entity.id].config.objectId}:`, error);
      });

      entity.on(`error`, async (name) => {
        
      });
    });

    this.client.on('error', error => {
      this.log(`Error on device ${this.deviceInfo.name}:`, error);

      this.setUnavailable(this.homey.__('app.error.connection_failed') + error.code)
      .catch(this.error);
    });

    this.client.on('initialized', () => {
      this.log('initialized device', this.deviceInfo.name);
      this.setAvailable().catch(this.error);
    });

    this.client.on('disconnected', () => {
      this.setUnavailable(this.homey.__('app.error.connection_disconnected'))
      .catch(this.error);

      this.log(`Device ${this.deviceInfo.name} disconnected`);
    });
  }

  async updateHomeyData(entityId, state) {

    //this.log(`StateData:`, state);
    //this.log(`DeviceEntity:`, this.deviceInfo[entityId])

    switch (this.deviceInfo[entityId].type) {

      case 'Sensor':
        this.log(`${this.deviceInfo[entityId].config.name} ${parseFloat(state.state).toFixed(2)}${this.deviceInfo[entityId].unit}`);
        if (this.deviceInfo[entityId].config.objectId === 'woonkamer_zout_weger_weight') {
          let number = parseFloat(state.state);
          this.log(number);
          this.setCapabilityValue('esphome_number', number).catch(this.error);
        }
        break;
      
      case 'TextSensor':
        this.log(`${this.deviceInfo[entityId].config.name} ${state.state}`);
        if (this.deviceInfo[entityId].config.objectId === 'woonkamer_zout_weger_esphome_version') {
          this.setCapabilityValue('esphome_text', state.state).catch(this.error);
        }
        break;
      
      case 'Switch':
        this.log(`${this.deviceInfo[entityId].config.name}: ${state.state}`);
        break;

    }
  }

  /**
   * onAdded is called when the user adds the device, called just after pairing.
   */
  async onAdded() {
    this.log('ESPHome device has been added');
  }

  /**
   * onSettings is called when the user updates the device's settings.
   * @param {object} event the onSettings event data
   * @param {object} event.oldSettings The old settings object
   * @param {object} event.newSettings The new settings object
   * @param {string[]} event.changedKeys An array of keys changed since the previous version
   * @returns {Promise<string|void>} return a custom message that will be displayed
   */
  async onSettings({ oldSettings, newSettings, changedKeys }) {
    this.log('MyDevice settings where changed');
  }

  /**
   * onRenamed is called when the user updates the device's name.
   * This method can be used this to synchronise the name to the device.
   * @param {string} name The new name
   */
  async onRenamed(name) {
    this.log('MyDevice was renamed');
  }

  /**
   * onDeleted is called when the user deleted the device.
   */
  async onDeleted() {
    this.log(`${this.deviceInfo.name} has been deleted`);
    this.client.disconnect();
  }

  async getDeviceDetails() {
    this.log('get device details');
    var portValue = 0;

    this.settings = this.getSettings();
    this.log('settings', this.settings);

    if (typeof this.settings.port === 'string') {
      try {

        this.log('convert port to integer');
        portValue = parseInt(this.settings.port);
        await this.setSettings({port: portValue});
        this.settings = this.getSettings();
        this.log('new settings', this.settings);

      } catch(error) {

        this.log('port could not be converted, using default port of 6053 instead');
        portValue = 6053;
        await this.setSettings({port: portValue});
        this.settings = this.getSettings();

      }
    }

    this.deviceInfo = this.getStoreValue('deviceInfo');
    this.log('deviceInfo', this.deviceInfo);
  }

}

module.exports = MyDevice;
