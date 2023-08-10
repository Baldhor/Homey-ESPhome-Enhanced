
/**
 * There are 2 options supported for all native_capability and inherited from the entity:
 * - config:
 *   - NONE
 *   - CONFIG : entity is meant for configuration => read and write and only from setting screen
 *   - DIAGNOSTIC : meant for diagnostic only => readonly
 * - disabled_by_default :
 *   - true : should not be shown in UI by default
 *   - false : should be shown by default
 */

/**
const NATIVE_CAPABILITY_MAPPING = Object.freeze({
    'Cover' : {
        'position' : {
            name : 'position',
            value : 'convert_to_float',
            capability : 'windowcoverings_set',
            capability_value : (native_capability) => {return native_capability.position;},
            ui_component : (native_capability) => {
                return {
                    type : 'slidder',
                    min_value : 0,
                    max_value : 1,
                    step : 0.01
                };
            },
            command : (physical_device, native_capability) => {
                await physical_device.client.connection.coverCommandService({key: native_capability.entity_id, position: native_capability.position});
            }
        },
        'tilt' : {
            name : 'tilt',
            value : 'convert_to_float',
            capability : 'windowcoverings_tilt',
            capability_value : (native_capability) => {return native_capability.tilt;},
            ui_component : (native_capability) => {
                return {
                    type : 'slidder',
                    min_value : 0,
                    max_value : 1,
                    step : 0.01
                };
            },
            command : (physical_device, native_capability) => {
                await physical_device.client.connection.coverCommandService({key: native_capability.entity_id, tilt: native_capability.tilt});
            }
        }
    },
    'Button' : { // Buttons do not publish state events
        'default' : {
            ui_component : (native_capability) => {
                return {
                    type : 'button'
                };
            },
            command : (physical_device, native_capability) => {
                await physical_device.client.connection.buttonCommandService({key: native_capability.entity_id, state: true});
            }
        }
    }, 
    'Switch' : {
        'state' : {
            name : 'onoff',
            value : 'convert_to_boolean',
            capability : 'onoff',
            capability_value : (native_capability) => {return native_capability.onoff;},
            ui_component : (native_capability) => {
                return {
                    type : 'switch'
                };
            },
            command : (physical_device, native_capability) => {
                await physical_device.client.connection.switchCommandService({key: native_capability.entity_id, state: native_capability.onoff});
            }
        }
    },
    'Sensor' : {
        'state' : {
            name : 'value',
            value : 'convert_to_float',
            options : ['unit_of_measurement', 'accuracy_decimals']
            unit_of_measurement : 'from_entity',
            accuracy_decimals : ['from_entity', 'convert_to_integer']
            capability : [
                "measure_temperature",
                "measure_co",
                "measure_co2",
                "measure_pm25",
                "measure_humidity",
                "measure_pressure",
                "measure_noise",
                "measure_rain",
                "measure_wind_strength",
                "measure_wind_angle",
                "measure_gust_strength",
                "measure_gust_angle",
                "measure_battery",
                "measure_power",
                "measure_voltage", 
                "measure_current",
                "measure_luminance", 
                "measure_ultraviolet", 
                "measure_water",
                "meter_power",
                "meter_water",
                "meter_gas",
                "meter_rain"
            ],
            capability_value : (native_capability) => {return native_capability.value;},
            ui_component : (native_capability) => {
                return {
                    type : 'text',
                    readonly : true
                };
            }
        }
    },
    'Number' : {
        'state' : {
            name : 'value',
            value : 'convert_to_float',
            options : ['min_value', 'max_value', 'step', 'mode'],
            min_value : 'from_entity',
            max_value : 'from_entity',
            step : 'from_entity',
            mode : 'from_entity' // Can be auto (slidder), box or slidder
            accuracy_decimals : ['from_entity', 'convert_to_integer']

        }
    }
})





    /**
     * Configuration setup through the wizard for a native_capability
     * A native_capability_config is: {
     *     entityId : string <unique identifier>
     *     state : string <unique name of the entity attribut>
     *     usage : NativeCapabilityUsage/string see enumeration
     *     config : {} Config options for the virtual device settings screen (defined by the wizard)
     * }
     *
    native_capability_configs = null;
=> virtual device???


const NativeCapabilityUsage = Object.freeze({
	Used: Symbol("used"), // Used by a virtual device
	Unused: Symbol("unused"), // Unused / Hidden / Useless / Ignored
    Config: Symbol("config") // Can be seen and/or modified from any virtual device linked
});
=> virtual device?


*/