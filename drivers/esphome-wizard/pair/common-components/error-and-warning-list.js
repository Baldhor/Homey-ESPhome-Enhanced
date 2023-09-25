const errorAndWarningList = PetiteVue.reactive({
  componentName: 'errorAndWarningList',
  errors: [],
  warnings: [],
  reset() {
    wizardlog('[' + this.componentName + '] ' + 'reset');

    this.errors = [];
    this.warnings = [];
  },
  addError(error) {
    wizardlog('[' + this.componentName + '] ' + 'addError: ', ...arguments);

    this.errors.push(error);
  },
  addWarning(warning) {
    wizardlog('[' + this.componentName + '] ' + 'addWarning: ', ...arguments);

    this.warnings.push(warning);
  }
});

const ErrorAndWarningList = function () {
  return {
    $template: "#template-error-and-warning-list"
  };
};
