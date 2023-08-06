'use strict';

const Homey = require('homey');

class AppLogger {
    app = null;
    domain = null;

    constructor(app, domain) {
        this.app = app;
        this.domain = domain;
    }
    
    debug(...args) {
        this.app.log('[DEBUG] [%s]', this.domain, ...args);
    }

    info(...args) {
        this.app.log('[INFO ] [%s]', this.domain, ...args);
    }

    warn(...args) {
        this.app.log('[WARN ] [%s]', this.domain, ...args);
    }

    error(...args) {
        this.app.log('[ERROR] [%s]', this.domain, ...args);
    }
}

module.exports = AppLogger;
