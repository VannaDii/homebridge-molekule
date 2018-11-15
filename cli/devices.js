const ora = require('ora');
const chalk = require('chalk');
const { configKeys } = require('./constants');
const { MolekuleApi } = require('../lib/molekule');

function maybeGetDevices(config) {
  let spinner = ora('Getting devices...');
  let authData = config.get(configKeys.auth);
  const molekuleApi = new MolekuleApi(authData);
  spinner.start();
  molekuleApi
    .getUserDevices()
    .then((devices) => {
      spinner.succeed(chalk`{green Got devices!}`);
      devices.forEach((d, i) => {
        console.log(
          chalk`{blue.bold ${i + 1})\t${d.serialNumber}\tFirmware v${d.firmwareVersion
            .split(':')
            .pop()}\t${d.deviceName.replace(/[^ -~]+/g, '')}}`
        );
      });
    })
    .catch((err) => {
      spinner.fail(chalk`{red.bold Failed to get devices!}`);
      console.error(chalk`\t{red.bold ${err.code}}: {red ${err.error}}`);
    });
}

module.exports = {
  maybeGetDevices,
};
