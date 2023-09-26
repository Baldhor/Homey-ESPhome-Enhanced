const EditPhysicalDevicePage = function () {
  return {
    componentName: "edit-physical-device-page",
    $template: "#template-edit-physical-device-page",

    name: null,
    ipAddress: null,
    port: null,
    encryptionKey: null,
    password: null,

    _editPhysicalDevice: null,

    _initValues: null,
    _modified: false,

    mounted() {
      wizardlog('[' + this.componentName + '] ' + 'mounted');

      pageHandler.registerComponent(this.componentName, this);
    },
    async init(physicalDeviceId) {
      wizardlog('[' + this.componentName + '] ' + 'init:', ...arguments);

      this._editPhysicalDevice = configuration.physicalDevices.find(e => e.physicalDeviceId === physicalDeviceId);

      this._initValues = {};
      this.name = this._initValues.name = this._editPhysicalDevice.name;
      this.ipAddress = this._initValues.ipAddress = this._editPhysicalDevice.ipAddress;
      this.port = this._initValues.port = this._editPhysicalDevice.port;
      this.encryptionKey = this._initValues.encryptionKey = this._editPhysicalDevice.encryptionKey;
      this.password = this._initValues.password = this._editPhysicalDevice.password;

      await PetiteVue.nextTick();
      this.checkValidity();
    },
    checkValidity() {
      wizardlog('[' + this.componentName + '] ' + 'checkValidity');

      // Reset error and warning messsages
      errorAndWarningList.reset();

      // Retrieve elements from refs
      const nameElt = this.$refs.name;
      const ipAddressElt = this.$refs.ipAddress;
      const portElt = this.$refs.port;
      const encryptionKeyElt = this.$refs.encryptionKey;
      const passwordElt = this.$refs.password;

      // Reset custom validity
      nameElt.setCustomValidity('');
      ipAddressElt.setCustomValidity('');
      portElt.setCustomValidity('');
      encryptionKeyElt.setCustomValidity('');
      passwordElt.setCustomValidity('');

      if (this._editPhysicalDevice === null) {
        return;
      }

      // Name format
      if (!nameElt.validity.valid) {
        errorAndWarningList.addError("wizard2.edit-physical-device.error-name");
      }

      // Name must be unique
      if (nameElt.validity.valid) {
        let tmp = configuration.physicalDevices.find(e => e.physicalDeviceId !== this._editPhysicalDevice.physicalDeviceId && e.name === this.name);
        if (tmp !== undefined) {
          nameElt.setCustomValidity(false);
          errorAndWarningList.addError("wizard2.edit-physical-device.error-name-already-used");
        }
      }

      // IP Address format
      if (!ipAddressElt.validity.valid) {
        errorAndWarningList.addError("wizard2.edit-physical-device.error-ip-address");
      }

      // Port format
      if (!portElt.validity.valid) {
        errorAndWarningList.addError("wizard2.edit-physical-device.error-port");
      }

      // IP Address and port must be unique
      if (ipAddressElt.validity.valid && portElt.validity.valid) {
        let tmp = configuration.physicalDevices.find(e => e.physicalDeviceId !== this._editPhysicalDevice.physicalDeviceId && e.ipAddress === this.ipAddress && e.port === this.port);
        if (tmp !== undefined) {
          ipAddressElt.setCustomValidity(false);
          portElt.setCustomValidity(false);
          errorAndWarningList.addError("wizard2.edit-physical-device.error-ipAddress-and-port-already-used");
        }
      }

      // Encryption key format
      if (encryptionKeyElt.validity.patternMismatch) {
        errorAndWarningList.addError("wizard2.edit-physical-device.error-encryption-key");
      } else if (this.encryptionKey !== '' && atob(this.encryptionKey).length !== 32) {
        encryptionKeyElt.setCustomValidity(false);
        errorAndWarningList.addError("wizard2.edit-physical-device.error-encryption-key");
      }

      // encryptionKey and password are exclusive
      if (this.encryptionKey !== '' && this.password !== '') {
        encryptionKeyElt.setCustomValidity(false);
        passwordElt.setCustomValidity(false);
        errorAndWarningList.addError("wizard2.edit-physical-device.error-encryption-key-and-password-are-exclusive");
      }

      // Encryption key recommended (need to check last)
      if (encryptionKeyElt.validity.valid && this.encryptionKey === '') {
        errorAndWarningList.addWarning("wizard2.edit-physical-device.warning-encryption-key-recommended");
      }

      this.checkModified();
    },
    checkModified() {
      wizardlog('[' + this.componentName + '] ' + 'checkModified');

      this._modified = Object.keys(this._initValues).find(key => this._initValues[key] !== this[key]) !== undefined;
    },
    async back() {
      wizardlog('[' + this.componentName + '] ' + 'back');

      this._modified ? (await confirm(Homey.__("wizard2.edit-physical-device.loseModification", "warning")) ? pageHandler.setPage('list-physical-devices-page') : true) : pageHandler.setPage('list-physical-devices-page');
    },
    async apply() {
      wizardlog('[' + this.componentName + '] ' + 'apply');

      Homey.showLoadingOverlay();

      try {
        await Homey.emit('modify-physical-device', {
          physicalDeviceId: this._editPhysicalDevice.physicalDeviceId,
          name: this.name,
          ipAddress: this.ipAddress,
          port: this.port,
          encryptionKey: this.encryptionKey,
          password: this.password
        }).catch(e => { throw e; });

        // Let's wait 5 seconds, the time to collect initial capability values from the physical device
        setTimeout(this._applied, 5000);
      } catch (e) {
        wizarderror(e);

        Homey.hideLoadingOverlay();
        this.alert(Homey.__("wizard2.edit-physical-device.failed", "error"));
      }
    },
    async _applied() {
      wizardlog('[' + this.componentName + '] ' + 'applied');

      pageHandler.setMainPage();
    }
  };
};
