'use strict';

const Homey = require('homey');
const connect = require('socket.io-client');
const LogService = require('./LogService');
const DefaultLogger = require('./DefaultLogger');

class ConsoleReLogger {
    disconnecting = false;
    buffer = null;
    socket = null;

    app = null;
    label = null;

    constructor(app, label) {
        this.app = app;
        this.label = label;

        this.buffer = require('./promise-buffer').promiseBuffer();

        this.socket = connect("https://console.re", {
            withCredentials: !1,
            transports: ["websocket"],
            extraHeaders:{"x-consolere":"true"}
        });

        this.socket.on("connect", () => {
            DefaultLogger.info("ConsoleRe connected");
            this.info('ConsoleRe connected');
        });

        this.socket.on("connect_error", (error) => {
            DefaultLogger.error("ConsoleRe socket connect_error", error);
        });

        this.socket.on("reconnect_error", (error) => {
            DefaultLogger.error( "ConsoleRe socket reconnect_error", error);
        });

        this.socket.on("error", (error) => {
            DefaultLogger.error("ConsoleRe socket error", error);
        });

        this.socket.on("disconnect", () => {
            DefaultLogger.info("ConsoleRe disconnected");
            if (!this.disconnecting) { this.socket.connect(); }
        });
    }

    updateLabel(label) {
        this.label = label;
    }

    disconnect() {
        this.disconnecting = true;
        this.socket.disconnect();

        delete this.socket;
        delete this.buffer;

        DefaultLogger.info("ConsoleRe cleaned up");
    }

    debug(...args) {
        this.log('debug', ...args);
    }

    info(...args) {
        this.log('info', ...args);
    }

    warn(...args) {
        this.log('warn', ...args);
    }

    error(...args) {
        this.log('error', ...args);
    }

    log(level, ...args) {
        DefaultLogger.info("ConsoleRe send a log on channel ", this.label, ':', level, ...args);
        
        // TODO This buffer is not limited, and start immediatly ... it should run only when the socket is connected.
        this.buffer.push(() => {
            new Promise((resolve) => {
                if (this.socket.connected) {
                    this.socket.emit("toServerRe", {
                        // command: null,
                        channel: this.label,
                        level,
                        args,
                        caller: { /* that's true */
                            file: "ConsoleReLogger.js",
                            line: 77,
                            column: 13,
                        },
                        browser: {
                            browser: {
                                f: this.app.id,
                                s: this.app.manifest.version,
                            },
                            version: this.app.homey.version,
                            OS: "Homey",
                        },
                    });
                } else {
                    DefaultLogger.error("ConsoleReLogger is not connected", ...args);
                }
                resolve();
          });
        });
    }
}

module.exports = ConsoleReLogger;
