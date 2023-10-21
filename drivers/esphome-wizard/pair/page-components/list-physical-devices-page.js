const ListPhysicalDevicesPage = function () {
  return {
    componentName: "list-physical-devices-page",
    $template: "#template-list-physical-devices-page",

    _initValues: null,
    _modified: null,

    _clipboard: null,

    mounted() {
      wizardlog('[' + this.componentName + '] ' + 'mounted');

      pageHandler.registerComponent(this.componentName, this);
    },
    async init() {
      wizardlog('[' + this.componentName + '] ' + 'init');

      this._initValues = {};

      await PetiteVue.nextTick();
      this.checkValidity();
    },
    checkValidity() {
      wizardlog('[' + this.componentName + '] ' + 'checkValidity');

      // Reset error and warning messsages
      errorAndWarningList.reset();

      // do nothing

      this.checkModified();
    },
    checkModified() {
      wizardlog('[' + this.componentName + '] ' + 'checkModified');

      this._modified = Object.keys(this._initValues).find(key => this._initValues[key] !== this[key]) !== undefined;
    },
    copyToClipboard(physicalDeviceId) {
      wizardlog('[' + this.componentName + '] ' + 'copyToClipboard:', ...arguments);

      const stringifyCircularJSON = obj => {
        const seen = new WeakSet();
        const filterList = ['encryptionKey', 'newEncryptionKey', 'password', 'newPassword', 'bearer-token'];

        return JSON.stringify(obj, (k, v) => {
          if (v !== null && typeof v === 'object') {
            if (seen.has(v)) return;
            seen.add(v);

            //if (util.types.isNativeError(v)) {
            //  return instance.serializeError(v);
            //}
          }

          if (filterList.includes(k)) {
            if (v === null || v === '') {
              return '<no value>';
            } else {
              return '<hidden value>';
            }
          }

          return v;
        }, 2);
      };

      this._clipboard = stringifyCircularJSON({
        "versions": configuration.versions,
        "physicalDeviceId": physicalDeviceId,
        "physicalDevice": configuration.physicalDevices.find(physicalDevice => physicalDevice.physicalDeviceId === physicalDeviceId)
      });
    }
  };
};
