'use strict';

const Homey = require('homey');

class ConsoleLogger {
    domain = null;

    constructor(domain) {
        this.domain = domain;
    }

    debug(...args) {
        console.log('[DEBUG] [%s]', this.domain, ...args);
    }

    info(...args) {
        console.log('[INFO ] [%s]', this.domain, ...args);
    }

    warn(...args) {
        console.log('[WARN ] [%s]', this.domain, ...args);
    }

    error(...args) {
        console.log('[ERROR] [%s]', this.domain, ...args);
    }
}

module.exports = AppLogger;
