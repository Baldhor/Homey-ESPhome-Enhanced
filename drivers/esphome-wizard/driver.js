'use strict';

const Homey = require('homey');
const { HomeyAPI } = require('../../bundles/homey-api');
const PhysicalDeviceManager = require('./physical-device-manager');

class Driver extends Homey.Driver {
    async onInit() {
        //TODO: To be removed!
        //this.resetConf();

        // Check for migration or init conf
        this.checkMigration();
        this.initConf();

        await this.cleanUpCapabilityOptions();

        await this.cleanUpConf();

        this.registerCustomFlowCards();

        PhysicalDeviceManager.init(this);

        // Init each physical device
        let conf = this.getConf();
        conf.forEach(physicalDevice => {
            PhysicalDeviceManager.create(true, physicalDevice.physicalDeviceId, physicalDevice.name, physicalDevice.ipAddress, physicalDevice.port, physicalDevice.encryptionKey, physicalDevice.password);
        });

        this.log('ESPhomeWizard initialized');
    }

    async cleanUpCapabilityOptions() {
        this.log('cleanUpCapabilityOptions');

        // Need to clean up all devices capability options, because of a past bug in the edit capability page
        // The options must not contains null or empty string values

        this.getDevices().forEach(virtualDevice => {
            virtualDevice.getCapabilities().forEach(capabilityId => {
                let capabilityOptions = virtualDevice.getCapabilityOptions(capabilityId);
                let cleanedCapabilityOptions = {};

                Object.keys(capabilityOptions).forEach(key => {
                    if (capabilityOptions[key] !== null && capabilityOptions[key] !== "") {
                        cleanedCapabilityOptions[key] = capabilityOptions[key];
                    }
                });

                virtualDevice.setCapabilityOptions(capabilityId, cleanedCapabilityOptions);
            });
        })
    }

    async cleanUpConf() {
        this.log('cleanUpConf');

        // Go through all the virtual devices, to build up the list of usefull physical device ids
        // Then remove useless physical device ids from the conf

        // Find the list of physical device ids
        let listPhysicalDeviceIds = [];
        this.getDevices().forEach(virtualDevice => {
            let capabilityKeysV2 = virtualDevice.getStoreValue('capabilityKeysV2');

            // Maybe there are no capabilities
            if (capabilityKeysV2 !== null) {
                Object.keys(capabilityKeysV2).forEach(capabilityKeyV2 => {
                    let capabilityValueV2 = capabilityKeysV2[capabilityKeyV2];
                    if (!listPhysicalDeviceIds.includes(capabilityValueV2.physicalDeviceId)) {
                        listPhysicalDeviceIds.push(capabilityValueV2.physicalDeviceId);
                    }
                });
            }
        });

        let conf = this.getConf();
        for (let i = conf.length - 1; i >= 0; --i) {
            if (!listPhysicalDeviceIds.includes(conf[i].physicalDeviceId)) {
                // We can remove it
                this.log("Removing a physical device from conf (useless): ", conf[i].physicalDeviceId);
                let physicalDevice = PhysicalDeviceManager.getById(conf[i].physicalDeviceId);
                if (physicalDevice !== undefined) {
                    PhysicalDeviceManager._delete(PhysicalDeviceManager.getById(conf[i].physicalDeviceId));
                }
                conf.splice(i, 1);
            }
        }
        this.setConf(conf);
    }

