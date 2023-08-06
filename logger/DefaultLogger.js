'use strict';

const AppLogger = require('./AppLogger');
const ConsoleLogger = require('./ConsoleLogger');

class DefaultLogger {
    // Singleton
    instance = new LogService();

    app = null; // If null, it means not initialized

    static getInstance() {
        // Execute outside or inside the instance
        if (this.instance == null) {
            return this;
        } else {
            return this.instance;
        }
    }

    static getApp() {
        let instance = this.getInstance();

        return instance.app;
    }

    static init(app) {
        if (app == null) { // Should assert on typeof Homey.App or kind!
            throw new Error("Assertion failed: require a Homey App");
        }

        let instance = this.getInstance();

        instance.app = app;
    }

    static debug (...args) {
        // Delegate function call
        this.log('debug', ...args);
    }

    static info (...args) {
        // Delegate function call
        this.log('info', ...args);
    }

    static warn (...args) {
        // Delegate function call
        this.log('warn', ...args);
    }

    static error (...args) {
        // Delegate function call
        this.log('error', ...args);
    }

    static log (...args) {
        // TODO Need to find out if we are in console or app mode
        // In the meantime we log in both :)

        let app = this.getApp();

        AppLogger.log(app, ...args);
        ConsoleLogger.log(...args);
    }
}

module.exports = DefaultLogger;
