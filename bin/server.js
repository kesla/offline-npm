#!/usr/bin/env node

var home = require('home');
var start = require('../dist/index').default;
var port = process.env.PORT || 8044;
var dir = home.resolve(process.env.OFFLINE_NPM_DIR || '~/.offline-npm');
var skimUrl = process.env.SKIM_RUL || 'https://skimdb.npmjs.com/registry';
var registryUrl = process.env.REGISTRY_URL || 'https://registry.npmjs.org';

start({port: port, dir: dir, skimUrl: skimUrl, registryUrl: registryUrl});
