// Kind of a global variable ...
// The list is compiled from the sdk : https://apps-sdk-v3.developer.homey.app/tutorial-device-capabilities.html
// I skiped some of them (lazy / cannot test them)
// Added 2 customs : number and text
CAPABILITY_CONFIGURATION = [
  {
    type: 'esphome_enum_test_AA',
    valueType: 'string',
    getable: true,
    setable: true,
    quickaction: false,
    uielement: 'picker',
    nativeCapabilitySupported: null,
    nativeCapabilityUnsupported: null,
    specialCaseSupported: [],
    options: ['index', 'title', 'preventInsights', 'preventTag'],
    valuesSupported: ["one", "two", "three"]
  },
  {
    type: 'esphome_enum_horizontal_swing_mode_AA',
    valueType: 'string',
    getable: true,
    setable: true,
    quickaction: false,
    uielement: 'picker',
    nativeCapabilitySupported: null,
    nativeCapabilityUnsupported: null,
    specialCaseSupported: [],
    options: ['index', 'title', 'preventInsights', 'preventTag'],
    valuesSupported: ["auto", "left", "left_center", "center", "right_center", "right"]
  },
  {
    type: 'esphome_text',
    valueType: 'string',
    getable: true,
    setable: false,
    quickaction: false,
    uielement: 'sensor',
    nativeCapabilitySupported: null,
    nativeCapabilityUnsupported: null,
    specialCaseSupported: [],
    options: ['index', 'title', 'preventInsights', 'preventTag']
  },
  {
    type: 'esphome_select',
    valueType: 'string',
    getable: true,
    setable: true,
    quickaction: false,
    uielement: 'sensor',
    nativeCapabilitySupported: null,
    nativeCapabilityUnsupported: null,
    specialCaseSupported: [],
    options: ['index', 'title', 'preventInsights', 'preventTag']
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
    specialCaseSupported: [],
    options: ['index', 'title', 'preventInsights', 'preventTag', 'getable']
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
    specialCaseSupported: [],
    options: ['index', 'title', 'preventInsights', 'preventTag', 'units', 'decimals', 'min', 'max', 'step']
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
    specialCaseSupported: [],
    options: ['index', 'title', 'preventInsights', 'preventTag', 'units', 'decimals', 'min', 'max', 'step']
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
    specialCaseSupported: [],
    options: ['index', 'title', 'preventInsights', 'preventTag', 'units', 'decimals']
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
    specialCaseSupported: [],
    options: ['index', 'title', 'preventInsights', 'preventTag', 'units', 'decimals']
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
    specialCaseSupported: [],
    options: ['index', 'title', 'preventInsights', 'preventTag', 'units', 'decimals']
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
    specialCaseSupported: [],
    options: ['index', 'title', 'preventInsights', 'preventTag', 'units', 'decimals']
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
    specialCaseSupported: [],
    options: ['index', 'title', 'preventInsights', 'preventTag', 'units', 'decimals']
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
    specialCaseSupported: [],
    options: ['index', 'title', 'preventInsights', 'preventTag', 'units', 'decimals']
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
    specialCaseSupported: [],
    options: ['index', 'title', 'preventInsights', 'preventTag', 'units', 'decimals']
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
    specialCaseSupported: [],
    options: ['index', 'title', 'preventInsights', 'preventTag', 'units', 'decimals']
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
    specialCaseSupported: [],
    options: ['index', 'title', 'preventInsights', 'preventTag', 'units', 'decimals']
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
    specialCaseSupported: [],
    options: ['index', 'title', 'preventInsights', 'preventTag', 'units', 'decimals']
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
    specialCaseSupported: [],
    options: ['index', 'title', 'preventInsights', 'preventTag', 'units', 'decimals']
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
    specialCaseSupported: [],
    options: ['index', 'title', 'preventInsights', 'preventTag', 'units', 'decimals']
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
    specialCaseSupported: [],
    options: ['index', 'title', 'preventInsights', 'preventTag', 'units', 'decimals']
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
    specialCaseSupported: [],
    options: ['index', 'title', 'preventInsights', 'preventTag', 'units', 'decimals', 'approximated']
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
    specialCaseSupported: [],
    options: ['index', 'title', 'preventInsights', 'preventTag', 'units', 'decimals']
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
    specialCaseSupported: [],
    options: ['index', 'title', 'preventInsights', 'preventTag', 'units', 'decimals']
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
    specialCaseSupported: [],
    options: ['index', 'title', 'preventInsights', 'preventTag', 'units', 'decimals']
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
    specialCaseSupported: [],
    options: ['index', 'title', 'preventInsights', 'preventTag', 'units', 'decimals']
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
    specialCaseSupported: [],
    options: ['index', 'title', 'preventInsights', 'preventTag', 'units', 'decimals']
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
    specialCaseSupported: [],
    options: ['index', 'title', 'preventInsights', 'preventTag']
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
    specialCaseSupported: [],
    options: ['index', 'title', 'preventInsights', 'preventTag', 'zoneActivity']
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
    specialCaseSupported: [],
    options: ['index', 'title', 'preventInsights', 'preventTag', 'zoneActivity']
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
    specialCaseSupported: [],
    options: ['index', 'title', 'preventInsights', 'preventTag']
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
    specialCaseSupported: [],
    options: ['index', 'title', 'preventInsights', 'preventTag']
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
    specialCaseSupported: [],
    options: ['index', 'title', 'preventInsights', 'preventTag']
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
    specialCaseSupported: [],
    options: ['index', 'title', 'preventInsights', 'preventTag']
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
    specialCaseSupported: [],
    options: ['index', 'title', 'preventInsights', 'preventTag']
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
    specialCaseSupported: [],
    options: ['index', 'title', 'preventInsights', 'preventTag']
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
    specialCaseSupported: [],
    options: ['index', 'title', 'preventInsights', 'preventTag']
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
    specialCaseSupported: [],
    options: ['index', 'title', 'preventInsights', 'preventTag']
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
    specialCaseSupported: [],
    options: ['index', 'title', 'preventInsights', 'preventTag']
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
    specialCaseSupported: [],
    options: ['index', 'title', 'preventInsights', 'preventTag']
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
    specialCaseSupported: [],
    options: ['index', 'title', 'preventInsights', 'preventTag', 'units', 'decimals']
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
    specialCaseSupported: [],
    options: ['index', 'title', 'preventInsights', 'preventTag', 'units', 'decimals']
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
    specialCaseSupported: [],
    options: ['index', 'title', 'preventInsights', 'preventTag', 'units', 'decimals']
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
    specialCaseSupported: [],
    options: ['index', 'title', 'preventInsights', 'preventTag', 'units', 'decimals']
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
    specialCaseSupported: [],
    options: ['index', 'title', 'preventInsights', 'preventTag', 'units', 'decimals']
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
    specialCaseSupported: [],
    options: ['index', 'title', 'preventInsights', 'preventTag']
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
    specialCaseSupported: [],
    options: ['index', 'title', 'preventInsights', 'preventTag']
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
    specialCaseSupported: [],
    options: ['index', 'title', 'preventInsights', 'preventTag', 'getable']
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
    specialCaseSupported: [],
    options: ['index', 'title', 'preventInsights', 'preventTag']
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
    specialCaseSupported: [],
    options: ['index', 'title', 'preventInsights', 'preventTag']
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
    specialCaseSupported: [],
    options: ['index', 'title', 'preventInsights', 'preventTag']
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
    specialCaseSupported: [],
    options: ['index', 'title', 'preventInsights', 'preventTag']
  },
  // Skip windowcoverings_closed
  {
    type: 'windowcoverings_closed',
    valueType: 'number',
    getable: true,
    setable: true,
    quickaction: false,
    uielement: 'toggle',
    nativeCapabilitySupported: ['Cover.position'],
    nativeCapabilityUnsupported: null,
    specialCaseSupported: ['templateCover'],
    options: ['index', 'title', 'preventInsights', 'preventTag']
  },
  {
    type: 'windowcoverings_set',
    valueType: 'number',
    getable: true,
    setable: true,
    quickaction: false,
    uielement: 'slider',
    nativeCapabilitySupported: ['Cover.position'],
    nativeCapabilityUnsupported: ['Cover.tilt'],
    specialCaseSupported: [],
    options: ['index', 'title', 'preventInsights', 'preventTag']
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
    specialCaseSupported: [],
    options: ['index', 'title', 'preventInsights', 'preventTag']
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

// List of device class
CLASS_SUPPORTED = [
  "amplifier",
  "blinds",
  "button",
  "camera",
  "coffeemachine",
  "curtain",
  "doorbell",
  "fan",
  "garagedoor",
  "heater",
  "homealarm",
  "kettle",
  "light",
  "lock",
  "other",
  "remote",
  "sensor",
  "socket",
  "speaker",
  "solarpanel",
  "sunshade",
  "thermostat",
  "tv",
  "vacuumcleaner",
  "windowcoverings"
];
