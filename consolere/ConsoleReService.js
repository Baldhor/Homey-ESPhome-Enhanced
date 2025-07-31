'use strict';

const connect = require('socket.io-client');
const util = require('node:util');

const QUEUE_INTERVAL_CAP = 50;
const QUEUE_INTERVAL = 1000;
const QUEUE_MAX_SIZE = 400;
const TOO_MANY_LOGS_DELAY = 6000; // Must be superior to: QUEUE_MAX_SIZE * (QUEUE_INTERVAL / QUEUE_INTERVAL_CAP)
const AUTO_DISABLE_DELAY = 6 * 60 * 60; // In seconds! => 6 hours!
const RECONNECT_DELAY = 30; // In seconds

class ConsoleReService {

    // App instance
    app = null; // If null, it means not initialized

    // Settings
    consolereEnabled = false;
    consolereChannel = '';

    consolereLogger = null;

    // logger
    disconnecting = false;
    queue = null;
    hasTooManylogs = false;
    tooManyLogsTimer = null;
    socket = null;

    // Avoid using console.re for more than 2 days
    // This timer is related to the application start on purpose
    // If the app is restarted often, then we should not turn off console.re
    timeout = null;
    timeoutTimestamp = null; // Start timestamp of the application
    timeoutInterval = 300; // seconds
    timeoutMax = 172800; // 2 days in seconds

    // Singleton
    instance = new ConsoleReService();

    autoDisableTimeout = null;

    static getInstance() {
        // Execute outside or inside the instance
        if (this.instance == null) {
            return this;
        } else {
            return this.instance;
        }
    }

    static getApp() {
        const app = this.getInstance().app;
        this.assert(app !== null, 'not initialized');
        return app;
    }

    static async init(app) {
        this.assert(app !== null, 'Initialized without an App instance');

        let instance = this.getInstance();

        instance.app = app;

        // Init queue:
        // - Doesn't autoStart: we are waiting for console.re connection to establish
        // - Concurrency of 1: we expect the logs in the right order
        // - Interval of 5 logs every one seconds: to avoid performance issues
        const pqueueModule = await import('p-queue');
        instance.queue = new pqueueModule.default({ concurrency: 1, autoStart: false, intervalCap: QUEUE_INTERVAL_CAP, interval: QUEUE_INTERVAL });

        // Import 
        const serializeErrorModule = await import('serialize-error');
        instance.serializeError = serializeErrorModule.serializeError;
        instance.deserializeError = serializeErrorModule.deserializeError;

        // init settings
        instance.initSettings();

        // Init settings listener
        instance.initSettingsListeners();

        // Init log listener
        instance.initLogListeners();

        // Init consolere logger
        instance.renewConsolereConnection();

        if (instance.buffer === null) {
            this.error('buffer is null ... but should not');
        }

        this.log('ConsoleRe is initialized');
    }

    static assert(condition, message) {
        if (!condition)
            throw new Error("Assertion failed:", message);
    }

    /**
     * This function will disable consoleReService after 2 days of consecutive 'enable state'
     * Using consecutive delay is more simple, but it's also more convenient.
     * If the application is restarted (new update, or after a crash), having consoleReService enabled is welcome.
     */
    static startAutoDisable() {
        // Get instance handle
        let instance = this.getInstance();

        // Get app handle
        let app = this.getApp();

        if (!instance.autoDisableTimeout) {
            instance.autoDisableTimeout = app.homey.setTimeout(() => {
                app.homey.settings.set('consolere.enabled', false);
                instance.consolereEnabled = false;
                instance.renewConsolereConnection();
            }, AUTO_DISABLE_DELAY * 1000);
        }
    }

    static stopAutoDisable() {
        // Get instance handle
        let instance = this.getInstance();

        // Get app handle
        let app = this.getApp();

        if (instance.autoDisableTimeout) {
            app.homey.clearTimeout(instance.autoDisableTimeout);
            instance.autoDisableTimeout = null;
        }
    }

