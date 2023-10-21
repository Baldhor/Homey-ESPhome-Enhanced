const configuration = PetiteVue.reactive({
  componentName: 'configuration',

  locked: true,

  versions: null,
  virtualDevices: null,
  physicalDevices: null,
  zones: null,

  newPhysicalDevices: [],

  async load() {
    wizardlog('[' + this.componentName + '] ' + 'load');

    let homeyConfiguration = await Homey.emit('get-configuration')
      .catch(e => wizarderror(e));

    this.versions = homeyConfiguration.versions;
    this.virtualDevices = homeyConfiguration.listVirtualDevices;
    this.physicalDevices = homeyConfiguration.listPhysicalDevices;
    this.zones = homeyConfiguration.listZones;

    this._computeNewPhysicalDevices();
    this._computeZonePathDepthAndOrder();

    wizardlog('[' + this.componentName + '] ' + 'Virtual devices:', this.virtualDevices);
    wizardlog('[' + this.componentName + '] ' + 'Physical devices:', this.physicalDevices);
    wizardlog('[' + this.componentName + '] ' + 'Zones:', this.zones);
  },
  async unload() {
    wizardlog('[' + this.componentName + '] ' + 'unload');

    this.initialVirtualDevices = null;
    this.currentVirtualDevices = null;
    this.physicalDevices = null;
    this.zones = null;
  },
  addNewPhysicalDevice(newPhysicalDevice) {
    wizardlog('[' + this.componentName + '] ' + 'addNewPhysicalDevice');

    this.newPhysicalDevices.push(newPhysicalDevice);
    this.physicalDevices.push(newPhysicalDevice);
  },

  // *********************
  // * Internal functions
  // *********************
  _computeNewPhysicalDevices() {
    wizardlog('[' + this.componentName + '] ' + '_computeZonePathDepthAndOrder');

    // If a new physical device is unused, it should be added to the list of physical devices
    // Otherwise (if used), it should be removed from the list of new physical devices
    for (let i = this.newPhysicalDevices.length; i--;) {
      let newPhysicalDevice = this.newPhysicalDevices[i];

      if (!this.physicalDevices.find(physicalDevice => physicalDevice.physicalDeviceId === newPhysicalDevice.physicalDeviceId)) {
        // Add it to the list of physical devices
        wizardlog('[' + this.componentName + '] ' + 'add new physical device: ', newPhysicalDevice);
        this.physicalDevices.push(newPhysicalDevice);
      } else {
        // Remove it from the list of new physical devices
        wizardlog('[' + this.componentName + '] ' + 'remove new physical device: ', newPhysicalDevice);
        this.newPhysicalDevices.splice(i, 1);
      }
    }
  },
  _computeZonePathDepthAndOrder() {
    wizardlog('[' + this.componentName + '] ' + '_computeZonePathDepthAndOrder');

    // This function add two attributs to each zones:
    // - zonePath : [order*] => The list of order (1 to n) sequentialy
    // - zoneDepth : <positive> => The depth of the zone (starting from 0)
    // - zoneOrder : <positive> => the global order of the zone in the whole zone list
    /**
     * A zone has an order position in his parent 'zone'
     * parent zone can be empty => 'house'
     */
    this.zones.forEach(zone => {
      zone.zonePath = [zone.order];
      let parentId = zone.parent;
      while (parentId !== null) {
        let parent = this.zones.find(element => element.zoneId === parentId);
        zone.zonePath.unshift(parent.order);
        parentId = parent.parent;
      }
      zone.zoneDepth = zone.zonePath.length - 1;
    });

    // Sort the zones by zonePath then name
    this.zones.sort((a, b) => {
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
    this.zones.forEach(zone => {
      zone.zoneOrder = zoneOrder++;
    });
  }
});