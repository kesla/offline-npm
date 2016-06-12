import {sync as mkdirp} from 'mkdirp';
import {join} from 'path';
import level from 'level';
import SubLevel from 'level-sublevel';
import 'babel-polyfill';
import Promise from 'bluebird';
import follow from './follow';
import startApp from './app';
import setupPackages from './packages';
import setupGetTarball from './get-tarball';

export default ({port, dir, skimUrl, tarballUrl}) => {
  const dbDir = join(dir, 'db');
  mkdirp(dbDir);
  const db = SubLevel(level(dbDir, {valueEncoding: 'json'}));
  const packages = setupPackages({
    db: {
      get: Promise.promisify(db.sublevel('packages').get),
      put: Promise.promisify(db.sublevel('packages').put)
    },
    port
  });

  const tarballsDir = join(dir, 'tarballs');
  mkdirp(tarballsDir);
  const getTarball = setupGetTarball({
    dir: tarballsDir, tarballUrl
  });

  follow({dir, putPackage: packages.put, skimUrl});
  const app = startApp({getPackage: packages.get, getTarball});

  const server = app.listen(port, () => {
    console.log(`offline-npm listening on http://localhost:${server.address().port}`);
  });
};
