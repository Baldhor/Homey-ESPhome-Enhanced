This file list:
- Many different state message by device type
- Many different newEntity message by device type

The purpose is to help build up the mapping between Homey and ESPhome


# Sensor
State for uptime entity:
{
    "key": 3575054568,
    "state": 703.0700073242188,
    "missingState": false
}

=> To be compared


# Cover
State:
{
    "key": 1160662953,
    "legacyState": 0,
    "position": 1,
    "tilt": 0,
    "currentOperation": 0 => not moving
}
{
    "key": 1160662953,
    "legacyState": 1,
    "position": 0.0007691567298024893,
    "tilt": 0,
    "currentOperation": 2 => cover going down
}
{
    "key": 1160662953,
    "legacyState": 1,
    "position": 0.0002857142826542258,
    "tilt": 0,
    "currentOperation": 1 => cover going up
}
=> Legacy state is useless (old protocol of ESPhome)
=> tilt and position are two different capabilities in homey, and so it should be possible to split them among 2 separate device
=> Current operation is useless (at the moment), but maybe someday someone will ask to have a homey flow card related. Complicated subject, I suppose it will have different values if tilt is moving too ...



