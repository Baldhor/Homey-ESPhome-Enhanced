'use strict';

import { Logger } from "./Logger";

class CategoryLogger {
    category;

    constructor(category) {
        this.category = `[${category.padEnd(10)}]`;
    }

    createSubLogger(newCategory) {
        return new CategoryLogger(`${this.category} [${newCategory.padEnd(10)}]`);
    }

    isDebugEnabled() {
        return Logger.isDebugEnabled();
    }

    isInfoEnabled() {
        return Logger.isInfoEnabled();
    }

    isWarnEnabled() {
        return Logger.isWarnEnabled();
    }

    isErrorEnabled() {
        return Logger.isErrorEnabled();
    }

    info(...args) {
        Logger.info(this.category, ...args);
    }

    debug(...args) {
        Logger.debug(this.category, ...args);
    }

    warn()...args) {
        Logger.warn(this.category, ...args);
    }

    error()...args) {
        Logger.error(this.category, ...args);
    }
}

module.exports = CategoryLogger;
