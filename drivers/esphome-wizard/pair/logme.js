function wizardlog (...args) {
    console.log(...args);
    
    // Send the console.log to homey which will log them (including console.re if enabled)
    Homey.emit('logme', { ...args}).catch(e => { return; });
}

function wizarderror (e) {
    // Send the console.log to homey which will log them (including console.re if enabled)
    Homey.emit('logme', e.stack).catch(e => { return; });

    // And rethrow
    throw e;
}