'use strict';

class ConsoleLogger {
    static debug(...args) {
        console.log('[DEBUG]', ...args);
    }

    static info(...args) {
        console.log('[INFO ]', ...args);
    }

    static warn(...args) {
        console.log('[WARN ]', ...args);
    }

    static error(...args) {
        console.log('[ERROR]', ...args);
    }

    static log(level, ...args) {
        // Delegate to formating functions

        if (level == 'debug') {
            this.debug(...args);
        } else if (level == 'info') {
            this.info(...args);
        } else if (level == 'warn') {
            this.warn(...args);
        } else if (level == 'error') {
            this.error(...args);
        }
    }
}

module.exports = ConsoleLogger;
