// Kind of a global variable ...
// The list is compiled from the sdk : https://apps-sdk-v3.developer.homey.app/tutorial-device-capabilities.html
// I skiped some of them (lazy / cannot test them)
// Added 2 customs : number and text
CAPABILITY_CONFIGURATION = [
    {
        capability: 'number',
        type: 'number',
        getable: true,
        setable: true,
        quickaction: false,
        uielement: 'sensor',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: ['Cover.position', 'Cover.tilt'],
        options: ['units', 'decimals', 'min', 'max', 'step', 'setable']
    },
    {
        capability: 'text',
        type: 'string',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'media',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: null,
        options: ['decimals']
    },
    {
        capability: 'onoff',
        type: 'boolean',
        getable: true,
        setable: true,
        quickaction: true,
        uielement: 'toggle',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: null,
        options: ['decimals', 'min', 'max', 'step', 'getable']
    },
    {
        capability: 'dim',
        type: 'number',
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
        capability: 'target_temperature',
        type: 'number',
        getable: true,
        setable: true,
        quickaction: false,
        uielement: 'thermostat',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: ['Cover.position', 'Cover.tilt'],
        options: ['units', 'decimals', 'min', 'max', 'step']
    },
    {
        capability: 'measure_temperature',
        type: 'number',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'sensor',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: ['Cover.position', 'Cover.tilt'],
        options: ['units', 'decimals']
    },
    {
        capability: 'measure_co',
        type: 'number',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'sensor',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: ['Cover.position', 'Cover.tilt'],
        options: ['units', 'decimals']
    },
    {
        capability: 'measure_co2',
        type: 'number',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'sensor',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: ['Cover.position', 'Cover.tilt'],
        options: ['units', 'decimals']
    },
    {
        capability: 'measure_pm25',
        type: 'number',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'sensor',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: ['Cover.position', 'Cover.tilt'],
        options: ['units', 'decimals']
    },
    {
        capability: 'measure_humidity',
        type: 'number',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'sensor',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: ['Cover.position', 'Cover.tilt'],
        options: ['units', 'decimals']
    },
    {
        capability: 'measure_pressure',
        type: 'number',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'sensor',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: ['Cover.position', 'Cover.tilt'],
        options: ['units', 'decimals']
    },
    {
        capability: 'measure_noise',
        type: 'number',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'sensor',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: ['Cover.position', 'Cover.tilt'],
        options: ['units', 'decimals']
    },
    {
        capability: 'measure_rain',
        type: 'number',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'sensor',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: ['Cover.position', 'Cover.tilt'],
        options: ['units', 'decimals']
    },
    {
        capability: 'measure_wind_strength',
        type: 'number',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'sensor',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: ['Cover.position', 'Cover.tilt'],
        options: ['units', 'decimals']
    },
    {
        capability: 'measure_wind_angle',
        type: 'number',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'sensor',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: ['Cover.position', 'Cover.tilt'],
        options: ['units', 'decimals']
    },
    {
        capability: 'measure_gust_strength',
        type: 'number',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'sensor',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: ['Cover.position', 'Cover.tilt'],
        options: ['units', 'decimals']
    },
    {
        capability: 'measure_gust_angle',
        type: 'number',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'sensor',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: ['Cover.position', 'Cover.tilt'],
        options: ['units', 'decimals']
    },
    {
        capability: 'measure_battery',
        type: 'number',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'battery',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: ['Cover.position', 'Cover.tilt'],
        options: ['units', 'decimals']
    },
    {
        capability: 'measure_power',
        type: 'number',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'sensor',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: ['Cover.position', 'Cover.tilt'],
        options: ['units', 'decimals', 'approximated']
    },
    {
        capability: 'measure_voltage',
        type: 'number',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'sensor',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: ['Cover.position', 'Cover.tilt'],
        options: ['units', 'decimals']
    },
    {
        capability: 'measure_current',
        type: 'number',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'sensor',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: ['Cover.position', 'Cover.tilt'],
        options: ['units', 'decimals']
    },
    {
        capability: 'measure_luminance',
        type: 'number',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'sensor',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: ['Cover.position', 'Cover.tilt'],
        options: ['units', 'decimals']
    },
    {
        capability: 'measure_ultraviolet',
        type: 'number',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'sensor',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: ['Cover.position', 'Cover.tilt'],
        options: ['units', 'decimals']
    },
    {
        capability: 'measure_water',
        type: 'number',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'sensor',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: ['Cover.position', 'Cover.tilt'],
        options: ['units', 'decimals']
    },
    {
        capability: 'alarm_generic',
        type: 'boolean',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'sensor',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: null,
        options: []
    },
    {
        capability: 'alarm_motion',
        type: 'boolean',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'sensor',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: null,
        options: ['zoneActivity']
    },
    {
        capability: 'alarm_contact',
        type: 'boolean',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'sensor',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: null,
        options: ['zoneActivity']
    },
    {
        capability: 'alarm_co',
        type: 'boolean',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'sensor',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: null,
        options: []
    },
    {
        capability: 'alarm_co2',
        type: 'boolean',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'sensor',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: null,
        options: []
    },
    {
        capability: 'alarm_pm25',
        type: 'boolean',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'sensor',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: null,
        options: []
    },
    {
        capability: 'alarm_tamper',
        type: 'boolean',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'sensor',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: null,
        options: []
    },
    {
        capability: 'alarm_smoke',
        type: 'boolean',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'sensor',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: null,
        options: []
    },
    {
        capability: 'alarm_fire',
        type: 'boolean',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'sensor',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: null,
        options: []
    },
    {
        capability: 'alarm_heat',
        type: 'boolean',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'sensor',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: null,
        options: []
    },
    {
        capability: 'alarm_water',
        type: 'boolean',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'sensor',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: null,
        options: []
    },
    {
        capability: 'alarm_battery',
        type: 'boolean',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'battery',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: null,
        options: []
    },
    {
        capability: 'alarm_night',
        type: 'boolean',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'sensor',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: null,
        options: []
    },
    {
        capability: 'meter_power',
        type: 'number',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'sensor',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: ['Cover.position', 'Cover.tilt'],
        options: ['units', 'decimals']
    },
    {
        capability: 'meter_water',
        type: 'number',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'sensor',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: ['Cover.position', 'Cover.tilt'],
        options: ['units', 'decimals']
    },
    {
        capability: 'meter_gas',
        type: 'number',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'sensor',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: ['Cover.position', 'Cover.tilt'],
        options: ['units', 'decimals']
    },
    {
        capability: 'meter_rain',
        type: 'number',
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
        capability: 'volume_set',
        type: 'number',
        getable: true,
        setable: false,
        quickaction: false,
        uielement: 'slider',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: ['Cover.position', 'Cover.tilt'],
        options: ['units', 'decimals']
    },
    {
        capability: 'volume_up',
        type: 'boolean',
        getable: false,
        setable: true,
        quickaction: false,
        uielement: 'button',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: null,
        options: []
    },
    {
        capability: 'volume_down',
        type: 'boolean',
        getable: false,
        setable: true,
        quickaction: false,
        uielement: 'button',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: null,
        options: []
    },
    {
        capability: 'volume_mute',
        type: 'boolean',
        getable: true,
        setable: true,
        quickaction: false,
        uielement: 'button',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: null,
        options: ['getable']
    },
    {
        capability: 'channel_up',
        type: 'boolean',
        getable: false,
        setable: true,
        quickaction: false,
        uielement: 'button',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: null,
        options: []
    },
    {
        capability: 'channel_down',
        type: 'boolean',
        getable: false,
        setable: true,
        quickaction: false,
        uielement: 'button',
        nativeCapabilitySupported: null,
        nativeCapabilityUnsupported: null,
        options: []
    },
    {
        capability: 'locked',
        type: 'boolean',
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
        capability: 'windowcoverings_tilt_set',
        type: 'number',
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
        capability: 'windowcoverings_set',
        type: 'number',
        getable: true,
        setable: true,
        quickaction: false,
        uielement: 'slider',
        nativeCapabilitySupported: ['Cover.position'],
        nativeCapabilityUnsupported: ['Cover.tilt'],
        options: []
    },
    {
        capability: 'button',
        type: 'boolean',
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
