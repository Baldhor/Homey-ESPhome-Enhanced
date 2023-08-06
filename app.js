'use strict';

const Homey = require('homey');
const { Client } = require('@2colors/esphome-native-api');
const LogService = require('./logger/LogService');
const LoggerFactory = require('./logger/LoggerFactory');

const enableDebug = false;

class MyApp extends Homey.App {
  logger = null;

  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    this.log('ESPHome app init');

    if (process.env.DEBUG === '1' && enableDebug) {
      this.log('Enabling remote debugging')
      require('inspector').open(9222, '0.0.0.0', true);
    }

    // Init settings
    if (this.homey.settings.get('log.level') === null) {
      this.homey.settings.set('log.level', 'error');
    }

    if (this.homey.settings.get('consolere.enabled') === null) {
      this.homey.settings.set('log.enabled', false);
    }

    if (this.homey.settings.get('consolere.label') === null) {
      this.homey.settings.set('log.label', '');
    }

    // Init LogService
    this.log(LogService);
    this.log(typeof LogService);

    LogService.init(this);

    // Create App category
    this.logger = LoggerFactory.createLogger('App');

    this.logger.error('test1');
    this.logger.warn('test2');
    this.logger.info('test3');
    this.logger.debug('test4');
  }
}

module.exports = MyApp;