    static initSettings() {
        // Get instance handle
        let instance = this.getInstance();

        // Get app handle
        let app = this.getApp();

        // Init settings
        let consolereEnabled = app.homey.settings.get('consolere.enabled');
        let consolereChannel = app.homey.settings.get('consolere.channel');

        if (consolereEnabled === null) {
            app.homey.settings.set('consolere.enabled', instance.consolereEnabled);
        } else {
            instance.consolereEnabled = consolereEnabled;
        }

        if (consolereChannel === null) {
            instance.consolereChannel = '';
            app.homey.settings.set('consolere.channel', instance.consolereChannel);
        } else {
            instance.consolereChannel = consolereChannel;
        }
    }

    static initSettingsListeners() {
        // Get instance handle
        let instance = this.getInstance();

        // Get app handle
        let app = this.getApp();

        // Set listener on settings
        // UIt is useless to handle unset event
        app.homey.settings.on('set', (key) => {
            switch (key) {
                case 'consolere.enabled':
                    let newConsolereEnabled = app.homey.settings.get('consolere.enabled')
                    this.log('consolere.enabled changed:', newConsolereEnabled);
                    instance.consolereEnabled = newConsolereEnabled;
                    instance.renewConsolereConnection();
                    break;

                case 'consolere.channel':
                    let newConsolereChannel = app.homey.settings.get('consolere.channel')
                    this.log('consolere.channel changed:', newConsolereChannel);
                    instance.consolereChannel = newConsolereChannel;
                    break;
            }
        });
    }

    static initLogListeners() {
        // Get instance handle
        let instance = this.getInstance();

        // Get homey handle
        let app = this.getApp();
        let homey = app.homey;

        // Set listener on __log
        homey
            .on('__log', (...args) => {
                this.sendLog('log', ...args);
            })
            .on('__error', (...args) => {
                this.sendLog('warn', ...args);
            });

        process
            .on('unhandledRejection', (reason, p) => {
                this.sendLog('warn', 'Unhandled Rejection "' + reason + '" at Promise:', p);
            })
            .on('uncaughtException', err => {
                this.sendLog('warn', 'Uncaught Exception thrown:', err.stack);
            });
    }

    static renewConsolereConnection() {
        // Get instance handle
        let instance = this.getInstance();

        if (instance.consolereEnabled) {
            instance.startAutoDisable();

            if (!instance.socket) {
                this.log('Connecting to ConsoleRe');
                instance.connect();
            } else {
                this.log('Already connected to ConsoleRe');
            }
        } else {
            instance.stopAutoDisable();

            this.log('Disconnecting from ConsoleRe');
            instance.disconnect();
        }
    }

    static connect() {
        // Get instance handle
        let instance = this.getInstance();

        instance.disconnecting = false;

        instance.socket = connect("https://console.re", {
            withCredentials: !1,
            transports: ["websocket"],
            extraHeaders: { "x-consolere": "true" }
        });

        instance.socket.on("connect", () => {
            this.log('Connected to ConsoleRe, channel:', instance.consolereChannel);

            // We can start the queue
            instance.queue && instance.queue.start();
        });

        instance.socket.on("connect_error", (error) => {
            this.error('Connection failed to ConsoleRe:', error);
        });

        instance.socket.on("reconnect_error", (error) => {
            this.error('Reconnection failed to ConsoleRe:', error);
        });

        instance.socket.on("error", (error) => {
            this.error('Error with ConsoleRe:', error);
        });

        instance.socket.on("disconnect", () => {
            if (!instance.disconnecting) {
                this.log('Disconnected from ConsoleRe, reconnecting');
                instance.getApp().homey.setTimeout(() => {
                    if(instance.consolereEnabled && !instance.disconnecting) {
                        instance.socket.connect();
                    }
                }, RECONNECT_DELAY * 1000);
            } else {
                // We should stop the queue
                instance.queue && instance.queue.pause() && instance.queue.clear();
            }
        });
    }

    static disconnect() {
        // Get instance handle
        let instance = this.getInstance();

        // We should stop and clear the queue
        instance.queue && instance.queue.pause() && instance.queue.clear();

        instance.disconnecting = true;
        if (instance.socket == null)
            return;

        instance.socket.disconnect();

        delete instance.socket;
    }

