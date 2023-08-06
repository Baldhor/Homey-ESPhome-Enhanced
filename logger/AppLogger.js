'use strict';

class AppLogger {
    static debug(app, ...args) {
        app.log('[DEBUG]', ...args);
    }

    static info(app, ...args) {
        app.log('[INFO ]', ...args);
    }

    static warn(app, ...args) {
        app.log('[WARN ]', ...args);
    }

    static error(app, ...args) {
        app.log('[ERROR]', ...args);
    }

    static log(app, level, ...args) {
        // Delegate to formating functions
        if (level == 'debug') {
            this.debug(app, ...args);
        } else if (level == 'info') {
            this.info(app, ...args);
        } else if (level == 'warn') {
            this.warn(app, ...args);
        } else if (level == 'error') {
            this.error(app, ...args);
        }
    }
}

module.exports = AppLogger;
