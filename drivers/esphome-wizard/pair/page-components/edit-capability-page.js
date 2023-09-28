const EditCapabilityPage = function () {
  return {
    componentName: "edit-capability-page",
    $template: "#template-edit-capability-page",

    physicalDeviceId: null,
    nativeCapabilityId: null,
    capabilityType: null,
    capabilityTypeDescription: null,

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
      } else {
        // edit mode
        this._editCapability = this._editVirtualDevice.current.capabilities.find(capability => capability.capabilityId === capabilityId);

        this.physicalDeviceId = this._initValues.physicalDeviceId = this._editCapability.physicalDeviceId;
        this.nativeCapabilityId = this._initValues.nativeCapabilityId = this._editCapability.nativeCapabilityId;
        this.capabilityType = this._initValues.capabilityType = this._editCapability.type;
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

      // Retrieve elements from refs
      const physicalDeviceIdElt = this.$refs.physicalDeviceId;
      const nativeCapabilityIdElt = this.$refs.nativeCapabilityId;
      const capabilityTypeElt = this.$refs.capabilityType;

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
        capabilityTypeElt.setCustomValidity(false);
        errorAndWarningList.addError("wizard2.edit-capability.error-capability-type");
        this.capabilityTypeDescription = "";
      } else {
        this.capabilityTypeDescription = Homey.__('capabilityType.' + this.capabilityType + '.description');
      }

      this.checkModified();
    },
    checkModified() {
      wizardlog('[' + this.componentName + '] ' + 'checkModified');

      this._modified = Object.keys(this._initValues).find(key => this._initValues[key] !== this[key]) !== undefined;
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
    }
  };
};
