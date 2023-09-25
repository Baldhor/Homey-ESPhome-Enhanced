const ListVirtualDevicesPage = function () {
  return {
    componentName: "list-virtual-devices-page",
    $template: "#template-list-virtual-devices-page",

    mounted() {
      wizardlog('[' + this.componentName + '] ' + 'mounted');

      pageHandler.registerComponent(this.componentName, this);
    },
    async init() {
      wizardlog('[' + this.componentName + '] ' + 'init');

      await PetiteVue.nextTick();
      this.checkValidity();
    },
    checkValidity() {
      wizardlog('[' + this.componentName + '] ' + 'checkValidity');

      // do nothing
    }
  };
};
