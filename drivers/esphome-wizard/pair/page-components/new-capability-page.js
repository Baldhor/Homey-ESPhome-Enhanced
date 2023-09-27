const NewCapabilityPage = function () {
  return {
    componentName: "new-capability-page",
    $template: "#template-new-capability-page",

    physicalDeviceId: null,
    nativeCapabilityId: null,

    _editVirtualDevice: null,

    _initValues: null,
    _modified: null,

    mounted() {
      wizardlog('[' + this.componentName + '] ' + 'mounted');

      pageHandler.registerComponent(this.componentName, this);
    },
    async init(virtualDeviceId) {
      wizardlog('[' + this.componentName + '] ' + 'init:', ...arguments);

      this._editVirtualDevice = configuration.virtualDevices.find(e => e.virtualDeviceId === virtualDeviceId);

      this._initValues = {};
      // If this virtual device already has a capability, init the physicalDeviceId (with first one)
      if (this._editVirtualDevice.current.capabilities.length > 0) {
        this.physicalDeviceId = this._initValues.physicalDeviceId = this._editVirtualDevice.current.capabilities[0].physicalDeviceId;
      } else {
        this.physicalDeviceId = this._initValues.physicalDeviceId = "unselected";
      }
      this.nativeCapabilityId = this._initValues.physicalDeviceId = "unselected";

      await PetiteVue.nextTick();
      this.checkValidity();
    },
    checkValidity() {
      wizardlog('[' + this.componentName + '] ' + 'checkValidity');

      // Reset error and warning messsages
      errorAndWarningList.reset();

      // If the physical device change, we must check if the selected native capability if still available
      if (this.physicalDeviceId !== "unselected" && this.nativeCapabilityId !== "unselected" && configuration.physicalDevices.find(e => e.physicalDeviceId === this.physicalDeviceId).nativeCapabilities.find(e => e.nativeCapabilityId === this.nativeCapabilityId) === undefined) {
        this.nativeCapabilityId !== "unselected";
      }

      this.checkModified();
    },
    checkModified() {
      wizardlog('[' + this.componentName + '] ' + 'checkModified');

      this._modified = Object.keys(this._initValues).find(key => this._initValues[key] !== this[key]) !== undefined;
    },
    async back() {
      wizardlog('[' + this.componentName + '] ' + 'back');

      this._modified ? (await confirm(Homey.__("wizard2.new-capability.loseModification", "warning")) ? pageHandler.setPage('edit-virtual-device-page', { virtualDeviceId: this._editVirtualDevice.virtualDeviceId }) : true) : pageHandler.setPage('edit-virtual-device-page', { virtualDeviceId: this._editVirtualDevice.virtualDeviceId });
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

  };
};
