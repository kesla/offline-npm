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
import setupDownloadNewPackages from './download-new-packages';
import setupGetNewPackages from './get-new-packages';
import msgpack from 'msgpack';

const valueEncoding = {
  encode: msgpack.pack,
  decode: msgpack.unpack,
  buffer: true,
  type: 'msgpack'
};

export default ({port, dir, skimUrl, tarballUrl}) => {
  const dbDir = join(dir, 'db');
  mkdirp(dbDir);
  const db = SubLevel(level(dbDir, {valueEncoding}));
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
  const getNewPackages = setupGetNewPackages({
    dir: tarballsDir, packages
  });
  const downloadNewPackages = setupDownloadNewPackages({
    getNewPackages, getTarball
  });

  follow({dir, putPackage: packages.put, skimUrl, downloadNewPackages});
  const app = startApp({getPackage: packages.get, getTarball});

  const server = app.listen(port, () => {
    console.log(`offline-npm listening on http://localhost:${server.address().port}`);
  });
};
