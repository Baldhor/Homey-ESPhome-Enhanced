'use strict';

const connect = require('socket.io-client');

class ConsoleReService {
    // App instance
    app = null; // If null, it means not initialized

    // Settings
    consolereEnabled = false;
    consolereChannel = '';

    consolereLogger = null;

    // logger
    disconnecting = false;
    buffer = null;
    socket = null;

    // Singleton
    instance = new ConsoleReService();

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

    static init(app) {
        this.assert(app !== null, 'Initialized without an App instance');

        let instance = this.getInstance();

        instance.app = app;

        // Init buffer
        instance.buffer = require('./promise-buffer').promiseBuffer();
        instance.internalLog('constructor buffer:', instance.buffer);

        // init settings
        instance.initSettings();

        // Init settings listener
        instance.initSettingsListeners();

        // Init log listener
        instance.initLogListeners();

        // Init consolere logger
        instance.renewConsolereConnection();

        if (instance.buffer === null) {
            this.internalLog('buffer is null ... but should not');
        }

        this.internalLog('ConsoleRe is initialized');
    }

    static assert(condition, message) {
        if (!condition)
            throw new Error("Assertion failed:", message);
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
            switch(key) {
                case 'consolere.enabled':
                    let newConsolereEnabled = app.homey.settings.get('consolere.enabled')
                    instance.internalLog('consolere.enabled changed:', newConsolereEnabled);
                    instance.consolereEnabled = newConsolereEnabled;
                    instance.renewConsolereConnection();
                    break;
                
                case 'consolere.channel':
                    let newConsolereChannel = app.homey.settings.get('consolere.channel')
                    instance.internalLog('consolere.channel changed:', newConsolereChannel);
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
        homey.on('__log', (...args) => {
            instance.log(...args);
        });
    }

    static renewConsolereConnection() {
        // Get instance handle
        let instance = this.getInstance();

        if (instance.consolereEnabled) {
            if (!instance.socket) {
                instance.internalLog('Connecting to ConsoleRe');
                instance.connect();
            } else {
                instance.internalLog('Already connected to ConsoleRe');
            }
        } else {
            instance.internalLog('Disconnecting from ConsoleRe');
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
            extraHeaders:{"x-consolere":"true"}
        });

        instance.socket.on("connect", () => {
            instance.internalLog('Connected to ConsoleRe, channel:', instance.consolereChannel);
        });

        instance.socket.on("connect_error", (error) => {
            instance.internalLog('Connection failed to ConsoleRe:', error);
        });

        instance.socket.on("reconnect_error", (error) => {
            instance.internalLog('Reconnection failed to ConsoleRe:', error);
        });

        instance.socket.on("error", (error) => {
            instance.internalLog('Error with ConsoleRe:', error);
        });

        instance.socket.on("disconnect", () => {
            if (!instance.disconnecting) {
                instance.internalLog('Disconnected from ConsoleRe, reconnecting');
                instance.socket.connect();
            }
        });
    }

    static disconnect() {
        // Get instance handle
        let instance = this.getInstance();

        instance.disconnecting = true;
        if (instance.socket == null)
            return;

        instance.socket.disconnect();

        delete instance.socket;
    }

    static log(...args) {
        // Get instance handle
        let instance = this.getInstance();

        // Get homey handle
        let app = this.getApp();
        let homey = app.homey;

        // Filtering out connection attributs of object to avoid callstack overflow
        // Yes, it's very very dirty, but the socket.io-parser doesn't handle that much :)
        let i = 0;
        let len = args.length;

        for( ; i < len; i += 1 ){
            if (typeof args[i] === 'object' && args[i].connection) {
                args[i].connection = 'connection filtered to avoid stack overflow';
            }
        }

        // TODO This buffer is not limited, and start immediatly ... it should run only when the socket is connected.
        instance.buffer.push(() => {
            new Promise((resolve, reject) => {
                if (instance.socket && instance.socket.connected) {
                    try {
                        this.socket.emit("toServerRe", {
                            // command: null,
                            channel: instance.consolereChannel,
                            level: "info",
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
                        instance.internalLog('ConsoleRe emit error:', e);
                        reject('ConsoleRe emit error');
                    }
                } else {
                    // We do not log to avoid an infinite loop
                    //this.internalLog('Not connected to ConsoleRe, cannot send log');
                }
                resolve();
            });
        });
    }

    static internalLog(...args) {
        // Get homey handle
        let app = this.getApp();

        app.log(...args);
    }
}

module.exports = ConsoleReService;
