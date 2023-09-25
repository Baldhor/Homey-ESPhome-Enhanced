const SelectNativeCapabilityPage = function () {
  return {
    componentName: "select-native-capability-page",
    $template: "#template-select-native-capability-page",

    mounted() {
      wizardlog('[' + this.componentName + '] ' + 'mounted');

      pageHandler.registerComponent(this.componentName, this);
    },
    async init() {
      wizardlog('[' + this.componentName + '] ' + 'init');

      this.checkValidity();
    },
    checkValidity() {
      wizardlog('[' + this.componentName + '] ' + 'checkValidity');

      // do nothing
    }
  };
};