     static log(...args) {
        // Get instance handle
        let instance = this.getInstance();

        // Get app handle
        let app = this.getApp();

        app.log('[ConsoleReService]', ...args);
    }

    static error(...args) {
        // Get instance handle
        let instance = this.getInstance();

        // Get app handle
        let app = this.getApp();

        app.error('[ConsoleReService]', ...args);
    }

    static internalLog(...args) {
        this._sendLog('debug', ...args);
    }

    static internalError(...args) {
        this._sendLog('warn', ...args);
    }

    static tooManyLogs() {
        // If too big, we add a "too many logs" message and skip the log itself
        // We don't want to log the "too many logs" message too often, so we use a timer to limit its occurence

        // Get instance handle
        let instance = this.getInstance();

        // Get app handle
        let app = this.getApp();

        if (instance.hasTooManyLogs) {
            // Already sent the message recently or last message (max size + 1) is already the "too many logs" message
            return;
        }

        instance.hasTooManyLogs = true;
        instance.tooManyLogsTimer = app.homey.setTimeout(() => {
            instance.hasTooManyLogs = false;
            instance.tooManyLogsTimer = null;
        }, TOO_MANY_LOGS_DELAY);

        // Only send this log to console.re
        instance.internalError('Too many logs, some of them are not logged');
    }

    static sendLog(level, ...args) {
        // Get instance handle
        let instance = this.getInstance();

        // Check size of the queue
        if (!instance.queue) {
            return;
        } else if (level === 'debug' && instance.queue.size >= (QUEUE_MAX_SIZE - 20)) {
            // Queue is almost full, if log is debug level, just skip
            instance.tooManyLogs();
            return;
        }

        // Need go through spread or it doesn't work, no idea why
        this._sendLog(level, ...this._filterArgs(args));
    }

    static _sendLog(level, ...args) {
        // Get instance handle
        let instance = this.getInstance();

        if (!instance.consolereEnabled) {
            return;
        }
        
        if (instance.queue.size >= QUEUE_MAX_SIZE) {
            // definitively skip it
            return;
        }

        // Get homey handle
        let app = this.getApp();
        let homey = app.homey;

        // Make it more nice
        if (level === 'warn') {
            args.unshift('[red]ERROR[/red]');
        } else {
            args.unshift('[green]INFO [/green]');
        }

        (async () => {
            instance.queue.add(() => {
                // console.re may have been disabled in the meantime
                if (!instance.consolereEnabled) {
                    return;
                }

                try {
                    this.socket.emit("toServerRe", {
                        // command: null,
                        channel: instance.consolereChannel,
                        'level': 'warn',
                        args,
                        caller: { /* that's true */
                            file: "ConsoleReService.js",
                            line: 202,
                            column: 21,
                        },
                        browser: {
                            browser: {
                                f: app.id,
                                s: app.manifest.version,
                            },
                            version: homey.version,
                            OS: "Homey",
                        }
                    });
                } catch (e) {
                    // This is causing an infinite loop ???
                    // this.error('ConsoleRe emit error:', e);
                }
            });
        })();
    }

    static _filterArgs(args) {
        let newArgs = [];

        let instance = this.getInstance();

        // Let's make a deep copy and filter anything that need to be
        args.forEach(arg => {
            if (arg === undefined) {
                newArgs.push(undefined);
            } else {
                const stringifyCircularJSON = obj => {
                    const seen = new WeakSet();
                    const filterList = ['encryptionKey', 'newEncryptionKey', 'password', 'newPassword', 'bearer-token'];

                    return JSON.stringify(obj, (k, v) => {
                        if (v !== null && typeof v === 'object') {
                            if (seen.has(v)) return;
                            seen.add(v);

                            if (util.types.isNativeError(v)) {
                                return instance.serializeError(v);
                            }
                        }

                        if (filterList.includes(k)) {
                            if (v === null || v === '') {
                                return '<no value>';
                            } else {
                                return '<hidden value>';
                            }
                        }

                        return v;
                    });
                };

                let obj = JSON.parse(stringifyCircularJSON(arg));
                newArgs.push(obj);
            }
        });

        return newArgs;
    }
}

module.exports = ConsoleReService;