    registerCustomFlowCards() {
        let myCard = null;

        // esphome_text
        {
            // trigger card esphome_text_changed
            //   args: capability_name
            //   tokens: none
            myCard = this.homey.flow.getDeviceTriggerCard('esphome_text_changed');

            myCard.registerArgumentAutocompleteListener('capability_name', async (query, args) => {
                args.device.log('argumentAutocompleteListener:', 'esphome_text_changed', 'capability_name', query);

                // Returns the compatible capabilities
                return this._getAutocompleteCapabilityNames(args.device, false).filter(e => e.name.toLowerCase().includes(query.toLowerCase()));
            });
            myCard.registerRunListener(async (args, state) => {
                args.device.log('runListener:', 'esphome_text_changed', args.capability_name, state);

                // Make sure the selected capability is concerned by the trigger
                return args.capability_name.capabilityId === state.capabilityId;
            });

            // trigger card esphome_text_changed_to
            //   args: capability_name, value
            //   tokens: none
            myCard = this.homey.flow.getDeviceTriggerCard('esphome_text_changed_to');

            myCard.registerArgumentAutocompleteListener('capability_name', async (query, args) => {
                args.device.log('argumentAutocompleteListener:', 'esphome_text_changed_to', 'capability_name', query);

                // Returns the compatible capabilities
                return this._getAutocompleteCapabilityNames(args.device, false).filter(e => e.name.toLowerCase().includes(query.toLowerCase()));
            });
            myCard.registerArgumentAutocompleteListener('value', async (query, args) => {
                args.device.log('argumentAutocompleteListener:', 'esphome_text_changed_to', 'value', query, args.capability_name);

                // Returns the compatible capabilities
                if (args.capability_name !== 'undefined') {
                    return this._getAutocompleteCapabilityValues(args.device, args.capability_name.capabilityId, query);
                } else {
                    return [];
                }
            });
            myCard.registerRunListener(async (args, state) => {
                args.device.log('runListener:', 'esphome_text_changed_to', args.capability_name, args.value, state);

                // Make sure the selected capability is concerned by the trigger
                return args.capability_name.capabilityId === state.capabilityId && this._convertValueForRunListener(args.device, state.capabilityId, args.value.name) === state.value;
            });

            // condition card esphome_text_condition
            //   args: capability_name, value
            //   tokens: none
            myCard = this.homey.flow.getConditionCard('esphome_text_condition');

            myCard.registerArgumentAutocompleteListener('capability_name', async (query, args) => {
                args.device.log('argumentAutocompleteListener:', 'esphome_text_condition', 'capability_name', query);

                // Returns the compatible capabilities
                return this._getAutocompleteCapabilityNames(args.device, false).filter(e => e.name.toLowerCase().includes(query.toLowerCase()));
            });
            myCard.registerArgumentAutocompleteListener('value', async (query, args) => {
                args.device.log('argumentAutocompleteListener:', 'esphome_text_condition', 'value', query, args.capability_name);

                // Returns the compatible capabilities
                if (args.capability_name !== 'undefined') {
                    return this._getAutocompleteCapabilityValues(args.device, args.capability_name.capabilityId, query);
                } else {
                    return [];
                }
            });
            myCard.registerRunListener(async (args, state) => {
                args.device.log('runListener:', 'esphome_text_condition', args.capability_name, state);

                // Make sure the selected capability current value match the condition
                args.device.log('current value:', args.device.getCapabilityValue(args.capability_name.capabilityId));
                return this._convertValueForRunListener(args.device, args.capability_name.capabilityId, args.value.name) === args.device.getCapabilityValue(args.capability_name.capabilityId);
            });

            // action card esphome_text_setvalue
            //   args: capability_name, value
            //   tokens: none
            myCard = this.homey.flow.getActionCard('esphome_text_setvalue');

            myCard.registerArgumentAutocompleteListener('capability_name', async (query, args) => {
                args.device.log('argumentAutocompleteListener:', 'esphome_text_setvalue', 'capability_name', query);

                // Returns the compatible capabilities
                return this._getAutocompleteCapabilityNames(args.device, true).filter(e => e.name.toLowerCase().includes(query.toLowerCase()));
            });
            myCard.registerArgumentAutocompleteListener('value', async (query, args) => {
                args.device.log('argumentAutocompleteListener:', 'esphome_text_setvalue', 'value', query, args.capability_name);

                // Returns the compatible capabilities
                if (args.capability_name !== 'undefined') {
                    return this._getAutocompleteCapabilityValues(args.device, args.capability_name.capabilityId, query);
                } else {
                    return [];
                }
            });
            myCard.registerRunListener(async (args) => {
                args.device.log('runListener:', 'esphome_text_setvalue', args.capability_name, args.value);

                // Apply the modification
                args.device.capabilityListener(args.capability_name.capabilityId, this._convertValueForRunListener(args.device, args.capability_name.capabilityId, args.value.name));

                return true;
            });
        }
    }

    _getAutocompleteCapabilityNames(device, writeRequired) {
        device.log('_getAutocompleteCapabilityNames:', writeRequired);

        let results = [];

        device.getCapabilities().forEach(capabilityId => {
            let capabilityOptions = device.getCapabilityOptions(capabilityId);

            // If writeRequired is true, need to check if the capability is readOnly
            if (writeRequired) {
                let capabilityKeysV2 = device.getStoreValue('capabilityKeysV2');
                let capabilityValueV2 = capabilityKeysV2[capabilityId];

                if (capabilityValueV2 === undefined) {
                    this.error("Cannot find stored values for capabilityId:", capabilityId, "for virtual device:", device.getId());
                    return;
                }

                let physicalDevice = PhysicalDeviceManager.getById(capabilityValueV2.physicalDeviceId);
                let nativeCapability = physicalDevice.nativeCapabilities[capabilityValueV2.nativeCapabilityId];

                if (nativeCapability.configs.readOnly === true) {
                    return;
                }
            }

            results.push({
                name: capabilityOptions.title ?? capabilityId,
                'capabilityId': capabilityId
            });
        });

        return results;
    }

