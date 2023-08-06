'use strict';

/**
 * Logger
 * -> DefaultLogger
 *   -> ConsoleLogger
 *   -> AppLogger
 * -> ConsoleReLogger
 */

const Homey = require('homey');
const consolere = require('console-remote-client')

class Logger {
    app = null;
    mode = null;

    logLevel = 'error';

    consolereEnabled = false;
    consolereLabel = '';

    consolereConnection = null;

    constructor(app, mode) {
        this.app = app;

        if (!(myMode == 'browser' || myMode == 'nodejs')) {
            throw new Error(message || "Assertion failed");
        }

        this.mode = mode;

        app.on('settings.set', (key, value) => {
            switch(key) {
                case 'log.level':
                    logLevel = value;
                    break;

                case 'consolere.enabled':
                    consolereEnabled = value;
                    this.renewConsolereConnection();
                    break;
                
                case 'consolere.label':
                    consolereLabel = value;
                    this.renewConsolereConnection();
                    break;
            }

        });

        app.on('settings.unset', (key) => {
            switch(key) {
                case 'log.level':
                    logLevel = '';
                    break;

                case 'consolere.enabled':
                    consolereEnabled = false;
                    this.renewConsolereConnection();
                    break;
                
                case 'consolere.label':
                    consolereLabel = '';
                    this.renewConsolereConnection();
                    break;
            }

            this.renewConsolereConnection();
        });

        this.logLevel= this.app.homey.settings.get("log.level");
        this.consolereEnabled= this.app.homey.settings.get("consolere.enabled");
        this.consolereLabel= this.app.homey.settings.get("consolere.label");

        this.renewConsolereConnection();
    }

    renewConsolereConnection() {
        if(this.consolereConnection) {
            this.consolereConnection.disconnect();
            this.consolereConnection = null;
        }

        this.app.log('reconnection: ', 'enabled=', this.consolereEnabled, ' ', 'label=', this.consolereLabel);
        if (this.consolereConnection == null && this.consolereEnabled && this.consolereLabel != '') {
            this.consolereConnection = consolere.connect({server: 'https://console.re', channel: this.consolereLabel});
            this.debug('reconnected to:', this.consolereLabel);
        }
    }

    checkLogLevel(logLevelToCheck) {
        if (this.logLevel == 'debug') {
            return logLevelToCheck == 'debug' || logLevelToCheck == 'info' || logLevelToCheck == 'warn' || logLevelToCheck == 'error';
        } else if (this.logLevel == 'info') {
            return logLevelToCheck == 'info' || logLevelToCheck == 'warn' || logLevelToCheck == 'error';
        } else if (this.logLevel == 'warn') {
            return logLevelToCheck == 'warn' || logLevelToCheck == 'error';
        } else if (this.logLevel == 'error') {
            return logLevelToCheck == 'error';
        } else {
            return false;
        }
    }

    isDebugEnabled() {
        return this.checkLogLevel('debug');
    }

    isInfoEnabled() {
        return this.checkLogLevel('info');
    }

    isWarnEnabled() {
        return this.checkLogLevel('warn');
    }

    isErrorEnabled() {
        return this.checkLogLevel('error');
    }

    debug(...args) {
        if(!this.checkLogLevel('debug'))
            return;
        
        if (this.consolereConnection != null) {
            console.re.debug(...args);
        } else {        
            if (this.mode == 'browser') {
                console.log('[DEBUG] [%s]', this.domain, ...args);
            } else {
                this.app.log('[DEBUG] [%s]', this.domain, ...args);
            }
        }
    }

    info(...args) {
        if(!this.checkLogLevel('info'))
            return;
        
        if (this.consolereConnection != null) {
            console.re.info(...args);
        } else {
            if (this.mode == 'browser') {
                console.log('[INFO ] [%s]', this.domain, ...args);
            } else {
                this.app.log('[INFO ] [%s]', this.domain, ...args);
            }
        }
    }

    warn(...args) {
        if(!this.checkLogLevel('warn'))
            return;
        
        if (this.consolereConnection != null) {
            console.re.warn(...args);
        } else {
            if (mode == 'browser') {
                console.log('[WARN ] [%s]', this.domain, ...args);
            } else {
                this.app.log('[WARN ] [%s]', this.domain, ...args);
            }
        }
    }

    error(...args) {
        if(!this.checkLogLevel('error')) {
            return;
        }
        
        if (this.consolereConnection != null) {
            console.re.error(...args);
        } else {
            if (this.mode == 'browser') {
                console.log('[ERROR] [%s]', this.domain, ...args);
            } else {
                this.app.log('[ERROR] [%s]', this.domain, ...args);
            }
        }
    }
}

module.exports = Logger;
