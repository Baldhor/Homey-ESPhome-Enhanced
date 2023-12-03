const EditCapabilityPage = function () {
  return {
    componentName: "edit-capability-page",
    $template: "#template-edit-capability-page",

    physicalDeviceId: null,
    nativeCapabilityId: null,
    capabilityType: null,
    capabilityOptions: {},
    capabilityTypeDescription: null,

    _hideConfigs: true,
    _hideConstraints: true,

    _editVirtualDevice: null,
    _editCapability: null,

    _physicalDeviceSelected: null,
    _nativeCapabilitySelected: null,
    _compatibleTypes: null,

    _initValues: null,
    _modified: null,

    mounted() {
      wizardlog('[' + this.componentName + '] ' + 'mounted');

      pageHandler.registerComponent(this.componentName, this);
    },
    async init(virtualDeviceId, capabilityId) {
      wizardlog('[' + this.componentName + '] ' + 'init:', ...arguments);

      this._editVirtualDevice = configuration.virtualDevices.find(e => e.virtualDeviceId === virtualDeviceId);

      this._initValues = {};
      this._hideConfigs = true;
      this._hideConstraints = true;

      if (capabilityId === undefined) {
        // new mode
        this._editCapability = null;

        // If this virtual device already has a capability, init the physicalDeviceId (with first one)
        if (this._editVirtualDevice.current.capabilities.length > 0) {
          this.physicalDeviceId = this._initValues.physicalDeviceId = this._editVirtualDevice.current.capabilities[0].physicalDeviceId;
        } else {
          this.physicalDeviceId = this._initValues.physicalDeviceId = "unselected";
        }
        this.nativeCapabilityId = this._initValues.nativeCapabilityId = "unselected";
        this.capabilityType = this._initValues.capabilityType = "unselected";

        // Other options!
        this._initValues.capabilityOptions = {};
      } else {
        // edit mode
        this._editCapability = this._editVirtualDevice.current.capabilities.find(capability => capability.capabilityId === capabilityId);

        this.physicalDeviceId = this._initValues.physicalDeviceId = this._editCapability.physicalDeviceId;
        this.nativeCapabilityId = this._initValues.nativeCapabilityId = this._editCapability.nativeCapabilityId;
        this.capabilityType = this._initValues.capabilityType = this._editCapability.type;

        // Other options!
        this._initValues.capabilityOptions = {};
        this._initCapabilityOptionsValues();
        Object.keys(this._editCapability.options).forEach(optionKey => {
          this._initValues.capabilityOptions[optionKey] = this._editCapability.options[optionKey];
        });
      }
      this.capabilityOptions = Object.assign({}, this._initValues.capabilityOptions); // must be a seperate instance (shallow copy)
      this.capabilityTypeDescription = "";

      await PetiteVue.nextTick();
      this.checkValidity();
    },
    _updateComputedProperties() {
      wizardlog('[' + this.componentName + '] ' + '_updateComputedProperties');

      if (this.physicalDeviceId !== "unselected") {
        this._physicalDeviceSelected = configuration.physicalDevices.find(physicalDevice => physicalDevice.physicalDeviceId === this.physicalDeviceId);
      } else {
        this._physicalDeviceSelected = null;
      }
      if (this.nativeCapabilityId !== "unselected") {
        this._nativeCapabilitySelected = this._physicalDeviceSelected.nativeCapabilities.find(nativeCapability => nativeCapability.nativeCapabilityId === this.nativeCapabilityId);

        // If the physical device change, we must check if the selected native capability is still available
        if (this._nativeCapabilitySelected === undefined) {
          this.nativeCapabilityId = "unselected";
          this._nativeCapabilitySelected = null;
        } else {
          this._updateCompatibleTypes();
        }
      } else {
        this._nativeCapabilitySelected = null;
      }
      if (this.capabilityType !== "unselected") {
        // Need to make sure the selected capability is still compatible
        if (!this._compatibleTypes.includes(this.capabilityType)) {
          this.capabilityType = "unselected";
        }
      }
    },
    checkValidity() {
      wizardlog('[' + this.componentName + '] ' + 'checkValidity');

      // Reset error and warning messsages
      errorAndWarningList.reset();

      // Update computed properties
      this._updateComputedProperties();

      // Update capability options as needed
      this._updateCapabilityOptions();

      // Retrieve elements from refs
      const physicalDeviceIdElt = this.$refs.physicalDeviceId;
      const nativeCapabilityIdElt = this.$refs.nativeCapabilityId;
      const capabilityTypeElt = this.$refs.capabilityType;
      const capabilityIndexElt = this.$refs.capabilityIndex;
      const capabilityTitleElt = this.$refs.capabilityTitle;
      const capabilityStepElt = this.$refs.capabilityStep;
      const capabilityMinElt = this.$refs.capabilityMin;
      const capabilityMaxElt = this.$refs.capabilityMax;

      // Reset custom validity
      physicalDeviceIdElt.setCustomValidity('');
      nativeCapabilityIdElt.setCustomValidity('');
      capabilityTypeElt.setCustomValidity('');
      capabilityTitleElt.setCustomValidity('');
      capabilityStepElt.setCustomValidity('');
      capabilityMinElt.setCustomValidity('');
      capabilityMaxElt.setCustomValidity('');

      if (this.physicalDeviceId === "unselected") {
        physicalDeviceIdElt.setCustomValidity(false);
        errorAndWarningList.addError("wizard2.edit-capability.error-physical-device");
      }

      if (this.nativeCapabilityId === "unselected") {
        nativeCapabilityIdElt.setCustomValidity(false);
        errorAndWarningList.addError("wizard2.edit-capability.error-native-capability");
      }

      if (this.capabilityType === "unselected") {
        if (this.nativeCapabilityId !== "unselected") {
          capabilityTypeElt.setCustomValidity(false);
          errorAndWarningList.addError("wizard2.edit-capability.error-capability-type");
        }
        this.capabilityTypeDescription = "";
      } else {
        this.capabilityTypeDescription = Homey.__('capabilityType.' + (this.capabilityType.startsWith("esphome_enum_") ? "esphome_enum_all" : this.capabilityType) + '.description');
      }

      if (capabilityIndexElt !== undefined && !capabilityIndexElt.validity.valid) {
        errorAndWarningList.addError("wizard2.edit-capability.error-capability-index");
      }

      // TODO: Index should be unique or empty for default behaviour

      if (capabilityTitleElt !== undefined) {
        if (!capabilityTitleElt.validity.valid) {
          errorAndWarningList.addError("wizard2.edit-capability.error-capability-title");
        } else if (this.capabilityType.startsWith("esphome_") && this.capabilityOptions.title === "") {
          capabilityTitleElt.setCustomValidity(false);
          errorAndWarningList.addError("wizard2.edit-capability.error-capability-title-required");
        }
      }

      // Decimals and Step should be consistent with each others
      // - Step cannot have a highter precision than Decimals
      if (this.capabilityOptions['step'] <= 0) {
        capabilityStepElt.setCustomValidity(false);
        errorAndWarningList.addError("wizard2.edit-capability.error-capability-step");
      } else if (this.computePrecisionFromStep(this.capabilityOptions['step']) > this.capabilityOptions['decimals']) {
        capabilityStepElt.setCustomValidity(false);
        errorAndWarningList.addError("wizard2.edit-capability.error-capability-step");
      }

      // Min>Max
      if (this.capabilityOptions['min'] >= this.capabilityOptions['max']) {
        capabilityMinElt.setCustomValidity(false);
        capabilityMaxElt.setCustomValidity(false);
        errorAndWarningList.addError("wizard2.edit-capability.error-capability-min");
      }

      // TODO: remove this log
      wizardlog('capabilityOptions:', this.capabilityOptions);

      this.checkModified();
    },
    computePrecisionFromStep(step) {
      wizardlog('[' + this.componentName + '] ' + 'computePrecisionFromStep:', ...arguments);

      // little stupid way to find it, but I don't know better one :)
      // Assuming step is a float (even if it is actually an integer)
      for (let i = 0; i <= 10; i++) {
        let stepMultiplied = step * Math.pow(10, i);

        // For precision 0, we just use initial step value, not 0 :)
        if (i === 0) {
          stepMultiplied = step;
        }

        // Now we compare using double convert trick
        if (parseFloat(parseInt(stepMultiplied)) == stepMultiplied) {
          // Same result, it means the precision is correct!
          wizardlog('[' + this.componentName + '] ' + 'Found precision', i, 'for step', step);
          return i;
        }
      }

      // We didn't find it, but it's not an error
      wizardlog('[' + this.componentName + '] ' + "Couldn't find precision for step:", step);
      return 0;
    },
    checkModified() {
      wizardlog('[' + this.componentName + '] ' + 'checkModified');

      // process capabilityOptions separatly
      let modified = Object.keys(this._initValues).filter(key => key !== 'capabilityOptions').find(key => this._initValues[key] !== this[key]) !== undefined;
      if (!modified) {
        // It means that the capability type is unmodified
        // We can trust the each option "should have" an initial value
        // However, a capability option may be missing in the initial values, or be null
        modified = Object.keys(this.capabilityOptions).find(capabilityKey => {
          let initialValue = this._initValues.capabilityOptions[capabilityKey];
          if (initialValue === undefined || initialValue !== this.capabilityOptions[capabilityKey]) {
            wizardlog('[' + this.componentName + '] ' + 'capability option modified:', capabilityKey);
            return true;
          }
        }) !== undefined;
      }
      this._modified = modified;
    },
    async back() {
      wizardlog('[' + this.componentName + '] ' + 'back');

      this._modified ? (await confirm(Homey.__("wizard2.edit-capability.loseModification", "warning")) ? pageHandler.setPage('edit-virtual-device-page', { virtualDeviceId: this._editVirtualDevice.virtualDeviceId }) : true) : pageHandler.setPage('edit-virtual-device-page', { virtualDeviceId: this._editVirtualDevice.virtualDeviceId });
    },
    async apply() {
      wizardlog('[' + this.componentName + '] ' + 'apply');

      Homey.showLoadingOverlay();

      try {
        let tmpAction = null;
        let tmpCapability = {};

        if (this._editCapability === null) {
          // new mode
          tmpAction = 'new';

          // index
          tmpCapability.index = this.capabilityOptions.index;
          if (tmpCapability.index === "") {
            // If index is empty, we need to calculate one
            let tmpIndex = 1;
            this._editVirtualDevice.current.capabilities.filter(capability => capability.type === this.capabilityType && capability.options.index === undefined).forEach(capability => {
              if (tmpIndex <= parseInt(capability.index)) {
                tmpIndex = parseInt(capability.index) + 1;
              }
            });
            tmpCapability.index = tmpIndex.toString();
          }
        } else {
          // edit mode
          tmpAction = 'edit';
          tmpCapability.initialCapabilityId = this._editCapability.capabilityId;

          // index
          tmpCapability.index = this.capabilityOptions.index;
          if (tmpCapability.index === "") {
            // If index is empty, we reuse current index
            tmpCapability.index = this._editCapability.index;
          }
        }

        // type
        tmpCapability.type = this.capabilityType;

        // capabilityId
        if (tmpCapability.index === "1") {
          tmpCapability.capabilityId = tmpCapability.type;
        } else {
          tmpCapability.capabilityId = tmpCapability.type + "." + tmpCapability.index;
        }

        // physicalDeviceId
        tmpCapability.physicalDeviceId = this.physicalDeviceId;

        // nativeCapabilityId
        tmpCapability.nativeCapabilityId = this.nativeCapabilityId;

        // options - need remove null and empty options
        tmpCapability.options = {};
        Object.keys(this.capabilityOptions).forEach(key => {
          if (this.capabilityOptions[key] !== null && this.capabilityOptions[key] !== "") {
            tmpCapability.options[key] = this.capabilityOptions[key];
          }
        });

        let tmpPhysicalDevice = {
          'physicalDeviceId': this._physicalDeviceSelected.physicalDeviceId,
          name: this._physicalDeviceSelected.name,
          ipAddress: this._physicalDeviceSelected.ipAddress,
          port: this._physicalDeviceSelected.port,
          encryptionKey: this._physicalDeviceSelected.encryptionKey,
          password: this._physicalDeviceSelected.password
        };

        // Add or update the capability to the virtual device
        await Homey.emit('apply-capability', {
          virtualDeviceId: this._editVirtualDevice.virtualDeviceId,
          action: tmpAction,
          capability: tmpCapability,
          physicalDevice: tmpPhysicalDevice
        }).catch(e => { throw e; });

        // Refresh configuration and go to previous page
        // But in 5 seconds, the time for the new physical device to initialize if needed
        setTimeout(async () => {
          await configuration.load();
          pageHandler.setPage('edit-virtual-device-page', { virtualDeviceId: this._editVirtualDevice.virtualDeviceId });
        }, 5000);
      } catch (e) {
        wizardlog(e.stack);

        Homey.hideLoadingOverlay();
        alert(Homey.__("wizard2.edit-capability.fatal-error", "error"));
      }
    },
    async confirmDelete() {
      wizardlog('[' + this.componentName + '] ' + 'confirmDelete');

      if (!await confirm(Homey.__("wizard2.edit-capability.warning-delete", "warning"))) {
        return;
      }

      await this._delete();
    },
    async _delete() {
      wizardlog('[' + this.componentName + '] ' + '_delete');

      Homey.showLoadingOverlay();

      try {
        await Homey.emit('delete-capability', {
          virtualDeviceId: this._editVirtualDevice.virtualDeviceId,
          capabilityId: this._editCapability.capabilityId
        }).catch(e => { throw e; });

        // Refresh configuration and go to previous page
        await configuration.load();
        pageHandler.setPage('edit-virtual-device-page', { virtualDeviceId: this._editVirtualDevice.virtualDeviceId });
      } catch (e) {
        wizardlog(e.stack);

        Homey.hideLoadingOverlay();
        alert(Homey.__("wizard2.edit-capability.fatal-error", "error"));
      }
    },
    _updateCompatibleTypes() {
      wizardlog('[' + this.componentName + '] ' + '_updateCompatibleTypes');

      if (this._nativeCapabilitySelected === null) {
        return;
      }

      // We use a multicriterea list to obtain the compatible capabilities
      // We just need to filter it

      // Prepare criterea
      let valueTypeCriterea = null; // One of boolean, number or string
      let getableCriterea = null; // boolean
      let setableCriterea = null; // boolean
      let nativeCapabilityCriterea = null // format: nativeCapability.type + '.' nativeCapability.attribut
      let specialCaseCriterea = null;
      let valuesCriterea = null;

      // Compute type
      valueTypeCriterea = this._nativeCapabilitySelected.constraints.type;

      // Compute getable/setable
      if (this._nativeCapabilitySelected.configs['readOnly']) {
        getableCriterea = true;
        setableCriterea = false;
      } else if (this._nativeCapabilitySelected.configs['writeOnly']) {
        getableCriterea = false;
        setableCriterea = true;
      }

      // Compute native_capability
      nativeCapabilityCriterea = this._nativeCapabilitySelected.type + '.' + this._nativeCapabilitySelected.attribut;

      // Compute special case criterea
      specialCaseCriterea = this._nativeCapabilitySelected.specialCase;

      // Compute values criterea
      if (this._nativeCapabilitySelected.constraints.values) {
        valuesCriterea = [...this._nativeCapabilitySelected.constraints.values];
        valuesCriterea.sort();
      }

      // Apply critera
      // A null criterea means don't apply it
      let capabilityList = CAPABILITY_CONFIGURATION;
      if (valueTypeCriterea !== null) {
        capabilityList = capabilityList.filter(capabilityConf => capabilityConf.valueType === valueTypeCriterea);
      }
      if (getableCriterea !== null) {
        capabilityList = capabilityList.filter(capabilityConf => capabilityConf.getable === getableCriterea);
      }
      if (setableCriterea !== null) {
        capabilityList = capabilityList.filter(capabilityConf => capabilityConf.setable === setableCriterea);
      }
      capabilityList = capabilityList.filter(capabilityConf => capabilityConf.nativeCapabilitySupported === null || capabilityConf.nativeCapabilitySupported.includes(nativeCapabilityCriterea));
      capabilityList = capabilityList.filter(capabilityConf => capabilityConf.nativeCapabilityUnsupported === null || !capabilityConf.nativeCapabilityUnsupported.includes(nativeCapabilityCriterea));
      if (specialCaseCriterea !== null) {
        capabilityList = capabilityList.filter(capabilityConf => capabilityConf.specialCaseSupported === null || capabilityConf.specialCaseSupported.includes(specialCaseCriterea));
      } else {
        capabilityList = capabilityList.filter(capabilityConf => capabilityConf.specialCaseSupported === null || capabilityConf.specialCaseSupported.length === 0);
      }
      if (valuesCriterea) {
        capabilityList = capabilityList.filter(capabilityConf => capabilityConf.valuesSupported === undefined || this._compareArray(valuesCriterea, capabilityConf.valuesSupported));
      }

      // Extract capabilities
      let compatibleCapabilityTypes = [];
      capabilityList.forEach(capability => compatibleCapabilityTypes.push(capability.type));

      this._compatibleTypes = compatibleCapabilityTypes;
    },
    _compareArray(a, b) {
      var isEqual = false;
      if (Array.isArray(a) && Array.isArray(b) && a.length == b.length) {
        a.sort();
        b.sort();
        var i;
        for (i = 0; i < a.length; i++) {
          if (a[i] === b[i]) {
            isEqual = true;
          } else {
            isEqual = false;
            break;
          }
        }
      }
      return isEqual;
    },
    _initCapabilityOptionsValues() {
      wizardlog('[' + this.componentName + '] ' + '_initCapabilityOptionsValues');

      // Update computed properties
      this._updateComputedProperties();
      
      // Reminder, they will be erased by current values

      // Get applicable options and apply default values
      let capabilityConf = CAPABILITY_CONFIGURATION.find(capabilityConf => capabilityConf.type === this.capabilityType);

      capabilityConf.options.forEach(optionKey => {
        // Add this option key
        let optionValue = null;

        switch (optionKey) {
          case 'index':
          case 'title':
            optionValue = "";

            break;

          case 'preventInsights':
          case 'preventTag':
          case 'getable':
          case 'approximated':
          case 'zoneActivity':
            if (optionKey === 'zoneActivity') {
              if (['alarm_contact', 'alarm_motion'].includes(this.capabilityType)) {
                optionValue = true;
              } else {
                optionValue = false;
              }
            } else if (optionKey === 'getable') {
              optionValue = true;
            }

            // getable should be false if the option is writeOnly!
            if (optionKey === 'getable' && this._nativeCapabilitySelected.configs.writeOnly === true) {
              optionValue = false;
            }

            break;

          case 'decimals':
            optionValue = this._nativeCapabilitySelected.configs.precision;
            if (optionValue === undefined) {
              optionValue = 0;
            }

            break;

          case 'min':
            optionValue = this._nativeCapabilitySelected.constraints.min;
            if (optionValue === undefined) {
              optionValue = 0;
            }

            break;

          case 'max':
            optionValue = this._nativeCapabilitySelected.constraints.max;
            if (optionValue === undefined) {
              optionValue = 100;
            }

            break;

          case 'step':
            optionValue = this._nativeCapabilitySelected.constraints.step;
            if (optionValue === undefined || typeof optionValue !== 'number') {
              optionValue = 1;
            }

            if (optionValue < 0) {
              optionValue = 0 - optionValue;
            }

            break;

          case 'units':
            optionValue = this._nativeCapabilitySelected.configs.unit;
            if (optionValue === undefined) {
              optionValue = "";
            }

            break;

          case 'values':
            optionValue = [...this._nativeCapabilitySelected.constraints.values];

            break;

          default:
            throw new Error('Unknown optionKey, please fix the code: ' + optionKey);
        }

        this._initValues.capabilityOptions[optionKey] = optionValue;
      });
    },
    _updateCapabilityOptions() {
      wizardlog('[' + this.componentName + '] ' + '_updateCapabilityOptions');

      if (this.capabilityType === "unselected") {
        return;
      }

      // Get applicable options and apply default values
      let capabilityConf = CAPABILITY_CONFIGURATION.find(capabilityConf => capabilityConf.type === this.capabilityType);

      // default values come in order:
      // 1- From the current value (bounded if needed)
      // 2- From the initial value (bounded if needed)
      // 3- From the native capability
      // 4- Arbitrary
      // 5- Enforced
      capabilityConf.options.forEach(optionKey => {
        // Add this option key
        let optionValue = null;

        switch (optionKey) {
          case 'index':
          case 'title':
            // Set default value, in case it's null by default ...
            optionValue = this.capabilityOptions[optionKey];
            if (optionValue === null || optionValue === undefined) {
              optionValue = "";
            }
            
            break;

          case 'preventInsights':
          case 'preventTag':
          case 'getable':
          case 'approximated':
          case 'zoneActivity':
            // 1- From the current value (bounded if needed)
            optionValue = this.capabilityOptions[optionKey];
            if (optionValue === undefined || typeof optionValue !== 'boolean') {
              optionValue = null;
            }

            // 2- From the initial value (bounded if needed)
            if (optionValue === null) {
              optionValue = this._initValues.capabilityOptions[optionKey];
              if (optionValue === undefined || typeof optionValue !== 'boolean') {
                optionValue = null;
              }
            }

            // 3- From the native capability
            // do nothing

            // 4- Arbitrary
            if (optionValue === null) {
              if (optionKey === 'zoneActivity') {
                if (['alarm_contact', 'alarm_motion'].includes(this.capabilityType)) {
                  optionValue = true;
                } else {
                  optionValue = false;
                }
              } else if (optionKey === 'getable') {
                optionValue = true;
              }
            }

            // 5- Enforced
            // getable should be false if the option is writeOnly!
            if (optionKey === 'getable' && this._nativeCapabilitySelected.configs.writeOnly === true) {
              optionValue = false;
            }

            break;

          case 'decimals':
            // 1- From the current value (bounded if needed)
            optionValue = this.capabilityOptions[optionKey];
            if (optionValue === undefined || typeof optionValue !== 'number' || !Number.isInteger(optionValue)) {
              optionValue = null;
            } else if (optionValue < 0) {
              optionValue = 0;
            } else if (optionValue > 10) {
              optionValue = 10;
            }

            // 2- From the initial value (bounded if needed)
            if (optionValue === null) {
              optionValue = this._initValues.capabilityOptions[optionKey];
              if (optionValue === undefined || typeof optionValue !== 'number' || !Number.isInteger(optionValue)) {
                optionValue = null;
              } else if (optionValue < 0) {
                optionValue = 0;
              } else if (optionValue > 10) {
                optionValue = 10;
              }
            }

            // 3- From the native capability
            if (optionValue === null) {
              optionValue = this._nativeCapabilitySelected.configs.precision;
              if (optionValue === undefined) {
                optionValue = null;
              }
            }

            // 4- Arbitrary
            if (optionValue === null) {
              optionValue = 0;
            }

            // 5- Enforced
            // do nothing

            break;

          case 'min':
            // 1- From the current value (bounded if needed)
            optionValue = this.capabilityOptions[optionKey];
            if (optionValue === undefined || typeof optionValue !== 'number') {
              optionValue = null;
            } else if (this._nativeCapabilitySelected.constraints.min !== undefined && optionValue < this._nativeCapabilitySelected.constraints.min) {
              optionValue = this._nativeCapabilitySelected.constraints.min;
            } else if (this._nativeCapabilitySelected.constraints.max !== undefined && optionValue > this._nativeCapabilitySelected.constraints.max) {
              optionValue = this._nativeCapabilitySelected.constraints.max;
            }

            // 2- From the initial value (bounded if needed)
            if (optionValue === null) {
              optionValue = this._initValues.capabilityOptions[optionKey];
              if (optionValue === undefined || typeof optionValue !== 'number') {
                optionValue = null;
              } else if (this._nativeCapabilitySelected.constraints.min !== undefined && optionValue < this._nativeCapabilitySelected.constraints.min) {
                optionValue = this._nativeCapabilitySelected.constraints.min;
              } else if (this._nativeCapabilitySelected.constraints.max !== undefined && optionValue > this._nativeCapabilitySelected.constraints.max) {
                optionValue = this._nativeCapabilitySelected.constraints.max;
              }
            }

            // 3- From the native capability
            if (optionValue === null) {
              optionValue = this._nativeCapabilitySelected.constraints.min;
              if (optionValue === undefined) {
                optionValue = null;
              }
            }

            // 4- Arbitrary
            if (optionValue === null) {
              optionValue = 0;
            }

            // 5- Enforced
            // do nothing

            break;

          case 'max':
            // 1- From the current value (bounded if needed)
            optionValue = this.capabilityOptions[optionKey];
            if (optionValue === undefined || typeof optionValue !== 'number') {
              optionValue = null;
            } else if (this._nativeCapabilitySelected.constraints.min !== undefined && optionValue < this._nativeCapabilitySelected.constraints.min) {
              optionValue = this._nativeCapabilitySelected.constraints.min;
            } else if (this._nativeCapabilitySelected.constraints.max !== undefined && optionValue > this._nativeCapabilitySelected.constraints.max) {
              optionValue = this._nativeCapabilitySelected.constraints.max;
            }

            // 2- From the initial value (bounded if needed)
            if (optionValue === null) {
              optionValue = this._initValues.capabilityOptions[optionKey];
              if (optionValue === undefined || typeof optionValue !== 'number') {
                optionValue = null;
              } else if (this._nativeCapabilitySelected.constraints.min !== undefined && optionValue < this._nativeCapabilitySelected.constraints.min) {
                optionValue = this._nativeCapabilitySelected.constraints.min;
              } else if (this._nativeCapabilitySelected.constraints.max !== undefined && optionValue > this._nativeCapabilitySelected.constraints.max) {
                optionValue = this._nativeCapabilitySelected.constraints.max;
              }
            }

            // 3- From the native capability
            if (optionValue === null) {
              optionValue = this._nativeCapabilitySelected.constraints.max;
              if (optionValue === undefined) {
                optionValue = null;
              }
            }

            // 4- Arbitrary
            if (optionValue === null) {
              optionValue = 100;
            }

            // 5- Enforced
            // do nothing

            break;

          case 'step':
            // 1- From the current value (bounded if needed)
            optionValue = this.capabilityOptions[optionKey];
            if (optionValue === undefined || typeof optionValue !== 'number') {
              optionValue = null;
            }

            // 2- From the initial value (bounded if needed)
            if (optionValue === null) {
              optionValue = this._initValues.capabilityOptions[optionKey];
              if (optionValue === undefined || typeof optionValue !== 'number') {
                optionValue = null;
              }
            }

            // 3- From the native capability
            if (optionValue === null) {
              optionValue = this._nativeCapabilitySelected.constraints.step;
              if (optionValue === undefined || typeof optionValue !== 'number') {
                optionValue = null;
              }
            }

            // 4- Arbitrary
            if (optionValue === null) {
              optionValue = 1;
            }

            // 5- Enforced
            if (optionValue < 0) {
              optionValue = 0 - optionValue;
            }

            break;

          case 'units':
            // 1- From the current value (bounded if needed)
            optionValue = this.capabilityOptions[optionKey];
            if (optionValue === undefined) {
              optionValue = null;
            }

            // 2- From the initial value (bounded if needed)
            if (optionValue === null) {
              optionValue = this._initValues.capabilityOptions[optionKey];
              if (optionValue === undefined) {
                optionValue = null;
              }
            }

            // 3- From the native capability
            if (optionValue === null) {
              this._nativeCapabilitySelected.configs.unit
              if (optionValue === undefined) {
                optionValue = null;
              }
            }

            // 4- Arbitrary
            if (optionValue === null) {
              optionValue = ""; // TODO: default unit based on the capability type?
            }

            // 5- Enforced
            // do nothing

            break;

          case 'values':
            // 1- From the current value (bounded if needed)
            // do nothing

            // 2- From the initial value (bounded if needed)
            // do nothing

            // 3- From the native capability
            optionValue = [...this._nativeCapabilitySelected.constraints.values];

            // 4- Arbitrary
            // do nothing

            // 5- Enforced
            // do nothing

            break;

          default:
            throw new Error('Unknown optionKey, please fix the code: ' + optionKey);
        }
        
        this.capabilityOptions[optionKey] = optionValue;
      });

      // Remove not applicable options
      Object.keys(this.capabilityOptions).forEach(capabilityKey => {
        if (!capabilityConf.options.includes(capabilityKey)) {
          delete this.capabilityOptions[capabilityKey];
        }
      });
    }
  };
};