    _getAutocompleteCapabilityValues(device, capabilityId, query) {
        device.log('_getAutocompleteCapabilityValues:', capabilityId, query);

        let capabilityType = capabilityId.split(".")[0];

        // Build values list
        let results = [];
        let capabilityKeysV2 = device.getStoreValue('capabilityKeysV2');
        let capabilityValueV2 = capabilityKeysV2[capabilityId];
        let physicalDevice = PhysicalDeviceManager.getById(capabilityValueV2.physicalDeviceId);
        let nativeCapability = physicalDevice.nativeCapabilities[capabilityValueV2.nativeCapabilityId];

        if (capabilityType.startsWith("esphome_enum_")) {
            // List of values
            nativeCapability.getConstraint('values').forEach(value => {
                results.push({
                    name: value
                });
            });

            // If a value match, filter the result, otherwise, show all possible values
            if (results.filter(e => e.name.toLowerCase().includes(query.toLowerCase())).length > 0) {
                results = results.filter(e => e.name.toLowerCase().includes(query.toLowerCase()));
            }
        } else {
            switch (nativeCapability.constraints.type) {
                case 'boolean':
                    // TODO: Can translate?
                    results.push({
                        name: 'true'
                    });
                    results.push({
                        name: 'false'
                    });
                    break;

                case 'number':
                    let fixedValue = parseFloat(query.replace(',', '.'));
                    // If NaN, let's add a default value
                    if (isNaN(fixedValue)) {
                        if (nativeCapability.constraints.min !== undefined && nativeCapability.constraints.max !== undefined) {
                            fixedValue = nativeCapability.constraints.min + (nativeCapability.constraints.max - nativeCapability.constraints.min) / 2;
                        } else if (['windowcoverings_set', 'dim'].includes(capabilityType)) {
                            fixedValue = 0.5;
                        } else {
                            fixedValue = 0;
                        }
                    }

                    // Apply min max
                    if (nativeCapability.constraints.min !== undefined) {
                        if (fixedValue < nativeCapability.constraints.min) {
                            fixedValue = nativeCapability.constraints.min;
                        }
                        // Propose min value
                        results.push({
                            name: nativeCapability.constraints.min.toString(),
                            description: 'Min (' + nativeCapability.constraints.min + ')'
                        });
                    }
                    if (nativeCapability.constraints.max !== undefined) {
                        if (fixedValue > nativeCapability.constraints.max) {
                            fixedValue = nativeCapability.constraints.max;
                        }
                        // Propose max value
                        results.push({
                            name: nativeCapability.constraints.max.toString(),
                            description: 'Max (' + nativeCapability.constraints.max + ')'
                        });
                    }

                    // Apply precision
                    if (nativeCapability.configs.precision !== undefined) {
                        if (nativeCapability.configs.precision === 0) {
                            fixedValue = parseInt(fixedValue, 10);
                        } else {
                            fixedValue = parseFloat(parseInt(fixedValue * Math.pow(10, nativeCapability.configs.precision))) / Math.pow(10, nativeCapability.configs.precision);
                        }
                    }

                    // dim case
                    if (['windowcoverings_set', 'windowcoverings_tilt_set', 'dim', 'volume_set'].includes(capabilityType)) {
                        // Value should be in range 0 to 1
                        if (fixedValue < 0) {
                            fixedValue = 0;
                        } else if (fixedValue > 1) {
                            fixedValue = 1;
                        }

                        // Add open and closed values
                        // TODO: Can translate?
                        results.push({
                            name: 'open',
                            description: 'Open/Max (1)'
                        });
                        results.push({
                            name: 'closed',
                            description: 'Closed/Min (0)'
                        });
                    }

                    // If good, propose the value, if in between, propose above and below values!
                    if (nativeCapability.constraints.step !== undefined) {
                        let remains = fixedValue % nativeCapability.constraints.step;

                        if (remains === 0) {
                            // Do not propose it if it's min or max value; min and max are already proposed above!
                            if ((nativeCapability.constraints.min === undefined || nativeCapability.constraints.min !== fixedValue) && (nativeCapability.constraints.max === undefined || nativeCapability.constraints.max !== fixedValue)) {
                                results.push({
                                    name: fixedValue.toString()
                                });
                            }
                        } else {
                            results.push({
                                name: (fixedValue - remains).toString()
                            });
                            results.push({
                                name: (fixedValue - remains + nativeCapability.constraints.step).toString()
                            });
                        }
                    } else {
                        results.push({
                            name: fixedValue.toString()
                        });
                    }

                    break;

                case 'string':
                    if (query === "") {
                        results.push({
                            name: query,
                            description: "Empty"
                        });
                    } else {
                        results.push({
                            name: query
                        });
                    }
                    break;

                default:
                    this.log('unsupported type:', nativeCapability.constraints.type);
            }

        }

        // Returns the compatible capabilities
        return results;
    }

