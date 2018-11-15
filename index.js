const color = require('bash-color');
const { toTitleCase } = require('./lib/utils');
const { MolekuleApi } = require('./lib/molekule');

let PlatformAccessory, Characteristic, Service, UUIDGen, platform;
const pkg = require('./package.json');
const PackageName = pkg.name;
const PluginName = pkg.displayName;
const CliCommand = Object.keys(pkg.bin).shift();

function getLogHeader() {
  const now = new Date(Date.now());
  return `[${now.toLocaleDateString()}, ${now.toLocaleTimeString()}] ${color.purple(
    `[${PluginName}]`
  )}`;
}

class MolekulePlatform {
  constructor(log, config, api) {
    platform = this;
    platform.log = {
      debug: (message, ...args) =>
        console.debug(`${getLogHeader()} ${color.white(message)}`, ...args),
      info: (message, ...args) => console.info(`${getLogHeader()} ${color.blue(message)}`, ...args),
      warn: (message, ...args) =>
        console.warn(`${getLogHeader()} ${color.yellow(message)}`, ...args),
      error: (message, ...args) =>
        console.error(`${getLogHeader()} ${color.red(message)}`, ...args),
      log: (message, ...args) => console.log(`${getLogHeader()} ${message}`, ...args),
    };
    platform.api = api;
    platform.config = config || {};
    platform.accessories = new Map();
    platform.serviceType = Service.OccupancySensor;

    platform.molekuleSyncInterval = (platform.config.syncSeconds || 120) * 1000;
    platform.molekuleApi = new MolekuleApi(platform.config.account);
    platform.molekuleData = {
      isAwake: false,
    };
    platform.api.on('didFinishLaunching', () => {
      const now = new Date(Date.now());
      if (
        !platform.config.account ||
        !platform.config.account.token ||
        !platform.config.account.deviceId
      ) {
        platform.log.error(
          `Incomplete configuration. Run: "${CliCommand} login <email>" for account configuration.`
        );
        return;
      } else {
        platform.setup();
        platform.updateFilterStatus();
      }
    });
  }

  updateFilterStatus() {
    try {
      platform.molekuleApi
        .getIsFilterLow()
        .then((isFilterLow) => {
          platform.molekuleData.isFilterLow = isFilterLow;
          platform.updateSensors(Characteristic.OccupancyDetected, 'filterLow', isFilterLow);
        })
        .catch((err) => {
          platform.log.error(
            'Failed to update isFilterLow status: %s',
            (err.data || {}).error || err
          );
        });
    } catch (err) {
      platform.log.error(err);
    }
  }

  updateSensors(characteristic, type, value) {
    try {
      platform.accessories.forEach((a) => {
        if (a.context.type === type) {
          a.getService(platform.serviceType).setCharacteristic(characteristic, value);
        }
      });
    } catch (err) {
      platform.log.error(err);
    }
  }

  setup() {
    try {
      if (platform.molekuleApi.needsAuth === false) {
        setInterval(platform.updateFilterStatus, platform.molekuleSyncInterval);
        try {
          platform.addAccessory('filterLow');
        } catch (err) {
          platform.log.error(err);
        }
      } else {
        platform.log.error(
          `The Molekule API needs authentication. Run "${CliCommand} login <email>"`
        );
      }
    } catch (err) {
      platform.log.error(err);
    }
  }

  createSensorAccessory(account, type, uuid) {
    try {
      const accessory = new PlatformAccessory(type, uuid);
      accessory.context.type = type;
      platform.setupSensor(accessory, type);

      accessory
        .getService(Service.AccessoryInformation)
        .setCharacteristic(Characteristic.Manufacturer, 'Molekule Homebridge Sensors')
        .setCharacteristic(Characteristic.Model, `Molekule ${type} sensor`)
        .setCharacteristic(Characteristic.SerialNumber, account.deviceId);

      return accessory;
    } catch (err) {
      platform.log.error(err);
    }
  }

  setupSensor(accessory, type) {
    try {
      accessory.displayName = toTitleCase(type, true);

      let service = accessory.getService(platform.serviceType);
      if (service) {
        service.setCharacteristic(Characteristic.Name, accessory.displayName);
      } else {
        service = accessory.addService(platform.serviceType, accessory.displayName);
      }

      service.getCharacteristic(Characteristic.OccupancyDetected).on('get', (callback) => {
        callback(null, platform.molekuleData.isFilterLow);
      });
    } catch (err) {
      platform.log.error(err);
    }
  }

  // Called from device classes
  registerPlatformAccessory(accessory) {
    try {
      platform.api.registerPlatformAccessories(PackageName, PluginName, [accessory]);
    } catch (err) {
      platform.log.error(err);
    }
  }

  // Function invoked when homebridge tries to restore cached accessory
  configureAccessory(accessory) {
    try {
      if (!platform.accessories.has(accessory.UUID)) {
        accessory.context.type = accessory.context.type || 'filterLow';
        platform.setupSensor(accessory, accessory.context.type);
        platform.accessories.set(accessory.UUID, accessory);
      }
    } catch (err) {
      platform.log.error(err);
    }
  }

  addAccessory(accessoryName) {
    try {
      const uuid = UUIDGen.generate(
        `Molekule_${platform.config.account.deviceId}_${accessoryName}`
      );
      if (!platform.accessories.has(uuid)) {
        const accessory = platform.createSensorAccessory(
          platform.config.account,
          accessoryName,
          uuid
        );
        platform.registerPlatformAccessory(accessory);
        platform.accessories.set(accessory.UUID, accessory);
      }
    } catch (err) {
      platform.log.error(err);
    }
  }

  removeAccessory(accessory) {
    try {
      if (!accessory) {
        return;
      }
      platform.accessories.delete(accessory.UUID);
      platform.api.unregisterPlatformAccessories(PackageName, PluginName, [accessory]);
    } catch (err) {
      platform.log.error(err);
    }
  }
}

module.exports = function(homebridge) {
  PlatformAccessory = homebridge.platformAccessory;
  Characteristic = homebridge.hap.Characteristic;
  Service = homebridge.hap.Service;
  UUIDGen = homebridge.hap.uuid;

  homebridge.registerPlatform(PackageName, PluginName, MolekulePlatform, true);
};
