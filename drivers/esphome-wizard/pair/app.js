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
    editVirtualDevice: null,
    editVirtualDeviceModified: false,
    errorMessages: null,
    warningMessages: null,
    newPhysicalDeviceTimeout: null,
    newPhysicalDeviceId: null,

    // components
    errorList, ErrorList,
    warningList, ErrorList,

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
    async applyNewPhysicalDevice() {
      wizardlog('applyNewPhysicalDevice');

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
        this.newPhysicalDeviceTimeout = setTimeout(this.applyNewPhysicalDeviceTimeout, 15000);
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
    applyNewPhysicalDeviceTimeout() {
      wizardlog('applyNewPhysicalDeviceTimeout');
      this.newPhysicalDeviceTimeout = null;
      this.newPhysicalDeviceId = null;

      Homey.hideLoadingOverlay();
      this.alert(Homey.__("wizard2.new-physical-device.timeout", "error"));
    },
    applyNewPhysicalDeviceConnected(newPhysicalDevice) {
      wizardlog('applyNewPhysicalDeviceConnected:', newPhysicalDevice);

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

      this.setPage("list-virtual-devices");
    },
    applyNewPhysicalDeviceFailed(data) {
      wizardlog('applyNewPhysicalDeviceFailed:', data);

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
    checkNewVirtualDeviceValidity() {
      wizardlog('checkNewVirtualDeviceValidity');

      // Disable the done button if any of the fields is invalid
      const name = document.getElementById("NVDname");
      const zone = document.getElementById("NVDzone");
      const device_class = document.getElementById("NVDclass");
      const device_class_description = document.getElementById("NVDclassDescription");

      // Reset error and warning messsages
      let errorMessages = [];
      let warningMessages = [];
      name.setCustomValidity('');
      zone.setCustomValidity('');
      device_class.setCustomValidity('');

      // Name format
      if (!name.validity.valid) {
        errorMessages.push(Homey.__("wizard2.new-virtual-device.error-name"));
      }

      // Name should be unique
      if (name.validity.valid) {
        let tmp = this.configuration.listVirtualDevices.find(e => e.current.zoneId === zone.value && e.current.name === name.value);
        if (tmp !== undefined) {
          warningMessages.push(Homey.__("wizard2.new-virtual-device.warning-name-already-used"));
        }
      }

      // Zone unselected
      if (zone.value === 'unselected') {
        zone.setCustomValidity(false);
        errorMessages.push(Homey.__("wizard2.new-virtual-device.error-zone"));
      }

      // Class unselected
      if (device_class.value === 'unselected') {
        device_class.setCustomValidity(false);
        device_class_description.hidden = true;
        errorMessages.push(Homey.__("wizard2.new-virtual-device.error-class"));
      } else {
        device_class_description.innerHTML = Homey.__('deviceClass.' + device_class.value + '.description');
        device_class_description.hidden = false;
      }

      this.errorMessages = errorMessages;
      this.warningMessages = warningMessages;
    },
    async createVirtualDevice() {
      wizardlog('createVirtualDevice');

      Homey.showLoadingOverlay();

      try {
        let tmp = {
          'virtualDeviceId': 'Wizard' + Date.now(),
          'initial': null,
          'current': {
            name: document.getElementById("NVDname").value,
            zoneId: document.getElementById("NVDzone").value,
            class: document.getElementById("NVDclass").value,
            status: 'new',
            capabilities: []
          }
        }

        this.configuration.listVirtualDevices.push(tmp);
        this.setPage('edit-virtual-device', { virtualDeviceId: tmp.virtualDeviceId });
      } catch (e) {
        wizardlog(e);

        Homey.hideLoadingOverlay();
        this.alert(Homey.__("wizard2.new-virtual-device.fatal-error", "error"));
      }
    },
    checkEditVirtualDeviceValidity() {
      wizardlog('checkEditVirtualDeviceValidity');

      // Disable the done button if any of the fields is invalid
      const name = document.getElementById("EVDname");
      const zone = document.getElementById("EVDzone");
      const device_class = document.getElementById("EVDclass");
      const device_class_description = document.getElementById("EVDclassDescription");

      const capabilities = [];
      document.querySelectorAll("#EVDcapability-title").forEach(element => {
        capabilities.push({
          capabilityId: element.dataset['capabilityId'],
          'titleElement': element
        });
      });
      document.querySelectorAll("#EVDcapability-type").forEach(element => {
        capabilities.find(e => e.capabilityId === element.dataset['capabilityId'])['typeElement'] = element;
      });

      // Reset error and warning messsages
      let errorMessages = [];
      let warningMessages = [];
      name.setCustomValidity('');

      if (this.editVirtualDevice === null)
        return;

      // Check if anything has been modified
      this.editVirtualDeviceModified = name.value !== this.editVirtualDevice.current.name || zone.value !== this.editVirtualDevice.current.zoneId || device_class.value !== this.editVirtualDevice.current.class;

      // Name format
      if (!name.validity.valid) {
        errorMessages.push(Homey.__("wizard2.edit-virtual-device.error-name"));
      }

      // Name should be unique
      if (name.validity.valid) {
        let tmp = this.configuration.listVirtualDevices.find(e => e.virtualDeviceId !== this.editVirtualDevice.virtualDeviceId && e.current.zoneId === zone.value && e.current.name === name.value);
        if (tmp !== undefined) {
          warningMessages.push(Homey.__("wizard2.edit-virtual-device.warning-name-already-used"));
        }
      }

      // Class description
      device_class_description.innerHTML = Homey.__('deviceClass.' + device_class.value + '.description');
      device_class_description.hidden = false;

      this.errorMessages = errorMessages;
      this.warningMessages = warningMessages;
    },
    computeCapabilityOptionsLabel(capability) {
      wizardlog('computeCapabilityOptionsLabel:', capability);

      let filteredOptions = Object.assign({}, capability.options);
      delete filteredOptions['title'];
      return JSON.stringify(filteredOptions, null, 2);
    },

    computeCapabilityPhysicalDeviceLabel(capability) {
      wizardlog('computeCapabilityPhysicalDeviceLabel:', capability);

      let physicalDevice = this.configuration.listPhysicalDevices.find(e => e.physicalDeviceId === capability.physicalDeviceId);
      let nativeCapability = physicalDevice.nativeCapabilities.find(e => e.nativeCapabilityId === capability.nativeCapabilityId);

      return JSON.stringify({
        physicalDevice: physicalDevice.name,
        entityName: nativeCapability.entityName,
        attribut: nativeCapability.attribut
      }, null, 2);
    },
    async backEditVirtualDevice() {
      wizardlog('backEditVirtualDevice');

      this.editVirtualDeviceModified ? (await this.confirm(Homey.__("wizard2.edit-virtual-device.loseModification", "warning")) ? this.setPage('list-virtual-devices') : true) : this.setPage('list-virtual-devices');
    },
    async applyEditVirtualDevice() {
      wizardlog('applyEditVirtualDevice');

      this.editVirtualDevice.current.name = document.getElementById("EVDname").value;
      this.editVirtualDevice.current.zoneId = document.getElementById("EVDzone").value;
      this.editVirtualDevice.current.class = document.getElementById("EVDclass").value;

      // TODO: Should apply to Homey! And refresh configuration

      this.setPage("list-virtual-devices");
    },
    checkEditCapabilityValidity() {
      wizardlog('checkEditCapabilityValidity');

      // Disable the done button if any of the fields is invalid
      const name = document.getElementById("ECname");

      // Reset error and warning messsages
      let errorMessages = [];
      let warningMessages = [];
      name.setCustomValidity('');

      if (this.editCapability === null)
        return;

      // Check if anything has been modified
      this.editCapabilityModified = name.value !== this.editCapability.name;

      // Name format
      if (!name.validity.valid) {
        errorMessages.push(Homey.__("wizard2.edit-capability.error-name"));
      }

      this.errorMessages = errorMessages;
      this.warningMessages = warningMessages;
    },
    async modifyCapability() {
      wizardlog('modifyCapability');

      // TODO: modify capability

      this.editCapability = null;
      this.setPreviousPage();
    },
    modifyVirtualDevice() {
      wizardlog('modifyVirtualDevice');

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
            this.computeZonePathDepthAndOrder();
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

          case 'new-virtual-device':
            wizardlog('zones:', this.configuration.listZones);

            document.getElementById("NVDname").value = '';
            document.getElementById("NVDzone").value = 'unselected';
            document.getElementById("NVDclass").value = 'unselected';

            setTimeout(this.checkNewVirtualDeviceValidity, 100);
            break;

          case 'edit-virtual-device':
            this.editVirtualDevice = null;
            this.editVirtualDevice = this.configuration.listVirtualDevices.find(e => e.virtualDeviceId === data.virtualDeviceId);
            if (this.editVirtualDevice === undefined) {
              throw new Error('Cannot find virtual device:', data.virtualDeviceId, 'for page', page);
            }
            setTimeout(this.checkEditVirtualDeviceValidity, 100);
            break;

          case 'edit-capability':
            this.editCapability = null;
            this.editCapability = this.editVirtualDevice.find(e => e.capabilityId === data.capabilityId);
            if (this.editCapability === undefined) {
              throw new Error('Cannot find capability:', data.capabilityId, 'for page', page);
            }
            setTimeout(this.checkEditCapabilityValidity, 100);
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
    computeZonePathDepthAndOrder() {
      wizardlog('computeZonePathDepthAndOrder');

      // This function add two attributs to each zones:
      // - zonePath : [order*] => The list of order (1 to n) sequentialy
      // - zoneDepth : <positive> => The depth of the zone (starting from 0)
      // - zoneOrder : <positive> => the global order of the zone in the whole zone list
      /**
       * A zone has an order position in his parent 'zone'
       * parent zone can be empty => 'house'
       */
      this.configuration.listZones.forEach(zone => {
        zone.zonePath = [zone.order];
        let parentId = zone.parent;
        while (parentId !== null) {
          let parent = this.configuration.listZones.find(element => element.zoneId === parentId);
          zone.zonePath.unshift(parent.order);
          parentId = parent.parent;
        }
        zone.zoneDepth = zone.zonePath.length - 1;
      });

      // Sort the zones by zonePath then name
      this.configuration.listZones.sort((a, b) => {
        let result = 0;

        for (let i = 0; i < a.zonePath.length; i++) {
          // If b path is shorter, it means it is before
          if (b.zonePath.length < (i + 1)) {
            return 1;
          }

          let result = a.zonePath[i] - b.zonePath[i];
          if (result !== 0) {
            return result;
          }
        }

        // If equal, maybe b length is higher, ortherwise, we use the name
        if (a.zonePath.length === b.zonePath.length) {
          return a.name.localeCompare(b.name);
        } else {
          return -1;
        }
      });

      // Add zoneOrder to make future comparaison faster
      let zoneOrder = 0;
      this.configuration.listZones.forEach(zone => {
        zone.zoneOrder = zoneOrder++;
      });

      wizardlog('computeZonePathDepthAndOrder result:', JSON.parse(JSON.stringify(this.configuration.listZones)));
    },
    compareZoneId(a, b) {
      wizardlog('compareZoneId:', a, b);

      return this.configuration.listZones.find(zone => zone.zoneId === a).zoneOrder - this.configuration.listZones.find(zone => zone.zoneId === a).zoneOrder;
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
      Homey.on('new-device-connected', data => { this.applyNewPhysicalDeviceConnected(data); });
      Homey.on('new-device-failed', data => { this.applyNewPhysicalDeviceFailed(data); });

      // load settings
      this.setMainPage();

      wizardlog('mounted done');
    }
  }).mount('#homekitty');
}
