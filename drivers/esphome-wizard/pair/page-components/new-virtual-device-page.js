const NewVirtualDevicePage = function () {
  return {
    componentName: "new-virtual-device-page",
    $template: "#template-new-virtual-device-page",

    name: null,
    zoneId: null,
    classId: null,
    classDescription: null,

    _initValues: null,
    _modified: null,

    mounted() {
      wizardlog('[' + this.componentName + '] ' + 'mounted');

      pageHandler.registerComponent(this.componentName, this);
    },
    async init() {
      wizardlog('[' + this.componentName + '] ' + 'init');

      this._initValues = {};
      this.name = this._initValues.name = "";
      this.zoneId = this._initValues.zoneId = "unselected";
      this.classId = this._initValues.classId = "unselected";
      this.classDescription = "";

      await PetiteVue.nextTick();
      this.checkValidity();
    },
    checkValidity() {
      wizardlog('[' + this.componentName + '] ' + 'checkValidity');

      // Reset error and warning messsages
      errorAndWarningList.reset();

      // Retrieve elements from refs
      const nameElt = this.$refs.name;
      const zoneIdElt = this.$refs.zoneId;
      const classIdElt = this.$refs.classId;

      // Reset custom validity
      nameElt.setCustomValidity('');
      zoneIdElt.setCustomValidity('');
      classIdElt.setCustomValidity('');

      // Name format
      if (!nameElt.validity.valid) {
        errorAndWarningList.addError("wizard2.new-virtual-device.error-name");
      }

      // Name should be unique
      if (nameElt.validity.valid) {
        let tmp = configuration.virtualDevices.find(e => e.current.zoneId === this.zone && e.current.name === this.name);
        if (tmp !== undefined) {
          errorAndWarningList.addWarning("wizard2.new-virtual-device.warning-name-already-used");
        }
      }

      // Zone unselected
      if (this.zoneId === 'unselected') {
        zoneIdElt.setCustomValidity(false);
        errorAndWarningList.addError("wizard2.new-virtual-device.error-zone");
      }

      // Class unselected
      if (this.classId === 'unselected') {
        classIdElt.setCustomValidity(false);
        this.classDescription = "";
        errorAndWarningList.addError("wizard2.new-virtual-device.error-class");
      } else {
        this.classDescription = Homey.__('deviceClass.' + this.classId + '.description');
      }

      this.checkModified();
    },
    checkModified() {
      wizardlog('[' + this.componentName + '] ' + 'checkModified');

      this._modified = Object.keys(this._initValues).find(key => this._initValues[key] !== this[key]) !== undefined;
    },
    async back() {
      wizardlog('[' + this.componentName + '] ' + 'back');

      this._modified ? (await confirm(Homey.__("wizard2.new-virtual-device.loseModification", "warning")) ? pageHandler.setPage('list-virtual-devices-page') : true) : pageHandler.setPage('list-virtual-devices-page');
    },
    async apply() {
      wizardlog('[' + this.componentName + '] ' + 'apply');

      Homey.showLoadingOverlay();

      try {
        let tmp = {
          'virtualDeviceId': 'Wizard' + Date.now(),
          'initial': null,
          'current': {
            name: this.name,
            zoneId: this.zoneId,
            class: this.classId,
            status: 'new',
            capabilities: []
          }
        }

        configuration.virtualDevices.push(tmp);
        pageHandler.setPage('edit-virtual-device-page', { virtualDeviceId: tmp.virtualDeviceId });
      } catch (e) {
        wizardlog(e);

        Homey.hideLoadingOverlay();
        this.alert(Homey.__("wizard2.new-virtual-device.fatal-error", "error"));
      }
    }
  };
};
