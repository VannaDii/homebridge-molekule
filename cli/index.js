#!/usr/bin/env node
const chalk = require('chalk').default;
const program = require('commander');
const configstore = require('configstore');
const { maybeAuthenticate } = require('./authenticate');
const { maybeGetDevices } = require('./devices');
const { maybeGetNotifications } = require('./notifications');

// Set up config store
const pkg = require('../package.json');
const config = new configstore(pkg.name);

program.version(pkg.version, '-v, --version');

program
  .command('notifications')
  .description(`get the authenticated user's notifications`)
  .action(() => {
    maybeGetNotifications(config);
  });

program
  .command('devices')
  .description(`get the authenticated user's devices`)
  .action(() => {
    maybeGetDevices(config);
  });

program
  .command('login <email>')
  .description('login to the Molekule service')
  .option('-F --force [force]', 'Force re-authentication', false)
  .action((email, options) => {
    maybeAuthenticate(email, options, config);
  });

program.parse(process.argv);
