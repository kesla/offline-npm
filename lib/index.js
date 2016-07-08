import mkdirp from 'mkdirp-then';
import {join} from 'path';
import follow from './follow';
import startApp from './app';
import setupPackages from './packages';
import setupGetTarball from './get-tarball';
import setupDownloadNewPackages from './download-new-packages';
import setupGetNewPackages from './get-new-packages';
import assert from 'assert';
import setupPackageDb from './package-db';
import {wrap as co} from 'co';
import Promise from 'bluebird';

export default co(function * ({port, dir, skimUrl, registryUrl}) {
  assert(typeof port === 'number', 'port is required');
  assert(dir, 'dir is required');
  assert(skimUrl, 'skimUrl is required');
  assert(registryUrl, 'registryUrl is required');

  const db = yield setupPackageDb({dir});
  const packages = setupPackages({db, port, skimUrl, registryUrl});

  const tarballsDir = join(dir, 'tarballs');
  yield mkdirp(tarballsDir);
  const getTarball = setupGetTarball({
    dir: tarballsDir, registryUrl
  });
  const getNewPackages = setupGetNewPackages({
    dir: tarballsDir, packages
  });
  const downloadNewPackages = setupDownloadNewPackages({
    getNewPackages, getTarball
  });

  const changesStream = follow({dir, packages, db, skimUrl, downloadNewPackages});
  const app = startApp({getPackage: packages.get, getTarball, registryUrl});

  const server = yield new Promise(
    resolve => {
      const server = app.listen(port, () => {
        resolve(server);
      });
    }
  );

  console.log(`offline-npm listening on http://localhost:${server.address().port}`);

  const close = () => {
    changesStream.end();
    server.close();
    db.close();
  };

  return {
    server, close
  };
});
