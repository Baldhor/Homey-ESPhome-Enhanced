const ListVirtualDevicesPage = function () {
  return {
    componentName: "list-virtual-devices-page",
    $template: "#template-list-virtual-devices-page",

    _initValues: null,
    _modified: null,

    _hideUsedPhysicalDevices: true,

    _filterZoneId: null,

    mounted() {
      wizardlog('[' + this.componentName + '] ' + 'mounted');

      pageHandler.registerComponent(this.componentName, this);
    },
    async init() {
      wizardlog('[' + this.componentName + '] ' + 'init');

      this._initValues = {};

      this._hideUsedPhysicalDevices = !configuration.physicalDevices.find(e => !e.used) || configuration.physicalDevices.length > 3;
      this._filterZoneId = 'unselected';
      
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
    }
  };
};
