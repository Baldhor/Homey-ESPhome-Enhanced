function onHomeyReady(Homey) {
  wizardlog('Wizard ready');

  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

  // eslint-disable-next-line
  PetiteVue.createApp({
    // data
    currentPage: 'main',
    previousPage: 'main',
    configuration: null,
    editPhysicalDevice: null,
    editPhysicalDeviceModified: false,
    errorMessages: null,
    warningMessages: null,
    newPhysicalDeviceTimeout: null,
    newPhysicalDeviceId: null,
    // methods
    alert(msg, icon = null) {
      return new Promise(resolve => {
        Homey.alert(msg, icon, resolve);
      });
    },
    confirm(msg, icon = null) {
      return new Promise(resolve => {
        Homey.confirm(msg, icon, (_, response) => resolve(response));
      });
    },
    checkNewPhysicalDeviceValidity() {
      wizardlog('checkNewPhysicalDeviceValidity');

      // Disable the done button if any of the fields is invalid
      const name = document.getElementById("NPDname");
      const ipAddress = document.getElementById("NPDipAddress");
      const port = document.getElementById("NPDport");
      const encryptionKey = document.getElementById("NPDencryptionKey");
      const password = document.getElementById("NPDpassword");

      // Reset error and warning messsages
      let errorMessages = [];
      let warningMessages = [];
      name.setCustomValidity('');
      ipAddress.setCustomValidity('');
      port.setCustomValidity('');
      encryptionKey.setCustomValidity('');
      password.setCustomValidity('');

      // Name format
      if (!name.validity.valid) {
        errorMessages.push(Homey.__("wizard2.new-physical-device.error-name"));
      }

      // Name must be unique
      if (name.validity.valid) {
        let tmp = this.configuration.listPhysicalDevices.find(e => e.name === name.value);
        if (tmp !== undefined) {
          name.setCustomValidity(false);
          errorMessages.push(Homey.__("wizard2.new-physical-device.error-name-already-used"));
        }
      }

      // IP Address format
      if (!ipAddress.validity.valid) {
        errorMessages.push(Homey.__("wizard2.new-physical-device.error-ip-address"));
      }

      // Port format
      if (!port.validity.valid) {
        errorMessages.push(Homey.__("wizard2.new-physical-device.error-port"));
      }

      // IP Address and port must be unique
      if (ipAddress.validity.valid && port.validity.valid) {
        let tmp = this.configuration.listPhysicalDevices.find(e => e.ipAddress === ipAddress.value && e.port === port.value);
        if (tmp !== undefined) {
          ipAddress.setCustomValidity(false);
          port.setCustomValidity(false);
          errorMessages.push(Homey.__("wizard2.new-physical-device.error-ipAddress-and-port-already-used"));
        }
      }

      // Encryption key format
      if (encryptionKey.validity.patternMismatch) {
        errorMessages.push(Homey.__("wizard2.new-physical-device.error-encryption-key"));
      } else if (encryptionKey.value !== '' && atob(encryptionKey.value).length !== 32) {
        encryptionKey.setCustomValidity(false);
        errorMessages.push(Homey.__("wizard2.new-physical-device.error-encryption-key"));
      }

      // encryptionKey and password are exclusive
      if (encryptionKey.value !== '' && password.value !== '') {
        encryptionKey.setCustomValidity(false);
        password.setCustomValidity(false);
        errorMessages.push(Homey.__("wizard2.new-physical-device.error-encryption-key-and-password-are-exclusive"));
      }

      // Encryption key recommended (need to check last)
      if (encryptionKey.validity.valid && encryptionKey.value === '') {
        warningMessages.push(Homey.__("wizard2.new-physical-device.warning-encryption-key-recommended"));
      }

      this.errorMessages = errorMessages;
      this.warningMessages = warningMessages;
    },
    async createPhysicalDevice() {
      wizardlog('createPhysicalDevice');

      Homey.showLoadingOverlay();

      try {
        this.newPhysicalDeviceId = 'Wizard' + Date.now();

        await Homey.emit('connect-new-device', {
          physicalDeviceId: this.newPhysicalDeviceId,
          name: document.getElementById("NPDname").value,
          ipAddress: document.getElementById("NPDipAddress").value,
          port: document.getElementById("NPDport").value,
          encryptionKey: document.getElementById("NPDencryptionKey").value,
          password: document.getElementById("NPDpassword").value
        }).catch(e => { throw e; });

        // We wait 15 seconds maximum
        this.newPhysicalDeviceTimeout = setTimeout(this.timeoutNewPhysicalDevice, 15000);
      } catch (e) {
        this.newPhysicalDeviceId = null;
        if (this.newPhysicalDeviceTimeout !== null) {
          clearTimeout(this.newPhysicalDeviceTimeout);
          this.newPhysicalDeviceTimeout = null;
        }
        wizardlog(e);

        Homey.hideLoadingOverlay();
        this.alert(Homey.__("wizard2.new-physical-device.fatal-error", "error"));
      }
    },
    timeoutNewPhysicalDevice() {
      wizardlog('timeoutNewPhysicalDevice');
      this.newPhysicalDeviceTimeout = null;
      this.newPhysicalDeviceId = null;

      Homey.hideLoadingOverlay();
      this.alert(Homey.__("wizard2.new-physical-device.timeout", "error"));
    },
    newPhysicalDeviceConnected(newPhysicalDevice) {
      wizardlog('newPhysicalDeviceConnected:', newPhysicalDevice);

      if (newPhysicalDevice.physicalDeviceId !== this.newPhysicalDeviceId) {
        wizardlog('Unexpected new physical device, ignoring');
        return;
      }

      // Cancel the timeout
      if (this.newPhysicalDeviceTimeout !== null) {
        clearTimeout(this.newPhysicalDeviceTimeout);
        this.newPhysicalDeviceTimeout = null;
      }

      this.configuration.listPhysicalDevices.push(newPhysicalDevice);
      this.newPhysicalDeviceId = null;

      this.setPreviousPage();
    },
    newPhysicalDeviceFailed(data) {
      wizardlog('newPhysicalDeviceFailed:', data);

      if (data.physicalDeviceId !== this.newPhysicalDeviceId) {
        wizardlog('Unexpected new physical device failure, ignoring');
        return;
      }

      // Cancel the timeout
      if (this.newPhysicalDeviceTimeout !== null) {
        clearTimeout(this.newPhysicalDeviceTimeout);
        this.newPhysicalDeviceTimeout = null;
      }

      this.newPhysicalDeviceId = null;

      Homey.hideLoadingOverlay();
      this.alert(Homey.__("wizard2.new-physical-device.failed") + ": " + data.message, "error");
    },
    checkEditPhysicalDeviceValidity() {
      wizardlog('checkEditPhysicalDeviceValidity');

      // Disable the done button if any of the fields is invalid
      const name = document.getElementById("EPDname");
      const ipAddress = document.getElementById("EPDipAddress");
      const port = document.getElementById("EPDport");
      const encryptionKey = document.getElementById("EPDencryptionKey");
      const password = document.getElementById("EPDpassword");

      // Reset error and warning messsages
      let errorMessages = [];
      let warningMessages = [];
      name.setCustomValidity('');
      ipAddress.setCustomValidity('');
      port.setCustomValidity('');
      encryptionKey.setCustomValidity('');
      password.setCustomValidity('');

      if (this.editPhysicalDevice === null)
        return;

      // Check if anything has been modified
      this.editPhysicalDeviceModified = name.value !== this.editPhysicalDevice.name || ipAddress.value !== this.editPhysicalDevice.ipAddress || port.value !== this.editPhysicalDevice.port || encryptionKey.value !== this.editPhysicalDevice.encryptionKey || password.value !== this.editPhysicalDevice.password;

      // Name format
      if (!name.validity.valid) {
        errorMessages.push(Homey.__("wizard2.edit-physical-device.error-name"));
      }

      // Name must be unique
      if (name.validity.valid) {
        let tmp = this.configuration.listPhysicalDevices.find(e => e.physicalDeviceId !== this.editPhysicalDevice.physicalDeviceId && e.name === name.value);
        if (tmp !== undefined) {
          name.setCustomValidity(false);
          errorMessages.push(Homey.__("wizard2.edit-physical-device.error-name-already-used"));
        }
      }

      // IP Address format
      if (!ipAddress.validity.valid) {
        errorMessages.push(Homey.__("wizard2.edit-physical-device.error-ip-address"));
      }

      // Port format
      if (!port.validity.valid) {
        errorMessages.push(Homey.__("wizard2.edit-physical-device.error-port"));
      }

      // IP Address and port must be unique
      if (ipAddress.validity.valid && port.validity.valid) {
        let tmp = this.configuration.listPhysicalDevices.find(e => e.physicalDeviceId !== this.editPhysicalDevice.physicalDeviceId && e.ipAddress === ipAddress.value && e.port === port.value);
        if (tmp !== undefined) {
          ipAddress.setCustomValidity(false);
          port.setCustomValidity(false);
          errorMessages.push(Homey.__("wizard2.edit-physical-device.error-ipAddress-and-port-already-used"));
        }
      }

      // Encryption key format
      if (encryptionKey.validity.patternMismatch) {
        errorMessages.push(Homey.__("wizard2.edit-physical-device.error-encryption-key"));
      } else if (encryptionKey.value !== '' && atob(encryptionKey.value).length !== 32) {
        encryptionKey.setCustomValidity(false);
        errorMessages.push(Homey.__("wizard2.edit-physical-device.error-encryption-key"));
      }

      // encryptionKey and password are exclusive
      if (encryptionKey.value !== '' && password.value !== '') {
        encryptionKey.setCustomValidity(false);
        password.setCustomValidity(false);
        errorMessages.push(Homey.__("wizard2.edit-physical-device.error-encryption-key-and-password-are-exclusive"));
      }

      // Encryption key recommended (need to check last)
      if (encryptionKey.validity.valid && encryptionKey.value === '') {
        warningMessages.push(Homey.__("wizard2.edit-physical-device.warning-encryption-key-recommended"));
      }

      this.errorMessages = errorMessages;
      this.warningMessages = warningMessages;
    },
    async backEditPhysicalDevice() {
      wizardlog('backEditPhysicalDevice');

      this.editPhysicalDeviceModified ? (await this.confirm(Homey.__("wizard2.edit-physical-device.loseModification", "warning")) ? this.setPreviousPage() : true) : this.setPreviousPage();
    },
    async modifyPhysicalDevice() {
      wizardlog('modifyPhysicalDevice');

      Homey.showLoadingOverlay();

      try {
        await Homey.emit('modify-physical-device', {
          physicalDeviceId: this.editPhysicalDevice.physicalDeviceId,
          name: document.getElementById("EPDname").value,
          ipAddress: document.getElementById("EPDipAddress").value,
          port: document.getElementById("EPDport").value,
          encryptionKey: document.getElementById("EPDencryptionKey").value,
          password: document.getElementById("EPDpassword").value
        }).catch(e => { throw e; });

        setTimeout(this.setMainPage, 5000);
      } catch (e) {
        wizarderror(e);

        Homey.hideLoadingOverlay();
        this.alert(Homey.__("wizard2.edit-physical-device.failed", "error"));
      }
    },
    setMainPage() {
      wizardlog('setMainPage');

      Homey.showLoadingOverlay();
      this.initPage('main');
    },
    setPage(page, data) {
      wizardlog('setPage:', page, 'with data:', data);

      Homey.showLoadingOverlay();
      this.initPage(page, data);
    },
    setPreviousPage() {
      wizardlog('setPreviousPage');

      Homey.showLoadingOverlay();
      this.initPage(this.previousPage);
    },
    async initPage(page, data) {
      wizardlog('initPage:', page, 'with data:', data);

      try {
        this.previousPage = this.currentPage;
        this.currentPage = page;

        // Load new page
        switch (page) {
          case 'main':
            await this.loadConfiguration();
            break;

          case 'list-virtual-devices':
            break;

          case 'new-physical-device':
            document.getElementById("NPDname").value = '';
            document.getElementById("NPDipAddress").value = '';
            document.getElementById("NPDport").value = '6053';
            document.getElementById("NPDencryptionKey").value = '';
            document.getElementById("NPDpassword").value = '';
      
            setTimeout(this.checkNewPhysicalDeviceValidity, 100);
            break;

          case 'list-physical-devices':
            break;

          case 'edit-physical-device':
            this.editPhysicalDevice = null;
            this.editPhysicalDevice = this.configuration.listPhysicalDevices.find(e => e.physicalDeviceId === data.physicalDeviceId);
            if (this.editPhysicalDevice === undefined) {
              throw new Error('Cannot find physical device:', data.physicalDeviceId, 'for page', page);
            }
            setTimeout(this.checkEditPhysicalDeviceValidity, 100);
            break;

        }
      } catch (e) {
        this.alert('Action failed with message: ' + e.message);
        wizarderror(e);
      } finally {
        Homey.hideLoadingOverlay();
      }
    },
    async getPhysicalDevices() {
      await delay(2000);
    },
    async getVirtualDevices() {
      await delay(2000);
    },
    isActive(page) {
      if (this.currentPage == page) {
        return 'is-active';
      } else {
        return;
      }
    },
    async loadConfiguration() {
      wizardlog('loadConfiguration');
      this.configuration = {};
      this.configuration = await Homey.emit('get-configuration')
        .catch(e => wizarderror(e));
      wizardlog('Configuration loaded:', this.configuration);
    },
    // called from @vue:mounted event handler on #app
    async mounted() {
      wizardlog('mounted');

      // Setup Homey listeners
      Homey.on('new-device-connected', data => { this.newPhysicalDeviceConnected(data); });
      Homey.on('new-device-failed', data => { this.newPhysicalDeviceFailed(data); });

      // load settings
      this.setMainPage();

      wizardlog('mounted done');
    }
  }).mount('#homekitty');
}
