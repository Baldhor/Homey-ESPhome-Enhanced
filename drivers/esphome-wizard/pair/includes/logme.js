function _filterWizardLogs(args) {
  let newArgs = [];

  let instance = this.getInstance();

  // Let's make a deep copy and filter anything that need to be
  args.forEach(arg => {
    if (arg === undefined) {
      newArgs.push(undefined);
    } else {
      const stringifyCircularJSON = obj => {
        const seen = new WeakSet();
        const filterList = ['encryptionKey', 'newEncryptionKey', 'password', 'newPassword'];

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

function wizardlog(...args) {
  console.log(...JSON.parse(JSON.stringify(args)));

  // Send the console.log to homey which will log them (including console.re if enabled)
  Homey.emit('logme', { ...args }).catch(e => { return; });
}

function wizarderror(e) {
  // Send the console.log to homey which will log them (including console.re if enabled)
  Homey.emit('logme', e.stack).catch(e => { return; });

  // And rethrow
  throw e;
}