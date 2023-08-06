'use strict';

/**
 * LogService
 * -> DefaultLogger
 *   -> ConsoleLogger
 *   -> AppLogger
 * -> ConsoleReLogger
 */

const Homey = require('homey');
const DefaultLogger = require('./DefaultLogger');
const ConsoleReLogger = require('./ConsoleReLogger');

class LogService {
    // Singleton
    instance = new LogService();

    app = null; // If null, it means not initialized

    // Settings
    logLevel = 'error';
    consolereEnabled = false;
    consolereLabel = '';

    consolereLogger = null;

    static getInstance() {
        // Execute outside or inside the instance
        if (this.instance == null) {
            return this;
        } else {
            return this.instance;
        }
    }

    static init(app) {
        if (app == null) { // Should assert on typeof Homey.App or kind!
            throw new Error("Assertion failed: require a Homey App");
        }

        let instance = this.getInstance();

        instance.app = app;

        // Init DefaultLogger
        DefaultLogger.init(app);

        // Set listener on settings
        app.on('settings.set', (key, value) => {
            switch(key) {
                case 'log.level':
                    instance.logLevel = value;
                    break;

                case 'consolere.enabled':
                    instance.consolereEnabled = value;
                    instance.renewConsolereConnection();
                    break;
                
                case 'consolere.label':
                    instance.consolereLabel = value;
                    instance.renewConsolereConnection();
                    break;
            }

        });

        app.on('settings.unset', (key) => {
            switch(key) {
                case 'log.level':
                    instance.logLevel = '';
                    break;

                case 'consolere.enabled':
                    instance.consolereEnabled = false;
                    instance.renewConsolereConnection();
                    break;
                
                case 'consolere.label':
                    instance.consolereLabel = '';
                    instance.renewConsolereConnection();
                    break;
            }
        });

        instance.logLevel = app.homey.settings.get("log.level");
        instance.consolereEnabled = app.homey.settings.get("consolere.enabled");
        instance.consolereLabel = app.homey.settings.get("consolere.label");

        instance.renewConsolereConnection();
    }

    static renewConsolereConnection() {
        let instance = this.getInstance();

        // Stupid way to handle it, but simple
        // Disconnect by default, and create a new consolereLogger if needed

        if(instance.consolereLogger) {
            instance.consolereLogger.disconnect();
            instance.consolereLogger = null;
        }

        if (instance.consolereLogger == null && instance.consolereEnabled && instance.consolereLabel != '') {
            instance.consolereLogger = new ConsoleReLogger(instance.app, instance.consolereLabel);
        }
    }


    static assertLogLevel(level) {
        if (!(level == 'debug' || level == 'info' || level == 'warn' || level == 'error')) {
            throw new Error("Assertion failed: level must be one of 'debug', 'info', 'warn' or 'error'");
        }
    }

    static checkLogLevel(logLevelToCheck) {
        let instance = this.getInstance();

        this.assertLogLevel(logLevelToCheck);

        // TODO Clearly not optimized, should rework it
        if (instance.logLevel == 'debug') {
            return logLevelToCheck == 'debug' || logLevelToCheck == 'info' || logLevelToCheck == 'warn' || logLevelToCheck == 'error';
        } else if (instance.logLevel == 'info') {
            return logLevelToCheck == 'info' || logLevelToCheck == 'warn' || logLevelToCheck == 'error';
        } else if (instance.logLevel == 'warn') {
            return logLevelToCheck == 'warn' || logLevelToCheck == 'error';
        } else if (instance.logLevel == 'error') {
            return logLevelToCheck == 'error';
        } else {
            // Log all by default
            return true;
        }
    }

    static isDebugEnabled() {
        // Delegate function call
        return this.checkLogLevel('debug');
    }

    static isInfoEnabled() {
        // Delegate function call
        return this.checkLogLevel('info');
    }

    static isWarnEnabled() {
        // Delegate function call
        return this.checkLogLevel('warn');
    }

    static isErrorEnabled() {
        // Delegate function call
        return this.checkLogLevel('error');
    }

    static log(level, ...args) {
        let instance = this.getInstance();

        // Useless to check, checkLogLevel does it too ...
        //this.assertLogLevel(level);

        if(!instance.checkLogLevel(level))
            return;

        DefaultLogger.log(level, ...args);

        if (instance.consolereLogger != null) {
            instance.consolereLogger.log(level, ...args);
        }
    }

    static debug(...args) {
        // Delegate function call
        this.log('debug', ...args);
    }

    static info(...args) {
        // Delegate function call
        this.log('info', ...args);
    }

    static warn(...args) {
        // Delegate function call
        this.log('warn', ...args);
    }

    static error(...args) {
        // Delegate function call
        this.log('error', ...args);
    }
}

module.exports = LogService;
