import {sync as mkdirp} from 'mkdirp';
import {join} from 'path';
import level from 'level';
import SubLevel from 'level-sublevel';
import 'babel-polyfill';
import Promise from 'bluebird';
import follow from './follow';
import setupApp from './app';

export default ({port, dir}) => {
  const dirs = {
    tarballs: join(dir, 'tarballs'),
    db: join(dir, 'db')
  };
  mkdirp(dirs.tarballs);
  mkdirp(dirs.db);

  const db = SubLevel(level(join(dir, 'db'), {valueEncoding: 'json'}));
  const packagesDb = {
    get: Promise.promisify(db.sublevel('packages').get),
    put: Promise.promisify(db.sublevel('packages').put)
  };

  follow({dir, db: packagesDb});
  setupApp({db: packagesDb}).listen(port);
};
