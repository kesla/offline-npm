import assert from 'assert';
import {join} from 'path';

import mkdirp from 'mkdirp-then';
import Promise from 'bluebird';

import setupPackageDb from './package-db';
import follow from './follow';
import startApp from './app';
import setupPackages from './packages';
import setupGetTarball from './get-tarball';
import setupDownloadNewPackages from './download-new-packages';
import setupGetNewPackages from './get-new-packages';

export default async ({port, dir, skimUrl, registryUrl}) => {
  assert(typeof port === 'number', 'port is required');
  assert(dir, 'dir is required');
  assert(skimUrl, 'skimUrl is required');
  assert(registryUrl, 'registryUrl is required');

  const db = await setupPackageDb({dir});
  const packages = setupPackages({db, skimUrl, registryUrl});

  const tarballsDir = join(dir, 'tarballs');
  await mkdirp(tarballsDir);
  const getTarball = setupGetTarball({
    dir: tarballsDir, packages
  });
  const getNewPackages = setupGetNewPackages({
    dir: tarballsDir, packages
  });
  const downloadNewPackages = setupDownloadNewPackages({
    getNewPackages, getTarball
  });

  const changesStream = follow({dir, packages, db, skimUrl, downloadNewPackages});
  const app = startApp({packages, getTarball, registryUrl, port});

  const server = await new Promise(
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
};
