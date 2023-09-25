const ListPhysicalDevicesPage = function () {
  return {
    componentName: "list-physical-devices-page",
    $template: "#template-list-physical-devices-page",

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
