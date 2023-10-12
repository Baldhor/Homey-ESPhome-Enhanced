const ConsoleRePage = function () {
  return {
    componentName: "console-re-page",
    $template: "#template-console-re-page",

    channel: null,
    enabled: null,

    _initValues: null,
    _modified: null,

    mounted() {
      wizardlog('[' + this.componentName + '] ' + 'mounted');

      pageHandler.registerComponent(this.componentName, this);
    },
    async init() {
      wizardlog('[' + this.componentName + '] ' + 'init');

      this._initValues = {};

      let consoleReSettings = await Homey.emit('get-console-re').catch(e => { throw e; });

      // TODO: Load current config from Homey
      if (consoleReSettings === undefined) {
        this.channel = this._initValues.channel = "";
        this.enabled = this._initValues.enabled = false;
      } else {
        this.channel = this._initValues.channel = consoleReSettings.channel;
        this.enabled = this._initValues.enabled = consoleReSettings.enabled;
      }

      await PetiteVue.nextTick();
      this.checkValidity();
    },
    checkValidity() {
      wizardlog('[' + this.componentName + '] ' + 'checkValidity');

      // Reset error and warning messsages
      errorAndWarningList.reset();

      // Retrieve elements from refs
      const channelElt = this.$refs.channel;

      // Reset custom validity
      channelElt.setCustomValidity('');

      if (!channelElt.validity.valid) {
        errorAndWarningList.addError("wizard2.console-re.error-channel-required");
      } else if (this.enabled && this.channel === "") {
        channelElt.setCustomValidity(false);
        errorAndWarningList.addError("wizard2.console-re.error-channel-required");
      }

      this.checkModified();
    },
    checkModified() {
      wizardlog('[' + this.componentName + '] ' + 'checkModified');

      this._modified = Object.keys(this._initValues).find(key => this._initValues[key] !== this[key]) !== undefined;
    },
    async back() {
      wizardlog('[' + this.componentName + '] ' + 'back');

      this._modified ? (await confirm(Homey.__("wizard2.console-re.loseModification", "warning")) ? pageHandler.setMainPage() : true) : pageHandler.setMainPage();
    },
    async apply() {
      wizardlog('[' + this.componentName + '] ' + 'apply');

      Homey.showLoadingOverlay();

      try {
        await Homey.emit('set-console-re', {
          channel: this.channel,
          enabled: this.enabled
        }).catch(e => { throw e; });

        pageHandler.setMainPage();
      } catch (e) {
        wizardlog(e.stack);

        this.bearerToken = "";

        Homey.hideLoadingOverlay();
        alert(Homey.__("wizard2.console-re.fatal-error", "error"));
      }
    }
  };
};
