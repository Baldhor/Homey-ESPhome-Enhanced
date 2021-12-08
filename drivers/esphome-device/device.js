'use strict';

const { Device } = require('homey');
const { Client } = require('esphome-native-api');

class ESPhomeDevice extends Device {

  async onInit() {
    this.log(this.getName(), 'has been inited');

    this.setUnavailable(this.homey.__('app.initializing'))
    .catch(this.error);

    await this.getDeviceDetails();
    await this.connectToDevice();
    await this.startDeviceListeners();
    await this.registerCapabilityListeners();
  }

  async getDeviceDetails() {
    this.log('get device details from Homey device store');

    this.settings = this.getSettings();
    this.log('Store: settings', this.settings);

    this.deviceInfo = this.getStoreValue('deviceInfo');
    this.log('Store: deviceInfo', this.deviceInfo);

    this.capabilities = this.getCapabilities();
    this.log('Store: capabilities', this.capabilities);

    this.capabilityKeys = this.getStoreValue('capabilityKeys');
    this.log('Store: capabilityKeys', this.capabilityKeys);
  }

  async connectToDevice() {
    let deviceIP = this.settings.ip4;
    let port = this.settings.port;
    let devicePassword = this.settings.password;

    this.log(`Connecting to ${deviceIP}`);
    this.client = new Client({
      host: deviceIP,
      port: port,
      initializeSubscribeLogs: true,
      clientInfo: 'homey'
    });

    this.client.connect();

    this.client.on('deviceInfo', deviceInfo => {

      this.log(`Received deviceInfo`);
      
      this.deviceInfo = deviceInfo;
      this.deviceInfo.ip = deviceIP;
      this.deviceInfo.port = port;

      this.setSettings({esphome_version: deviceInfo.esphomeVersion});
      this.setSettings({esphome_compilationTime: deviceInfo.compilationTime});
      this.settings = this.getSettings();
    });
  }

  async startDeviceListeners() {
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

      var message = '';
      if (error.data && error.data.code) message = error.data.code;
      else message = error.data;

      this.setUnavailable(this.homey.__('app.error.connection_failed') + message)
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

  async registerCapabilityListeners() {
    
    this.capabilities.forEach((capability) => {

      let temp = capability.split(".");
      const capabilityType = temp[0].toLowerCase();

      if (capabilityType === "onoff") {

        var cap_key = this.getKeyFromCapability(capability);
        if (cap_key) {
          this.registerCapabilityListener(capability, async (value) => {
            if (this.client.connection) {
              await this.client.connection.switchCommandService({key: cap_key, state: value});
            }
          });
        };
      };

    });
  }

  getKeyFromCapability(capability) {

    for (const key in this.capabilityKeys) {

      if (Object.hasOwnProperty.call(this.capabilityKeys, key)) {

        if (this.capabilityKeys[key] === capability) {
        
          return key;
        }
        
      }
    }

    return undefined;
  }

  async updateHomeyData(entityId, state) {
    
    if (!this.capabilityKeys) return;

    let value;
    const capability = this.capabilityKeys[entityId];
    const capabilityType = capability.split(".")[0];
    
    switch (capabilityType) {

      case 'esphome_text':
        value = String(state.state);
        break;

      case 'onoff':
        if (typeof(state.state) === "boolean") { 
          value = state.state;
        } else {
          value = (state.state === 'true') ? true : false;
        }
        break;
    
      default:
        value = parseFloat(state.state);
        break;
    }

    this.log('Setting ' + capability + ' to ' + value);
    this.setCapabilityValue(capability, value).catch(this.error);
  }

  async onSettings({ oldSettings, newSettings, changedKeys }) {
    this.log('MyDevice settings where changed');
  }

  async onDeleted() {

    // TODO connection stays alive!

    this.log(`${this.deviceInfo.name} has been deleted`);
    this.client.connection.disconnect();
    this.client.connection = {};
    this.client.disconnect();
    this.client = {};
  }

}

module.exports = ESPhomeDevice;