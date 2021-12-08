'use strict';

const Homey = require('homey');
const { Client } = require('esphome-native-api');

class ESPhomeDriver extends Homey.Driver {

  async onInit() {
    this.log('ESPhomeDriver initializing');
  }

  async onPair(session) {
  
    session.setHandler('validate_device', async (data) => {

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
        if (error.message) session.emit('device-validate-error', error.message);
        else if (error.code) session.emit('device-validate-error', error.code);
        else if (error.error) session.emit('device-validate-error', error.error);
        else session.emit('device-validate-error', error);
      });

      client.on('disconnected', () => {
        this.log(`Device ${data.host} disconnected`);
      });
    });

    session.setHandler("get_device_details", () => {
      this.log('get_device_details');
      return this.deviceInfo;
    });
  }
}

module.exports = ESPhomeDriver;
