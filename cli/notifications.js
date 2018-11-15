const ora = require('ora');
const chalk = require('chalk');
const { configKeys } = require('./constants');
const { MolekuleApi } = require('../lib/molekule');
const { toTitleCase } = require('../lib/utils');

function maybeGetNotifications(config) {
  let spinner = ora('Getting notifications...');
  let authData = config.get(configKeys.auth);
  const molekuleApi = new MolekuleApi(authData);
  spinner.start();
  molekuleApi
    .getUserNotifications()
    .then((notifications) => {
      spinner.succeed(chalk`{green Got notifications!}`);
      Object.keys(notifications).forEach((k, i) => {
        console.log(chalk`{blue.bold ${i + 1})\t${toTitleCase(k, true)}\t${notifications[k]}}`);
      });
    })
    .catch((err) => {
      spinner.fail(chalk`{red.bold Failed to get notifications!}`);
      console.error(chalk`\t{red.bold ${err.code}}: {red ${err.error}}`);
    });
}

module.exports = {
  maybeGetNotifications,
};
