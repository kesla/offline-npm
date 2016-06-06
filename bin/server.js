#!/usr/bin/env node

var home = require('home');
var start = require('../dist/index').default;
var port = process.env.PORT || 8044;
var dir = home.resolve(process.env.OFFLINE_NPM_DIR || '~/.offline-npm');

start({port: port, dir: dir});
