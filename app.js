'use strict';

const Homey = require('homey');
const { Client } = require('esphome-native-api');

const enableDebug = false;

class MyApp extends Homey.App {
  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    this.log('ESPHome app init');

    if (process.env.DEBUG === '1' && enableDebug) {
      this.log('Enabling remote debugging')
      require('inspector').open(9222, '0.0.0.0', true);
    }
  }
}

module.exports = MyApp;