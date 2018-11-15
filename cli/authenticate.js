const ora = require('ora');
const chalk = require('chalk');
const inquirer = require('inquirer');
const { configKeys } = require('./constants');
const { MolekuleApi } = require('../lib/molekule');
const pkg = require('../package.json');

function maybeAuthenticate(email, options, config) {
  let spinner = ora('Authenticating...');
  let authData = config.get(configKeys.auth);
  if (authData && options.force === false) {
    spinner.succeed(chalk`{green.bold Already authenticated}`);
    console.log(
      chalk`{blue.bold Homebridge platform config should be:\n${JSON.stringify(
        {
          platform: pkg.displayName,
          name: pkg.displayName,
          account: authData,
        },
        undefined,
        4
      )}}`
    );
  } else {
    inquirer
      .prompt([
        {
          type: 'password',
          message: 'Enter your Molekule password [masked]',
          name: 'password',
          mask: '*',
        },
      ])
      .then((answers) => {
        spinner.start();
        const molekuleApi = new MolekuleApi();
        molekuleApi
          .authenticate(email, answers.password)
          .then((authData) => {
            config.set(configKeys.auth, authData);
            spinner.succeed(chalk`{green Authenticated}`);
            console.log(
              chalk`{blue.bold Homebridge platform config should be:\n${JSON.stringify(
                {
                  platform: pkg.displayName,
                  name: pkg.displayName,
                  account: authData,
                },
                undefined,
                4
              )}}`
            );
          })
          .catch((err) => {
            spinner.fail(chalk`{red.bold Authentication failed!}`);
            console.error(chalk`\t{red.bold ${err.code}}: {red ${err.error}}`);
          });
      });
  }
}

module.exports = {
  maybeAuthenticate,
};
