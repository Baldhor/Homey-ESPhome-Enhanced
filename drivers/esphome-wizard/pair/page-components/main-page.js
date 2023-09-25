const MainPage = function () {
  return {
    componentName: "main-page",
    $template: "#template-main-page",

    mounted() {
      wizardlog('[' + this.componentName + '] ' + 'mounted');

      pageHandler.registerComponent(this.componentName, this);
    },
    async init() {
      wizardlog('[' + this.componentName + '] ' + 'init');

      await configuration.load();
      await PetiteVue.nextTick();
      this.checkValidity();
    },
    checkValidity() {
      wizardlog('[' + this.componentName + '] ' + 'checkValidity');

      // do nothing
    }
  };
};
