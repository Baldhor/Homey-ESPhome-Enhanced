const MainPage = function () {
  return {
    componentName: "main-page",
    $template: "#template-main-page",

    bearerToken: null,

    _initValues: null,
    _modified: null,

    mounted() {
      wizardlog('[' + this.componentName + '] ' + 'mounted');

      pageHandler.registerComponent(this.componentName, this);
    },
    async init() {
      wizardlog('[' + this.componentName + '] ' + 'init');

      this._initValues = {};

      this.bearerToken = this._initValues.bearerToken = "";

      await configuration.load();

      await PetiteVue.nextTick();
      this.checkValidity();
    },
    checkValidity() {
      wizardlog('[' + this.componentName + '] ' + 'checkValidity');

      // Reset error and warning messsages
      errorAndWarningList.reset();

      // Retrieve elements from refs
      const bearerTokenElt = this.$refs.bearerToken;

      // Reset custom validity
      bearerTokenElt.setCustomValidity('');

      // Name format
      if (!bearerTokenElt.validity.valid) {
        errorAndWarningList.addError("wizard2.main.error-bearer-token");
      }

      this.checkModified();
    },
    checkModified() {
      wizardlog('[' + this.componentName + '] ' + 'checkModified');

      this._modified = Object.keys(this._initValues).find(key => this._initValues[key] !== this[key]) !== undefined;
    },
    async apply() {
      wizardlog('[' + this.componentName + '] ' + 'apply');

      Homey.showLoadingOverlay();

      try {
        await Homey.emit('set-bearer-token', {
          bearerToken: this.bearerToken
        }).catch(e => { throw e; });

        configuration.locked = false;

        Homey.hideLoadingOverlay();
        confirm(Homey.__("wizard2.main.bearer-token-valid", "info"));
      } catch (e) {
        wizardlog(e.stack);

        this.bearerToken = "";

        Homey.hideLoadingOverlay();
        alert(Homey.__("wizard2.main.error-bearer-token-invalid", "error"));
      }
    }
  };
};
