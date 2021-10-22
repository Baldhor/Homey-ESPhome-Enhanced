'use strict';

const Homey = require('homey');
const { Client } = require('esphome-native-api');

class MyApp extends Homey.App {
  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    this.log('ESPHome app init');
    /*

    let deviceIP = '192.168.0.68';

    this.log(`Connecting to ${deviceIP}`);
    const client = new Client({
      host: deviceIP,
      port: 6053,
      initializeSubscribeLogs: true
    });

    client.connect();
    
    client.on('deviceInfo', deviceInfo => {
        this.log('Device info:', deviceInfo);
        this.deviceInfo = deviceInfo;
        this.deviceInfo.ip = deviceIP;
    });
    
    client.on('logs', ({ message }) => {
        this.log(message);
    });
    client.on('newEntity', entity => {

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

    client.on('error', error => {
      this.log(`Error on device ${this.deviceInfo.name}:`, error);
    });

    client.on('initialized', () => {
      this.log('initialized device', this.deviceInfo.name);
    });

    client.on('disconnected', () => {
      this.log(`Device ${this.deviceInfo.name} disconnected`);
    });
    */

  }
  
  async updateHomeyData(entityId, state) {

    this.log(`StateData:`, state);
    this.log(`DeviceEntity:`, this.deviceInfo[entityId])

    switch (this.deviceInfo[entityId].type) {

      case 'Sensor':
        this.log(`${this.deviceInfo[entityId].config.objectId}: ${parseFloat(state.state).toFixed(2)}${this.deviceInfo[entityId].unit}`);
        break;
      
      case 'TextSensor':
        this.log(`${this.deviceInfo[entityId].config.objectId}: ${state.state}`);
        break;
      
      case 'Switch':
        this.log(`${this.deviceInfo[entityId].config.objectId}: ${state.state}`);
        break;

    }
  }
}

module.exports = MyApp;