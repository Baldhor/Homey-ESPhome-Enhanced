const EditCapabilityPage = function () {
  return {
    componentName: "edit-capability-page",
    $template: "#template-edit-capability-page",

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