    _convertValueForRunListener(device, capabilityId, value) {
        device.log('_convertValueForRunListener:', capabilityId, value);

        let capabilityType = capabilityId.split(".")[0];

        // Need to convert the value?
        let fixedValue = value;

        let capabilityKeysV2 = device.getStoreValue('capabilityKeysV2');
        let capabilityValueV2 = capabilityKeysV2[capabilityId];
        let physicalDevice = PhysicalDeviceManager.getById(capabilityValueV2.physicalDeviceId);
        let nativeCapability = physicalDevice.nativeCapabilities[capabilityValueV2.nativeCapabilityId];

        switch (nativeCapability.constraints.type) {
            case 'boolean':
                if (value === 'true') {
                    fixedValue = true;
                } else if (value === 'false') {
                    fixedValue = false;
                }
                break;

            case 'number':
                // dim case
                if (['windowcoverings_set', 'windowcoverings_tilt_set', 'dim', 'volume_set'].includes(capabilityType)) {
                    if (value === 'open') {
                        fixedValue = parseFloat(1);
                    } else if (value === 'closed') {
                        fixedValue = parseFloat(0);
                    } else {
                        fixedValue = parseFloat(value);
                    }
                } else {
                    fixedValue = parseFloat(value);
                }
                break;
        }

        return fixedValue;
    }

