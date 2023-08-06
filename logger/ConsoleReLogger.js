'use strict';

import { PromiseBuffer } from "@sentry/utils";
import { connect } from "socket.io-client";
import { Logger } from "./Logger";

class ConsoleReLogger {
    domain = null;

    constructor(domain, level) {
        this.disconnecting = false;
        buffer = new PromiseBuffer<void>(30);

        this.domain = domain;
        this.label = label;

        this.socket = connect("https://console.re:443", {
            transports: ["websocket"],
        });

        this.socket.on("connect", () => {
            Logger.default.info("ConsoleRe connected");
        });

        this.socket.on("connect_error", (error) => {
            Logger.default.error(error, "ConsoleRe socket connect_error", error);
        });

        this.socket.on("reconnect_error", (error) => {
            Logger.default.error(error, "ConsoleRe socket reconnect_error", error);
        });

        this.socket.on("error", (error) => {
            Logger.default.error("ConsoleRe socket error", error);
        });

        this.socket.on("disconnect", () => {
            Logger.default.info("ConsoleRe disconnected");
            if (!this.disconnecting) { this.socket.connect(); }
        });
    }

    updateLabel(label) {
        this.label = label;
    }

    disconnect() {
        return this.buffer.drain().then(() => {
            this.disconnecting = true;
            this.socket.disconnect();

            delete this.socket;
            delete this.buffer;

            Logger.default.info("ConsoleRe cleaned up");
            return true;
        }) as Promise<boolean>;
    }

    debug(...args) {
        sendLog('debug', this.domain, ...args);
    }

    info(...args) {
        sendLog('info', this.domain, ...args);
    }

    warn(...args) {
        sendLog('warn', this.domain, ...args);
    }

    error(...args) {
        sendLog('error', this.domain, ...args);
    }

    sendLog(level, ...args) {
        if (!this.buffer.isReady()) {
            Logger.default.error("ConsoleReLogger buffer full", ...args);
            return;
        }

        appVersion = 'undefined';
        this.homey.api.getApiApp('com.athom.otherApp').getVersion().then((result) => appVersion = result);

        this.buffer.add(
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
                                s: "H",
                            },
                            version: appVersion,
                            OS: "Homey",
                        },
                    });
                }

                resolve();
            }),
        ).catch((e) => {
            Logger.default.error("ConsoleRe could not send log: ", ...args, e);
        });
    }
}

module.exports = ConsoleReLogger;
