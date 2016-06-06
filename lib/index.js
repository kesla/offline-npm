import {sync as mkdirp} from 'mkdirp';
import {join} from 'path';
import level from 'level';
import SubLevel from 'level-sublevel';
import 'babel-polyfill';
import Promise from 'bluebird';
import follow from './follow';
import startApp from './app';

export default ({port, dir}) => {
  const dbDir = join(dir, 'db');

  mkdirp(dbDir);

  const db = SubLevel(level(dbDir, {valueEncoding: 'json'}));
  const packagesDb = {
    get: Promise.promisify(db.sublevel('packages').get),
    put: Promise.promisify(db.sublevel('packages').put)
  };

  follow({dir, db: packagesDb});
  startApp({db: packagesDb, port, dir});
};
