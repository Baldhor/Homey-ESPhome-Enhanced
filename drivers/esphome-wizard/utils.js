'use strict';

class Utils {
    static checkIfValidIpAddress(input) {
        // Regular expression to check if input is a valide ip address
        return /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(input);
    }

    static checkIfValidPortnumber(input) {
        // Regular expression to check if input is a valid port number
        return /^((6553[0-5])|(655[0-2][0-9])|(65[0-4][0-9]{2})|(6[0-4][0-9]{3})|([1-5][0-9]{4})|([0-5]{0,5})|([0-9]{1,4}))$/.test(input);
    }

    static assert(condition, ...messages) {
        if (!condition)
            throw new Error(messages);
    }
}

module.exports = Utils;