    async onPair(session) {
        await this.initHomeyApi(session);

        session.setHandler('logme', (data) => {
            try {
                this.log('browser log:', ...Object.values(data));
            } catch (e) {
                this.error(e);
                throw e;
            }
        });

        session.setHandler('set-bearer-token', async (data) => {
            this.log('set-bearer-token');

            await this.initAuthentifiedHomeyApi(session, data.bearerToken);
        });

        /**
         * Get the initial_configuration
         * 
         * return: refer to pair/readme.md
         */
        session.setHandler('get-configuration', async () => {
            this.log('get-configuration started');

            let listVirtualDevices = [];
            let listPhysicalDevices = [];

            try {
                // Loop on all virtual devices
                for (const virtualDevice of this.getDevices()) {
                    this.log('Processing device:', virtualDevice);

                    let tmpVirtualDevice = {
                        'virtualDeviceId': virtualDevice.getId(),
                        'internalDeviceId': virtualDevice.getData().id, // Only used post creation of a new virtual device
                        'initial': {
                            name: virtualDevice.getName(),
                            zoneId: await this.getDeviceZone(session, virtualDevice),
                            class: virtualDevice.getClass(),
                            status: 'unmodified',
                            capabilities: []
                        },
                        'current': null
                    };

                    // Capabilities are: <capabilityType>[.<index>]
                    let capabilityKeysV2 = virtualDevice.getStoreValue('capabilityKeysV2');
                    // Maybe there are no capabilities
                    if (capabilityKeysV2 !== null) {
                        Object.keys(capabilityKeysV2).forEach(capabilityKey => {
                            let capabilityValueV2 = capabilityKeysV2[capabilityKey];

                            this.log('capabilityValueV2:', capabilityValueV2);
                            let tmpCapability = {
                                capabilityId: capabilityKey,
                                type: capabilityKey.split(".")[0],
                                index: capabilityKey.split(".").length > 1 ? capabilityKey.split(".")[1] : '1',
                                status: 'unmodified',
                                options: virtualDevice.getCapabilityOptions(capabilityKey),
                                physicalDeviceId: capabilityValueV2.physicalDeviceId,
                                nativeCapabilityId: capabilityValueV2.nativeCapabilityId
                            };

                            tmpVirtualDevice.initial.capabilities.push(tmpCapability);
                        });
                    }

                    tmpVirtualDevice.current = tmpVirtualDevice.initial;

                    listVirtualDevices.push(tmpVirtualDevice);
                }

                // Retrieve driver settings
                let conf = this.getConf();
                conf.forEach(physicalDevice => {
                    let realPhysicalDevice = PhysicalDeviceManager.getById(physicalDevice.physicalDeviceId);

                    let tmpPhysicalDevice = {
                        physicalDeviceId: physicalDevice.physicalDeviceId,
                        status: realPhysicalDevice.available === true ? 'available' : 'unavailable',
                        used: this.getDevices().filter(virtualDevice => virtualDevice.getStoreValue('capabilityKeysV2') === null ? 0 : Object.values(virtualDevice.getStoreValue('capabilityKeysV2')).filter(capabilityKeyV2 => capabilityKeyV2.physicalDeviceId === physicalDevice.physicalDeviceId).length > 0).length > 0,
                        name: physicalDevice.name,
                        ipAddress: physicalDevice.ipAddress,
                        port: physicalDevice.port,
                        encryptionKey: physicalDevice.encryptionKey,
                        password: physicalDevice.password,
                        nativeCapabilities: [],
                        rawData: realPhysicalDevice.getRawData()
                    };

                    Object.values(realPhysicalDevice.nativeCapabilities).forEach(nativeCapability => {
                        // The same capability can be used several times on the same virtual device!
                        // We cannot use a simple filter on the virtual device list
                        let countUsed = 0;
                        this.getDevices().forEach(virtualDevice => {
                            countUsed += virtualDevice.getStoreValue('capabilityKeysV2') === null ? 0 : Object.values(virtualDevice.getStoreValue('capabilityKeysV2')).filter(capabilityKeysV2 => capabilityKeysV2.nativeCapabilityId === nativeCapability.getId()).length;
                        });

                        tmpPhysicalDevice.nativeCapabilities.push({
                            nativeCapabilityId: nativeCapability.getId(),
                            entityId: nativeCapability.entityId,
                            attribut: nativeCapability.attribut,
                            entityName: nativeCapability.entityName,
                            type: nativeCapability.type,
                            used: countUsed,
                            value: nativeCapability.value,
                            configs: nativeCapability.configs,
                            constraints: nativeCapability.constraints,
                            specialCase: nativeCapability.specialCase
                        });
                    });

                    listPhysicalDevices.push(tmpPhysicalDevice);
                });
            } catch (e) {
                this.error(e);
                throw e;
            }

            let result = {
                'versions': {
                    'platform': this.homey.platform,
                    'platformVersion': this.homey.platformVersion,
                    'version': this.homey.version,
                    'appVersion': this.homey.manifest.version
                },
                'listVirtualDevices': listVirtualDevices,
                'listPhysicalDevices': listPhysicalDevices,
                'listZones': await this.getAllZones(session)
            };

            this.log('result:', result);

            return result;
        });

        session.setHandler('get-console-re', () => {
            this.log('get-console-re');

            let result = undefined;
            try {
                let channel = this.homey.settings.get('consolere.channel');
                let enabled = this.homey.settings.get('consolere.enabled');

                if (channel !== undefined && enabled !== undefined) {
                    result = {
                        'channel': channel,
                        'enabled': enabled
                    }
                }
            } catch (e) {
                this.log(e);
                throw e;
            }

            this.log('result:', result);

            return result;
        });

        session.setHandler('set-console-re', (data) => {
            this.log('set-console-re:', data);

            try {
                this.homey.settings.set('consolere.channel', data.channel);
                this.homey.settings.set('consolere.enabled', data.enabled);
            } catch (e) {
                this.log(e);
                throw e;
            }
        });

        session.setHandler('modify-physical-device', (data) => {
            this.log('modify-physical-device:', data);

            try {
                let conf = this.getConf();
                let physicalDeviceConf = conf.find((physicalDevice) => physicalDevice.physicalDeviceId === data.physicalDeviceId);

                if (physicalDeviceConf === undefined) {
                    throw new Error('Cannot find physical device');
                }

                physicalDeviceConf.name = data.name;
                physicalDeviceConf.ipAddress = data.ipAddress;
                physicalDeviceConf.port = data.port;
                physicalDeviceConf.encryptionKey = data.encryptionKey;
                physicalDeviceConf.password = data.password;

                this.setConf(conf);

                let physicalDevice = PhysicalDeviceManager.getById(physicalDeviceConf.physicalDeviceId);
                PhysicalDeviceManager._delete(physicalDevice);
                PhysicalDeviceManager.create(true, physicalDeviceConf.physicalDeviceId, physicalDeviceConf.name, physicalDeviceConf.ipAddress, physicalDeviceConf.port, physicalDeviceConf.encryptionKey, physicalDeviceConf.password);
            } catch (e) {
                this.log(e);
                throw e;
            }
        });

        session.setHandler('connect-new-device', async (data) => {
            this.log('connect-new-device:', data);

            try {
                // Why? PairSession can end without notice, and so the physicalDevice created previosuly may not be cleaned up
                await this.cleanUpConf();

                // Check if physical device already exist
                let existingPhysicalDevice = PhysicalDeviceManager.get(data.ipAddress, data.port);
                if (existingPhysicalDevice) {
                    session.emit('new-device-failed', 'A physical device already exist')
                        .catch(e => {
                            // Session expired, just ignore it
                            this.error('Failed to connect with device before pair session expired:', data);
                        });
                    return;
                }

                // Create a new physical device and add listeners
                PhysicalDeviceManager.create(false, data.physicalDeviceId, data.name, data.ipAddress, data.port, data.encryptionKey, data.password);

                PhysicalDeviceManager.getById(data.physicalDeviceId).on('available', async () => {
                    this.log('Received available event');

                    // Just wait 5 seconds to ensure we can retrieve some current values
                    setTimeout(() => {
                        let realPhysicalDevice = PhysicalDeviceManager.getById(data.physicalDeviceId);

                        let tmpPhysicalDevice = {
                            'physicalDeviceId': data.physicalDeviceId,
                            status: 'new',
                            used: this.getDevices().filter(virtualDevice => virtualDevice.getStoreValue('capabilityKeysV2') !== null && Object.values(virtualDevice.getStoreValue('capabilityKeysV2')).filter(capabilityKeyV2 => capabilityKeyV2.physicalDeviceId === data.physicalDeviceId).length > 0).length > 0,
                            name: realPhysicalDevice.name,
                            ipAddress: data.ipAddress,
                            port: data.port,
                            encryptionKey: data.encryptionKey,
                            password: data.password,
                            nativeCapabilities: [],
                            rawData: realPhysicalDevice.getRawData()
                        };

                        Object.values(realPhysicalDevice.nativeCapabilities).forEach(nativeCapability => {
                            // The same capability can be used several times on the same virtual device!
                            // We cannot use a simple filter on the virtual device list
                            let countUsed = 0;
                            this.getDevices().forEach(virtualDevice => {
                                countUsed += virtualDevice.getStoreValue('capabilityKeysV2') === null ? 0 : Object.values(virtualDevice.getStoreValue('capabilityKeysV2')).filter(capabilityKeysV2 => capabilityKeysV2.nativeCapabilityId === nativeCapability.getId()).length;
                            });

                            tmpPhysicalDevice.nativeCapabilities.push({
                                nativeCapabilityId: nativeCapability.getId(),
                                entityId: nativeCapability.entityId,
                                attribut: nativeCapability.attribut,
                                entityName: nativeCapability.entityName,
                                type: nativeCapability.type,
                                used: countUsed,
                                value: nativeCapability.value,
                                configs: nativeCapability.configs,
                                constraints: nativeCapability.constraints,
                                specialCase: nativeCapability.specialCase
                            });
                        });


                        session.emit('new-device-connected', tmpPhysicalDevice)
                            .catch(e => {
                                // Session expired, cleaning up
                                this.error('Connected to device, but the pair session expired:', data);
                            });
                        PhysicalDeviceManager._delete(realPhysicalDevice);
                    }, 5000);
                });

                PhysicalDeviceManager.getById(data.physicalDeviceId).on('unavailable', () => {
                    this.error('Received unavailable event');

                    session.emit('new-device-failed', {
                        'physicalDeviceId': data.physicalDeviceId,
                        message: 'Could not connect to the device, or something went wrong'
                    }).catch(e => {
                        // Session expired, just ignore it
                    });
                    PhysicalDeviceManager._delete(PhysicalDeviceManager.getById(data.physicalDeviceId));
                });
            } catch (e) {
                this.error(e);
                throw e;
            } finally {
                this.log('connect-new-device finished');
            }
        });

        session.setHandler('update-virtual-device', async (data) => {
            this.log('update-virtual-device:', data);

            let virtualDevice = data.virtualDevice;

            try {
                await this.updateDevice(session, virtualDevice.virtualDeviceId, {
                    name: virtualDevice.name,
                    zoneId: virtualDevice.zoneId,
                    classId: virtualDevice.classId
                });
            } catch (e) {
                this.error(e);
                throw e;
            } finally {
                this.log('update-virtual-device finished');
            }
        });

        session.setHandler('delete-virtual-device', async (data) => {
            this.log('delete-virtual-device:', data);

            let virtualDeviceId = data.virtualDeviceId;

            try {
                await this.deleteDevice(session, virtualDeviceId);

                // Just in case a physical device became useless
                await this.cleanUpConf();
            } catch (e) {
                this.error(e);
                throw e;
            } finally {
                this.log('delete-virtual-device finished');
            }
        });

        session.setHandler('apply-capability', async (data) => {
            this.log('apply-capability:', data);

            let virtualDeviceId = data.virtualDeviceId;
            let action = data.action;
            let capability = data.capability;
            let physicalDevice = data.physicalDevice;

            try {
                let virtualDevice = this.getDevices().find(virtualDevice => virtualDevice.getId() === virtualDeviceId);
                if (virtualDevice === undefined) {
                    throw new Error("Cannot find virtualDevice:", virtualDeviceId);
                }

                // Add the physical device (if needed)
                this._addPhysicalDevice(physicalDevice);

                if (action === 'edit' && capability.initialCapabilityId === capability.capabilityId) {
                    // Modification but capabilityId remains the same!
                    // For whatever reason, we cannot remove/add the capability, we need to modify it

                    virtualDevice._unsetupCapability(capability.capabilityId);

                    // Modify the capabilityKeys (different physical device and/or native capability)
                    let capabilityKeysV2 = virtualDevice.getStoreValue('capabilityKeysV2');
                    capabilityKeysV2[capability.capabilityId] = {
                        physicalDeviceId: capability.physicalDeviceId,
                        nativeCapabilityId: capability.nativeCapabilityId
                    };
                    virtualDevice.setStoreValue('capabilityKeysV2', capabilityKeysV2)
                        .catch(e => { throw e; });

                    virtualDevice.setCapabilityOptions(capability.capabilityId, capability.options)
                        .catch(e => { throw e; });

                    virtualDevice._setupCapability(capability.capabilityId);

                    // Just in case a physical device became useless
                    await this.cleanUpConf();
                } else {
                    // Remove the old capability
                    if (action === "edit") {
                        virtualDevice._unsetupCapability(capability.initialCapabilityId);

                        // Remove capabilityKeys
                        let capabilityKeysV2 = virtualDevice.getStoreValue('capabilityKeysV2');
                        delete capabilityKeysV2[capability.initialCapabilityId];
                        virtualDevice.setStoreValue('capabilityKeysV2', capabilityKeysV2)
                            .catch(e => { throw e; });

                        // Remove capability
                        virtualDevice.removeCapability(capability.initialCapabilityId)
                            .catch(e => { throw e; });

                        // Remove the capability listener
                        virtualDevice._removeCapabilityListener(capability.initialCapabilityId);
                    }

                    // Add the new capability
                    virtualDevice.addCapability(capability.capabilityId)
                        .catch(e => { throw e; });
                    virtualDevice.setCapabilityOptions(capability.capabilityId, capability.options)
                        .catch(e => { throw e; });

                    // Add the capabilityKeys
                    let capabilityKeysV2 = virtualDevice.getStoreValue('capabilityKeysV2');
                    if (capabilityKeysV2 === null) {
                        capabilityKeysV2 = {};
                    }
                    capabilityKeysV2[capability.capabilityId] = {
                        physicalDeviceId: capability.physicalDeviceId,
                        nativeCapabilityId: capability.nativeCapabilityId
                    };
                    virtualDevice.setStoreValue('capabilityKeysV2', capabilityKeysV2)
                        .catch(e => { throw e; });

                    virtualDevice._setupCapability(capability.capabilityId);
                }

                // Update virtualDevice availability
                await virtualDevice._checkAvailability().catch(this.error);
            } catch (e) {
                this.error(e);
                throw e;
            } finally {
                this.log('apply-capability finished');
            }
        });

        session.setHandler('delete-capability', async (data) => {
            this.log('delete-capability:', data);

            let virtualDeviceId = data.virtualDeviceId;
            let capabilityId = data.capabilityId;

            try {
                let virtualDevice = this.getDevices().find(virtualDevice => virtualDevice.getId() === virtualDeviceId);
                if (virtualDevice === undefined) {
                    throw new Error("Cannot find virtualDevice:", virtualDeviceId);
                }

                // Remove the capabilityKeys
                let capabilityKeysV2 = virtualDevice.getStoreValue('capabilityKeysV2');
                delete capabilityKeysV2[capabilityId];
                virtualDevice.setStoreValue('capabilityKeysV2', capabilityKeysV2)
                    .catch(e => { throw e; });

                virtualDevice.removeCapability(capabilityId);

                // Just in case a physical device became useless
                await this.cleanUpConf();

                // Update virtualDevice availability
                await virtualDevice._checkAvailability().catch(this.error);
            } catch (e) {
                this.error(e);
                throw e;
            } finally {
                this.log('delete-capability finished');
            }
        });
    }

