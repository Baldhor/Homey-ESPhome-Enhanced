// Kind of a global variable ...
// The list is compiled from the sdk : https://apps-sdk-v3.developer.homey.app/tutorial-device-capabilities.html
// I skiped some of them (lazy / cannot test them)
// Added 2 customs : number and text
CAPABILITY_CONFIGURATION = [
    {
        type: 'number',
        valueType: 'number',
        getable: true,
        setable: true,
        quickaction: false,
        uielement: 'sensor',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: ['Cover.position', 'Cover.tilt'],
        options: ['units', 'decimals', 'min', 'max', 'step', 'setable']
    },
    {
        type: 'text',
        valueType: 'string',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'media',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: null,
        options: ['decimals']
    },
    {
        type: 'onoff',
        valueType: 'boolean',
        getable: true,
        setable: true,
        quickaction: true,
        uielement: 'toggle',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: null,
        options: ['decimals', 'min', 'max', 'step', 'getable']
    },
    {
        type: 'dim',
        valueType: 'number',
        getable: true,
        setable: true,
        quickaction: false,
        uielement: 'slider',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: ['Cover.position', 'Cover.tilt'],
        options: ['units', 'decimals', 'min', 'max', 'step']
    },
    // Skip light_hue
    // Skip light_saturation
    // Skip light_temperature
    // Skip light_mode
    // Skip vacuumcleaner_state
    // thermostat_mode
    {
        type: 'target_temperature',
        valueType: 'number',
        getable: true,
        setable: true,
        quickaction: false,
        uielement: 'thermostat',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: ['Cover.position', 'Cover.tilt'],
        options: ['units', 'decimals', 'min', 'max', 'step']
    },
    {
        type: 'measure_temperature',
        valueType: 'number',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'sensor',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: ['Cover.position', 'Cover.tilt'],
        options: ['units', 'decimals']
    },
    {
        type: 'measure_co',
        valueType: 'number',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'sensor',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: ['Cover.position', 'Cover.tilt'],
        options: ['units', 'decimals']
    },
    {
        type: 'measure_co2',
        valueType: 'number',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'sensor',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: ['Cover.position', 'Cover.tilt'],
        options: ['units', 'decimals']
    },
    {
        type: 'measure_pm25',
        valueType: 'number',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'sensor',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: ['Cover.position', 'Cover.tilt'],
        options: ['units', 'decimals']
    },
    {
        type: 'measure_humidity',
        valueType: 'number',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'sensor',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: ['Cover.position', 'Cover.tilt'],
        options: ['units', 'decimals']
    },
    {
        type: 'measure_pressure',
        valueType: 'number',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'sensor',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: ['Cover.position', 'Cover.tilt'],
        options: ['units', 'decimals']
    },
    {
        type: 'measure_noise',
        valueType: 'number',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'sensor',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: ['Cover.position', 'Cover.tilt'],
        options: ['units', 'decimals']
    },
    {
        type: 'measure_rain',
        valueType: 'number',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'sensor',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: ['Cover.position', 'Cover.tilt'],
        options: ['units', 'decimals']
    },
    {
        type: 'measure_wind_strength',
        valueType: 'number',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'sensor',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: ['Cover.position', 'Cover.tilt'],
        options: ['units', 'decimals']
    },
    {
        type: 'measure_wind_angle',
        valueType: 'number',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'sensor',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: ['Cover.position', 'Cover.tilt'],
        options: ['units', 'decimals']
    },
    {
        type: 'measure_gust_strength',
        valueType: 'number',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'sensor',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: ['Cover.position', 'Cover.tilt'],
        options: ['units', 'decimals']
    },
    {
        type: 'measure_gust_angle',
        valueType: 'number',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'sensor',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: ['Cover.position', 'Cover.tilt'],
        options: ['units', 'decimals']
    },
    {
        type: 'measure_battery',
        valueType: 'number',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'battery',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: ['Cover.position', 'Cover.tilt'],
        options: ['units', 'decimals']
    },
    {
        type: 'measure_power',
        valueType: 'number',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'sensor',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: ['Cover.position', 'Cover.tilt'],
        options: ['units', 'decimals', 'approximated']
    },
    {
        type: 'measure_voltage',
        valueType: 'number',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'sensor',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: ['Cover.position', 'Cover.tilt'],
        options: ['units', 'decimals']
    },
    {
        type: 'measure_current',
        valueType: 'number',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'sensor',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: ['Cover.position', 'Cover.tilt'],
        options: ['units', 'decimals']
    },
    {
        type: 'measure_luminance',
        valueType: 'number',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'sensor',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: ['Cover.position', 'Cover.tilt'],
        options: ['units', 'decimals']
    },
    {
        type: 'measure_ultraviolet',
        valueType: 'number',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'sensor',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: ['Cover.position', 'Cover.tilt'],
        options: ['units', 'decimals']
    },
    {
        type: 'measure_water',
        valueType: 'number',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'sensor',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: ['Cover.position', 'Cover.tilt'],
        options: ['units', 'decimals']
    },
    {
        type: 'alarm_generic',
        valueType: 'boolean',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'sensor',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: null,
        options: []
    },
    {
        type: 'alarm_motion',
        valueType: 'boolean',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'sensor',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: null,
        options: ['zoneActivity']
    },
    {
        type: 'alarm_contact',
        valueType: 'boolean',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'sensor',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: null,
        options: ['zoneActivity']
    },
    {
        type: 'alarm_co',
        valueType: 'boolean',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'sensor',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: null,
        options: []
    },
    {
        type: 'alarm_co2',
        valueType: 'boolean',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'sensor',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: null,
        options: []
    },
    {
        type: 'alarm_pm25',
        valueType: 'boolean',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'sensor',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: null,
        options: []
    },
    {
        type: 'alarm_tamper',
        valueType: 'boolean',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'sensor',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: null,
        options: []
    },
    {
        type: 'alarm_smoke',
        valueType: 'boolean',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'sensor',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: null,
        options: []
    },
    {
        type: 'alarm_fire',
        valueType: 'boolean',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'sensor',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: null,
        options: []
    },
    {
        type: 'alarm_heat',
        valueType: 'boolean',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'sensor',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: null,
        options: []
    },
    {
        type: 'alarm_water',
        valueType: 'boolean',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'sensor',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: null,
        options: []
    },
    {
        type: 'alarm_battery',
        valueType: 'boolean',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'battery',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: null,
        options: []
    },
    {
        type: 'alarm_night',
        valueType: 'boolean',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'sensor',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: null,
        options: []
    },
    {
        type: 'meter_power',
        valueType: 'number',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'sensor',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: ['Cover.position', 'Cover.tilt'],
        options: ['units', 'decimals']
    },
    {
        type: 'meter_water',
        valueType: 'number',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'sensor',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: ['Cover.position', 'Cover.tilt'],
        options: ['units', 'decimals']
    },
    {
        type: 'meter_gas',
        valueType: 'number',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'sensor',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: ['Cover.position', 'Cover.tilt'],
        options: ['units', 'decimals']
    },
    {
        type: 'meter_rain',
        valueType: 'number',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'sensor',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: ['Cover.position', 'Cover.tilt'],
        options: ['units', 'decimals']
    },
    // Skip homealarm_state
    {
        type: 'volume_set',
        valueType: 'number',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'slider',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: ['Cover.position', 'Cover.tilt'],
        options: ['units', 'decimals']
    },
    {
        type: 'volume_up',
        valueType: 'boolean',
        getable: false,
        setable: true,
        quickaction: false,
        uielement: 'button',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: null,
        options: []
    },
    {
        type: 'volume_down',
        valueType: 'boolean',
        getable: false,
        setable: true,
        quickaction: false,
        uielement: 'button',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: null,
        options: []
    },
    {
        type: 'volume_mute',
        valueType: 'boolean',
        getable: true,
        setable: true,
        quickaction: false,
        uielement: 'button',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: null,
        options: ['getable']
    },
    {
        type: 'channel_up',
        valueType: 'boolean',
        getable: false,
        setable: true,
        quickaction: false,
        uielement: 'button',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: null,
        options: []
    },
    {
        type: 'channel_down',
        valueType: 'boolean',
        getable: false,
        setable: true,
        quickaction: false,
        uielement: 'button',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: null,
        options: []
    },
    {
        type: 'locked',
        valueType: 'boolean',
        getable: true,
        setable: true,
        quickaction: false,
        uielement: 'toggle',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: null,
        options: []
    },
    // Skip lock_mode
    // Skip garagedoor_closed
    // Skip windowcoverings_state
    // Skip windowcoverings_tilt_up
    // Skip windowcoverings_tilt_down
    {
        type: 'windowcoverings_tilt_set',
        valueType: 'number',
        getable: true,
        setable: true,
        quickaction: false,
        uielement: 'slider',
        nativeCapabilitySupported: ['Cover.tilt'],
        nativeCapabilityUnsupported: ['Cover.position'],
        options: []
    },
    // Skip windowcoverings_closed
    {
        type: 'windowcoverings_set',
        valueType: 'number',
        getable: true,
        setable: true,
        quickaction: false,
        uielement: 'slider',
        nativeCapabilitySupported: ['Cover.position'],
        nativeCapabilityUnsupported: ['Cover.tilt'],
        options: []
    },
    {
        type: 'button',
        valueType: 'boolean',
        getable: false,
        setable: true,
        quickaction: true,
        uielement: 'button',
        nativeCapabilitySupported: ['Button.state'],
        nativeCapabilityUnsupported: null,
        options: []
    }
    // Skip speaker_playing
    // Skip speaker_next
    // Skip speaker_prev
    // Skip speaker_shuffle
    // Skip speaker_repeat
    // Skip speaker_artist
    // Skip speaker_album
    // Skip speaker_track
    // Skip speaker_duration
    // Skip speaker_position
];
