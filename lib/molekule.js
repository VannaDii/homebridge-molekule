const uuid = require('uuid').v4;
const { secureGet, securePost } = require('./httpClient');
const { isEmptyOrUndef } = require('./utils');

const molekuleApiHost = 'api-v1.molekule.com';
const molekuleHeaders = {
  'User-Agent': 'Molekule/1.4 CFNetwork/974.2.1 Darwin/18.0.0',
  'Accept-Language': 'en-us',
  Accept: 'application/json',
  'Content-Type': 'application/json',
  'Accept-Eencoding': 'br, gzip, deflate',
};
const molekulePaths = {
  login: '/usermol/write/api/v1/user/login',
  devices: '/read/api/v1/devices/user',
  notification: '/read/api/v1/notification/user',
  deviceDetails: '/read/api/v1/details/device?serialNumber=',
};
const milliseconds = 1000;
const resultTimeout = 1800 * milliseconds;
const timeZoneOffset = new Date().getTimezoneOffset() * 60;

class MolekuleApi {
  constructor(authData) {
    this.needsAuth = true;
    this.token = '';
    this.deviceId = '';
    this.userInfo = {
      encryptedUserId: '',
      firstName: '',
      lastName: '',
      email: '',
      isEmailVerified: true,
      profileImgUrl: '',
    };
    this.lastCallTimes = {
      devices: 0,
      notification: 0,
      deviceDetails: 0,
    };

    this.processAuthData(authData);
  }

  isCallTime(lastCallTime) {
    return Math.abs(Date.now() - lastCallTime) > resultTimeout * milliseconds;
  }

  processAuthData(authData) {
    var safeAuthData = authData || {
      token: undefined,
      deviceId: uuid(),
      userInfo: undefined,
    };
    this.token = safeAuthData.token;
    this.deviceId = safeAuthData.deviceId;
    this.userInfo = safeAuthData.userInfo;

    this.needsAuth =
      isEmptyOrUndef(this.token) || isEmptyOrUndef(this.deviceId) || isEmptyOrUndef(this.userInfo);

    if (!this.needsAuth) {
      this.authenticatedHeaders = {
        ...molekuleHeaders,
        Token: this.token,
      };
    }
  }

  getAuthData() {
    return {
      token: this.token,
      deviceId: this.deviceId,
      userInfo: this.userInfo,
    };
  }

  getIsFilterLow() {
    return this.getUserNotifications().then((notifications) => {
      return (
        Object.keys(notifications).includes('filterRunningLow') &&
        notifications['filterRunningLow'] === true
      );
    });
  }

  getUserNotifications() {
    const self = this;
    return new Promise((resolve, reject) => {
      if (self.needsAuth === true) {
        reject(new Error('Authentication required'));
        return;
      }

      if (self.userNotificationsResponse && !self.isCallTime(self.lastCallTimes.notification)) {
        resolve(self.userNotificationsResponse);
        return;
      }

      secureGet(molekuleApiHost, molekulePaths.notification, self.authenticatedHeaders).then(
        (notificationsResultData) => {
          if (notificationsResultData && notificationsResultData.data) {
            self.userNotificationsResponse = notificationsResultData.data;
            self.lastCallTimes.notification = Date.now();
          } else {
            self.userNotificationsResponse = {};
          }
          resolve(self.userNotificationsResponse);
        }
      );
    });
  }

  getUserDevices() {
    const self = this;
    return new Promise((resolve, reject) => {
      if (self.needsAuth === true) {
        reject(new Error('Authentication required'));
        return;
      }

      if (self.userDevicesResponse && !self.isCallTime(self.lastCallTimes.devices)) {
        resolve(self.userDevicesResponse);
        return;
      }

      secureGet(molekuleApiHost, molekulePaths.devices, self.authenticatedHeaders).then(
        (devicesResultData) => {
          if (devicesResultData && devicesResultData.data && devicesResultData.data.length > 0) {
            self.userDevicesResponse = devicesResultData.data;
            self.lastCallTimes.devices = Date.now();
          } else {
            self.userDevicesResponse = [];
          }
          resolve(self.userDevicesResponse);
        }
      );
    });
  }

  authenticate(username, password) {
    const self = this;
    const authRequestData = {
      password: password,
      deviceId: this.deviceId,
      email: username,
      deviceTypeId: '1',
      deviceToken: '',
      appVersion: '1.5.2',
    };
    return securePost(molekuleApiHost, molekulePaths.login, authRequestData, molekuleHeaders).then(
      (authResultData) => {
        self.authenticatedHeaders = {
          ...molekuleHeaders,
          Token: authResultData.data.token,
        };
        delete authResultData.data.userInfo.encryptedUserId;
        authResultData.data.deviceId = self.deviceId;
        self.processAuthData(authResultData.data);
        return self.getAuthData();
      }
    );
  }
}

module.exports = {
  MolekuleApi,
};