    _addPhysicalDevice(physicalDevice) {
        this.log('_addPhysicalDevice:', ...arguments);

        let conf = this.getConf();

        // Check if the physical device already exist
        if (!conf.find(oneConf => oneConf.physicalDeviceId === physicalDevice.physicalDeviceId)) {
            conf.push(physicalDevice);
            this.setConf(conf);
            PhysicalDeviceManager.create(true, physicalDevice.physicalDeviceId, physicalDevice.name, physicalDevice.ipAddress, physicalDevice.port, physicalDevice.encryptionKey, physicalDevice.password);
        }
    }

    /***********************
     * Check migration from wizard v1 to v2
     ***********************/
    checkMigration() {
        // If confStore is empty and it exists at least one virtual device, then we need to migrate
        if (this.getConf() !== null || this.getDevices().length === 0) {
            return;
        }

        // Need to migration
        let conf = [];
        let physicalDeviceIndex = 1;

        this.getDevices().forEach(virtualDevice => {
            // Get physical device settings
            let settings = virtualDevice.getSettings();
            let ipAddress = settings.ipAddress;
            let port = settings.port;
            let encryptionKey = settings.encryptionKey;
            let password = settings.password;

            // Make a new identifier for this physical device
            let physicalDeviceId = 'migrated' + physicalDeviceIndex;
            ++physicalDeviceIndex;

            // Add the physical device to the conf
            conf.push({
                'physicalDeviceId': physicalDeviceId,
                'name': physicalDeviceId,
                'ipAddress': ipAddress,
                'port': port,
                'encryptionKey': encryptionKey,
                'password': password
            });

            // Migrate the capabilityKeys
            let capabilityKeysV1 = virtualDevice.getStoreValue('capabilityKeys');

            // Maybe it doesn't have any capabilities
            if (capabilityKeysV1 !== null) {
                let capabilityKeysV2 = {};
                Object.keys(capabilityKeysV1).forEach(capabilityKey => {
                    if (capabilityKeysV2[capabilityKey] === undefined) {
                        capabilityKeysV2[capabilityKey] = {
                            physicalDeviceId: physicalDeviceId,
                            nativeCapabilityId: capabilityKeysV1[capabilityKey]
                        }
                    }
                });
                virtualDevice.setStoreValue('capabilityKeysV2', capabilityKeysV2);
            } else {
                // no capabilities => no physical devices!
                return;
            }

            // Finaly store the new conf
            this.setConf(conf);
        });
    }

