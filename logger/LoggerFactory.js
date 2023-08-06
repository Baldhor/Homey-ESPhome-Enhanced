'use strict';

import { CategoryLogger } from "./CategoryLogger";

class LoggerFactory {
    createLogger(category) {
        return new CategoryLogger(category);
    }
}

module.exports = LoggerFactory;
