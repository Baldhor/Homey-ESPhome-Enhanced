'use strict';

const Homey = require('homey');
const { Client } = require('esphome-native-api');

class MyDriver extends Homey.Driver {

  async onInit() {
    this.log('MyDriver has been initialized');
  }

  async onPair(session) {
  
    session.setHandler('validate_device', async (data) => {

      // TODO : Check for capabilities here
    
      this.log('validate_device');
      this.log('data:', data);

      this.log('Connecting to:', data.host);
      const client = new Client({
        host: data.host,
        port: data.port,
        password: data.password,
        initializeSubscribeLogs: false,
        initializeSubscribeStates: false,
        initializeListEntities: true,
        reconnect: false,
        clientInfo: 'homey'
      });
  
      client.connect();
      
      client.on('deviceInfo', deviceInfo => {
          this.log('Device info:', deviceInfo);
          this.deviceInfo = deviceInfo;
          this.deviceInfo.ip4 = data.host;
          this.deviceInfo.port = data.port;
          this.deviceInfo.password = data.password;
      });

      client.on('newEntity', entity => {
      
        this.deviceInfo[entity.id] = {
          config : entity.config,
          name : entity.name,
          type : entity.type,
          unit: entity.config.unitOfMeasurement !== undefined ? entity.config.unitOfMeasurement || '' : ''
        };
        this.log('This device has ', this.deviceInfo.lenght)
      
      });

      client.on('initialized', () => {
        this.log('initialized device', this.deviceInfo.name);
        try {
          client.disconnect();
        } catch (error) {}
        session.emit('device-validate-ok');
      });

      client.on('error', error => {
        this.log(`Error on device ${data.host}:`, error);
        session.emit('device-validate-error', error.code);
      });

      client.on('disconnected', () => {
        this.log(`Device ${data.host} disconnected`);
      });
    });

    session.setHandler('list_devices', () => {
      this.log('list_devices');

      const devices = [{
        name: this.deviceInfo.name,
        data: {
          id: this.deviceInfo.macAddress
        },
        settings: {
          ip4: this.deviceInfo.ip4,
          port: this.deviceInfo.port,
          password: this.deviceInfo.password
        },
        store: {
          id: this.deviceInfo.macAddress,
          ip4: this.deviceInfo.ip4,
          port: Number(this.deviceInfo.port),
          password: this.deviceInfo.password,
          deviceInfo: this.deviceInfo,
          version: this.homey.manifest.version,
        },
      }];

      this.log('Returning devices:', devices);
      this.log('DeviceInfo:', devices[0].store.deviceInfo);
      return devices;
    });
  }
}

module.exports = MyDriver;