    /***********************
     * CONF functions
     * Current version: V2
     ***********************/

    /**
     * conf structure:
     *  [
     *      {
     *          physicalDeviceId: string Unique physical device identifier
     *          name: string Pretty name
     *          ipAddress: string
     *          port: string
     *          encryptionKey: string (nullable)
     *          password: string (nullable)
     *      }
     *  ]
     */

    /**
     * This function is used during test of the new driver
     * It resets the conf store to null, and next restart of the driver (of the app) will migrate it again
     */
    resetConf() {
        this.homey.settings.unset('listPhysicalDevicesV2');
    }

    /**
     * This function init the conf is it doesn't exist
     */
    initConf() {
        let conf = this.getConf();

        if (conf === null) {
            this.setConf([]);
        }
    }

    getConf() {
        return this.homey.settings.get('listPhysicalDevicesV2');
    }

    setConf(conf) {
        this.homey.settings.set('listPhysicalDevicesV2', conf);
    }


    /***********************
     * HomeyAPI functions
     ***********************/

    async initHomeyApi(session) {
        // Used during pairSession

        if (session.homeyApi === undefined) {
            session.homeyApi = null;
            session.authentifiedHomeyApi = null;

            session.homeyApi = await HomeyAPI.createAppAPI({
                homey: this.homey
            });
        }
    }

