'use strict';

import { CategoryLogger } from "./CategoryLogger";

class LoggerFactory {
    public createLogger(category: string): ICategoryLogger {
        return new CategoryLogger(category);
    }
}

module.exports = LoggerFactory;
