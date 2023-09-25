const EditVirtualDevicePage = function () {
  return {
    componentName: "edit-virtual-device-page",
    $template: "#template-edit-virtual-device-page",

    name: null,
    zoneId: null,
    classId: null,
    classDescription: null,

    _editVirtualDevice: null,
    _modified: false,

    mounted() {
      wizardlog('[' + this.componentName + '] ' + 'mounted');

      pageHandler.registerComponent(this.componentName, this);
    },
    async init(virtualDeviceId) {
      wizardlog('[' + this.componentName + '] ' + 'init');

      this._editVirtualDevice = configuration.virtualDevices.find(e => e.virtualDeviceId === virtualDeviceId);
      this.name = this._editVirtualDevice.current.name;
      this.zoneId = this._editVirtualDevice.current.zoneId;
      this.classId = this._editVirtualDevice.current.class;
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

      if (this._editVirtualDevice === null) {
        return;
      }

      // Check if anything has been modified
      this._modified = this.name !== this._editVirtualDevice.current.name || this.zoneId !== this._editVirtualDevice.current.zoneId || this.classId !== this._editVirtualDevice.current.class;

      // Name format
      if (!nameElt.validity.valid) {
        errorAndWarningList.addError("wizard2.edit-virtual-device.error-name");
      }

      // Name should be unique
      if (nameElt.validity.valid) {
        let tmp = configuration.virtualDevices.find(e => e.virtualDeviceId !== this._editVirtualDevice.virtualDeviceId && e.current.zoneId === this.zoneId && e.current.name === this.name);
        if (tmp !== undefined) {
          errorAndWarningList.addWarning("wizard2.edit-virtual-device.warning-name-already-used");
        }
      }

      // Class description
      this.classDescription = Homey.__('deviceClass.' + this.classId + '.description');
    },
    async back() {
      wizardlog('[' + this.componentName + '] ' + 'back');

      this._modified ? (await confirm(Homey.__("wizard2.edit-virtual-device.loseModification", "warning")) ? pageHandler.setPage('list-virtual-devices-page') : true) : pageHandler.setPage('list-virtual-devices-page');
    },
    async switchPage(newPage, data) {
      wizardlog('[' + this.componentName + '] ' + 'switchPage:', ...arguments);

      this._modified ? (await confirm(Homey.__("wizard2.edit-virtual-device.loseModification", "warning")) ? pageHandler.setPage(newPage, data) : true) : pageHandler.setPage(newPage, data);
    },

  };
};