    async initAuthentifiedHomeyApi(session, token) {
        let authentifiedHomeyApi = await HomeyAPI.createLocalAPI({
            address: "http://127.0.0.1",
            'token': token
        });

        // Let's test it!
        try {
            let apiDevice = await authentifiedHomeyApi.zones.getZones();
        } catch (e) {
            // Seems invalid
            throw e;
        }

        // Seems valid
        session.authentifiedHomeyApi = authentifiedHomeyApi;
    }

    async updateDevice(session, virtualDeviceId, data) {
        this.log('updateDevice:', ...arguments);

        try {
            // Need to retrieve the homey id of the device
            let realDevice = this.getDevices().find(device => device.getId() === virtualDeviceId);
            if (realDevice === undefined) {
                throw new Error('Could not find the device to delete:', virtualDeviceId);
            }

            if (data.name !== undefined && (data.name !== realDevice.getName() || data.zoneId !== await this.getDeviceZone(session, realDevice))) {
                await session.authentifiedHomeyApi.devices.updateDevice({
                    id: realDevice.getId(),
                    device: {
                        name: data.name,
                        zone: data.zoneId
                    }
                });
            }

            if (data.classId !== realDevice.getClass()) {
                realDevice.setClass(data.classId);
            }
        } catch (e) {
            throw e;
        }
    }

    async deleteDevice(session, virtualDeviceId) {
        this.log('deleteDevice:', ...arguments);

        try {
            // Need to retrieve the homey id of the device
            let realDevice = this.getDevices().find(device => device.getId() === virtualDeviceId);
            if (realDevice === undefined) {
                throw new Error('Could not find the device to delete:', virtualDeviceId);
            }

            await session.authentifiedHomeyApi.devices.deleteDevice({
                id: realDevice.getId()
            });
        } catch (e) {
            throw e;
        }
    }

    async getDeviceZone(session, device) {
        this.log('getDeviceZone:', ...arguments);

        try {
            let apiDevice = await session.homeyApi.devices.getDevice({
                id: device.getId()
            });
            let apiZone = await apiDevice.getZone();
            let zoneId = apiZone.id;
            this.log('zoneId:', zoneId);
            return zoneId;
        } catch (e) {
            throw e;
        }
    }

    async getAllZones(session) {
        this.log('getAllZones');

        try {
            let zones = [];
            for (const zone of Object.values(await session.homeyApi.zones.getZones())) {
                this.log('processing zone:', zone);
                zones.push({
                    zoneId: zone.id,
                    name: zone.name,
                    parent: zone.parent,
                    order: zone.order
                });
            }
            this.log('zones:', zones);
            return zones;
        } catch (e) {
            throw e;
        }
    }

}

module.exports = Driver;
