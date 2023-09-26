const pageHandler = PetiteVue.reactive({
  componentName: 'pageHandler',
  currentPage: null,
  _registeredComponents: {},
  registerComponent(name, component) {
    this._registeredComponents[name] = component;
  },
  setMainPage() {
    this.setPage('main-page');
  },
  setPage(pageId, data) {
    Homey.showLoadingOverlay();
    PetiteVue.nextTick(() => { this._initPage(pageId, data); });
  },
  async _initPage(newPage, data) {
    wizardlog('[' + this.componentName + '] ' + "_initPage:", ...arguments);

    try {
      switch (newPage) {
        case 'main-page':
          await this._registeredComponents[newPage].init();
          break;

        case 'list-virtual-devices-page':
          await this._registeredComponents[newPage].init();
          break;

        case 'new-physical-device-page':
          await this._registeredComponents[newPage].init();
          break;

        case 'new-virtual-device-page':
          await this._registeredComponents[newPage].init();
          break;

        case 'edit-virtual-device-page':
          await this._registeredComponents[newPage].init(data.virtualDeviceId);
          break;

        case 'select-native-capability-page':
          await this._registeredComponents[newPage].init(data.virtualDeviceId);
          break;

        case 'edit-capability-page':
          await this._registeredComponents[newPage].init(data.virtualDeviceId, data.capabilityId);
          break;

        case 'list-physical-devices-page':
          await this._registeredComponents[newPage].init();
          break;

        case 'edit-physical-device-page':
          await this._registeredComponents[newPage].init(data.physicalDeviceId);
          break;

        default:
          wizarderror(new Error('Unknown page:', this.currentPage));
      }
    } catch (e) {
      alert('Action failed with message: ' + e.message);
      wizarderror(e);
    } finally {
      this.currentPage = newPage;
      PetiteVue.nextTick(() => { Homey.hideLoadingOverlay(); });
    }
  }
});