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
        this._initValues.capabilityOptions['index'] = "";
        this._initValues.capabilityOptions['title'] = "";
        this.capabilityOptions = JSON.parse(JSON.stringify(this._initValues.capabilityOptions)); // must be a seperate instance (deep copy)
      } else {
        // edit mode
        this._editCapability = this._editVirtualDevice.current.capabilities.find(capability => capability.capabilityId === capabilityId);

        this.physicalDeviceId = this._initValues.physicalDeviceId = this._editCapability.physicalDeviceId;
        this.nativeCapabilityId = this._initValues.nativeCapabilityId = this._editCapability.nativeCapabilityId;
        this.capabilityType = this._initValues.capabilityType = this._editCapability.type;

        // Other options!
        this._initValues.capabilityOptions = [];
        Object.keys(this._editCapability.options).forEach(optionKey => {
          this._initValues.capabilityOptions[optionKey] = this._editCapability.options[optionKey];
        });
        this.capabilityOptions = JSON.parse(JSON.stringify(this._initValues.capabilityOptions)); // must be a seperate instance (deep copy)
      }
      this.capabilityTypeDescription = "";

      await PetiteVue.nextTick();
      this.checkValidity();
    },
    checkValidity() {
      wizardlog('[' + this.componentName + '] ' + 'checkValidity');

      // Reset error and warning messsages
      errorAndWarningList.reset();

      // Update computed properties
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

      // Update capability options as needed
      this._updateCapabilityOptions();


      // Retrieve elements from refs
      const physicalDeviceIdElt = this.$refs.physicalDeviceId;
      const nativeCapabilityIdElt = this.$refs.nativeCapabilityId;
      const capabilityTypeElt = this.$refs.capabilityType;
      const capabilityIndexElt = this.$refs.capabilityIndex;
      const capabilityTitleElt = this.$refs.capabilityTitle;

      // Reset custom validity
      physicalDeviceIdElt.setCustomValidity('');
      nativeCapabilityIdElt.setCustomValidity('');
      capabilityTypeElt.setCustomValidity('');

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
        this.capabilityTypeDescription = Homey.__('capabilityType.' + this.capabilityType + '.description');
      }

      if (capabilityIndexElt !== undefined && !capabilityIndexElt.validity.valid) {
        errorAndWarningList.addError("wizard2.edit-capability.error-capability-index");
      }

      if (capabilityTitleElt !== undefined && !capabilityTitleElt.validity.valid) {
        errorAndWarningList.addError("wizard2.edit-capability.error-capability-title");
      }

      // TODO: remove this log
      wizardlog('capabilityOptions:', this.capabilityOptions);

      this.checkModified();
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
          return initialValue === undefined || initialValue === null || initialValue !== this.capabilityOptions[capabilityKey];
        }) !== undefined;
      }
      this._modified = modified;
    },
    async back() {
      wizardlog('[' + this.componentName + '] ' + 'back');

      this._modified ? (await confirm(Homey.__("wizard2.edit-capability.loseModification", "warning")) ? pageHandler.setPage('edit-virtual-device-page', { virtualDeviceId: this._editVirtualDevice.virtualDeviceId }) : true) : pageHandler.setPage('edit-virtual-device-page', { virtualDeviceId: this._editVirtualDevice.virtualDeviceId });
    },
    async apply() {
      wizardlog('[' + this.componentName + '] ' + 'back');

      // Add selected native capability to virtual device capability
      let tmpCapability = {
        capabilityId: 'Wizard' + Date.now(), // TODO
        type: null,
        index: null,
        options: null,
        physicalDeviceId: this.physicalDeviceId,
        nativeCapabilityId: this.nativeCapabilityId,
        status: "new"
      }

      // Save the new capability
      // Remark: if not fully edited in the edit capability page, it will be removed later (cf. init function of edit-virtual-device-page)
      this._editVirtualDevice.current.capabilities.push(tmpCapability);

      // Added native capability must go through the edit-capability-page
      pageHandler.setPage('edit-virtual-device-page', { virtualDeviceId: this._editVirtualDevice.virtualDeviceId });
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

      // Compute type
      switch (this._nativeCapabilitySelected.type) {
        case 'BinarySensor':
        case 'Button':
        case 'Switch':
          valueTypeCriterea = 'boolean';
          break;

        case 'Cover':
        case 'Number':
        case 'Sensor':
          valueTypeCriterea = 'number';
          break;

        case 'TextSensor':
          valueTypeCriterea = 'string';
          break;
      }

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

      // Extract capabilities
      let compatibleCapabilityTypes = [];
      capabilityList.forEach(capability => compatibleCapabilityTypes.push(capability.type));

      this._compatibleTypes = compatibleCapabilityTypes;
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
            break;

          case 'preventInsights':
          case 'preventTag':
          case 'getable':
          case 'approximated':
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
              optionValue = false;
            }

            // 5- Enforced
            // getable should be true by default if the option is readOnly!
            if (optionKey === 'getable' && optionValue === false && this._nativeCapabilitySelected.configs.readOnly === true) {
              optionValue = true;
            }

            this.capabilityOptions[optionKey] = optionValue;
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

            this.capabilityOptions[optionKey] = optionValue;
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

            this.capabilityOptions[optionKey] = optionValue;
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

            this.capabilityOptions[optionKey] = optionValue;
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

            this.capabilityOptions[optionKey] = optionValue;
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

            this.capabilityOptions[optionKey] = optionValue;
            break;

          default:
            throw new Error('Unknown optionKey, please fix the code:', optionKey);
        }
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
