const EditVirtualDevicePage = function () {
  return {
    componentName: "edit-virtual-device-page",
    $template: "#template-edit-virtual-device-page",

    name: null,
    zoneId: null,
    classId: null,
    classDescription: null,

    _editVirtualDevice: null,

    _initValues: null,
    _modified: null,

    mounted() {
      wizardlog('[' + this.componentName + '] ' + 'mounted');

      pageHandler.registerComponent(this.componentName, this);
    },
    async init(virtualDeviceId) {
      wizardlog('[' + this.componentName + '] ' + 'init:', ...arguments);

      this._initValues = {};
      if (virtualDeviceId === undefined) {
        // new mode
        this._editVirtualDevice = null;

        this.name = this._initValues.name = "";
        this.zoneId = this._initValues.zoneId = "unselected";
        this.classId = this._initValues.classId = "unselected";
      } else {
        // edit mode
        this._editVirtualDevice = configuration.virtualDevices.find(e => e.virtualDeviceId === virtualDeviceId);

        this.name = this._initValues.name = this._editVirtualDevice.current.name;
        this.zoneId = this._initValues.zoneId = this._editVirtualDevice.current.zoneId;
        this.classId = this._initValues.classId = this._editVirtualDevice.current.class;
      }
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
        errorAndWarningList.addError("wizard2.edit-virtual-device.error-name");
      }

      // Name should be unique
      if (nameElt.validity.valid) {
        let tmp = configuration.virtualDevices.find(e => (this._editVirtualDevice === null || e.virtualDeviceId !== this._editVirtualDevice.virtualDeviceId) && e.current.zoneId === this.zoneId && e.current.name === this.name);
        if (tmp !== undefined) {
          errorAndWarningList.addWarning("wizard2.edit-virtual-device.warning-name-already-used");
        }
      }

      // Zone unselected
      if (this.zoneId === 'unselected') {
        zoneIdElt.setCustomValidity(false);
        errorAndWarningList.addError("wizard2.edit-virtual-device.error-zone");
      }

      // Class unselected
      if (this.classId === 'unselected') {
        classIdElt.setCustomValidity(false);
        this.classDescription = "";
        errorAndWarningList.addError("wizard2.edit-virtual-device.error-class");
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

      this._modified ? (await confirm(Homey.__("wizard2.edit-virtual-device.loseModification", "warning")) ? pageHandler.setPage('list-virtual-devices-page') : true) : pageHandler.setPage('list-virtual-devices-page');
    },
    async apply() {
      wizardlog('[' + this.componentName + '] ' + 'apply');

      Homey.showLoadingOverlay();

      try {
        if (this._editVirtualDevice === null) {
          await this._applyCreate();
        } else {
          await this._applyUpdate();
        }
      } catch (e) {
        wizardlog(e.stack);

        Homey.hideLoadingOverlay();
        alert(Homey.__("wizard2.edit-virtual-device.fatal-error", "error"));
      }
    },
    async _applyCreate() {
      wizardlog('[' + this.componentName + '] ' + '_applyCreate');

      let tmpVirtualDevice = {
        name: this.name,
        zone: this.zoneId,
        class: this.classId,
        data: {
          id: 'Wizard' + Date.now()
        }
      };

      await Homey.createDevice(tmpVirtualDevice)
        .catch(e => { throw e; });

      // Refresh configuration and refresh the page
      await configuration.load();

      // Find our new virtual device
      let virtualDevice = configuration.virtualDevices.find(virtualDevice => virtualDevice.internalDeviceId === tmpVirtualDevice.data.id);
      if (virtualDevice !== undefined) {
        pageHandler.setPage('edit-virtual-device-page', { virtualDeviceId: virtualDevice.virtualDeviceId });
      } else {
        throw new Error('Virtual device creation failed, cannot find it using internalDeviceId');
      }
    },
    async _applyUpdate() {
      wizardlog('[' + this.componentName + '] ' + '_applyUpdate');

      let tmpVirtualDevice = {
        virtualDeviceId: this._editVirtualDevice.virtualDeviceId,
        name: this.name,
        zoneId: this.zoneId,
        classId: this.classId
      };

      await Homey.emit('update-virtual-device', {
        virtualDevice: tmpVirtualDevice
      }).catch(e => { throw e; });

      // Refresh configuration and refresh the page
      await configuration.load();
      pageHandler.setPage('edit-virtual-device-page', { virtualDeviceId: tmpVirtualDevice.virtualDeviceId });
    },
    async confirmDelete() {
      wizardlog('[' + this.componentName + '] ' + 'confirmDelete');

      if (!await confirm(Homey.__("wizard2.edit-virtual-device.loseModification", "warning"))) {
        return;
      }

      await this._delete();
    },
    async _delete() {
      wizardlog('[' + this.componentName + '] ' + '_delete');

      Homey.showLoadingOverlay();

      try {
        await Homey.emit('delete-virtual-device', {
          virtualDeviceId: this._editVirtualDevice.virtualDeviceId
        }).catch(e => { throw e; });

        // Refresh configuration and go to previous page
        await configuration.load();
        pageHandler.setPage('list-virtual-devices-page');
      } catch (e) {
        wizardlog(e.stack);

        Homey.hideLoadingOverlay();
        alert(Homey.__("wizard2.edit-virtual-device.fatal-error", "error"));
      }
    },
    async switchPage(newPage, data) {
      wizardlog('[' + this.componentName + '] ' + 'switchPage:', ...arguments);

      this._modified ? (await confirm(Homey.__("wizard2.edit-virtual-device.loseModification", "warning")) ? pageHandler.setPage(newPage, data) : true) : pageHandler.setPage(newPage, data);
    }
  };
};
