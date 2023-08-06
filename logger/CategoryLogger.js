'use strict';

const LogService = require('./LogService');

class CategoryLogger {
    category;

    constructor(category) {
        if (category == '') {
            throw new Error("Assertion failed: category cannot be empty");
        }

        this.category = `[${category.padEnd(10)}]`;
    }

    createSubLogger(newCategory) {
        return new CategoryLogger(`${this.category} [${newCategory.padEnd(10)}]`);
    }

    isDebugEnabled() {
        return LogService.isDebugEnabled();
    }

    isInfoEnabled() {
        return LogService.isInfoEnabled();
    }

    isWarnEnabled() {
        return LogService.isWarnEnabled();
    }

    isErrorEnabled() {
        return LogService.isErrorEnabled();
    }

    info(...args) {
        LogService.info(this.category, ...args);
    }

    debug(...args) {
        LogService.debug(this.category, ...args);
    }

    warn(...args) {
        LogService.warn(this.category, ...args);
    }

    error(...args) {
        LogService.error(this.category, ...args);
    }
}

module.exports = CategoryLogger;
