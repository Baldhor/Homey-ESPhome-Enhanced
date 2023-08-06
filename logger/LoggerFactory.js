'use strict';

const CategoryLogger = require('./CategoryLogger');

class LoggerFactory {
    static createLogger(category) {
        return new CategoryLogger(category);
    }
}

module.exports = LoggerFactory;
