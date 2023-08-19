'use strict';

const Homey = require('homey');
const ConsoleReService = require('./consolere/ConsoleReService');

class MyApp extends Homey.App {
  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    this.log('ESPHome app init');

    // Init ConsoleReService
    await ConsoleReService.init(this);
  }
}

module.exports = MyApp;
