'use strict';

const Homey = require('homey');
const { Discovery } = require('esphome-native-api');
const { Client } = require('esphome-native-api');

class MyApp extends Homey.App {
  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    this.log('MyApp has been initialized');

    this.log('Discovery ESPhome devices, please wait');
    Discovery().then(results => {
      this.log('Discovered an ESPhome device');
      this.log(results);
    });

    this.log('Connecting to ESPhome device (192.168.0.68), please wait');
    const client = new Client({
      host: '192.168.0.68',
      port: 6053,
      initializeSubscribeLogs: true
    });
    client.on('deviceInfo', deviceInfo => {
        this.log('Device info:', deviceInfo);
    });
    client.on('logs', ({ message }) => {
        this.log(message);
    });
  }
}

module.exports = MyApp;
