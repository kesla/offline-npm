import test from 'tapava';
import {dirSync as tmp} from 'tmp';
import PouchDB from 'pouchdb-http';
import Promise from 'bluebird';
import {NotFoundError} from 'level-errors';

import setupFollow from '../lib/follow';
import setupPouchdbServer from './utils/pouchdb-server';

test('follow() when package is in db', async t => {
  const {dbUrl, kill} = await setupPouchdbServer();
  const {name: dir} = tmp();
  const input = {
    _id: 'bar',
    name: 'bar'
  };

  let resolveGetPackage;
  const getDbPromies = new Promise(resolve => {
    resolveGetPackage = resolve;
  });

  let resolvePutPackage;
  const putPackagePromise = new Promise(resolve => {
    resolvePutPackage = resolve;
  });

  let resolveDownloadNewPackages;
  const downloadNewPackagesPromise = new Promise(resolve => {
    resolveDownloadNewPackages = resolve;
  });

  const db = {
    get: packageName => {
      t.is(packageName, 'bar');
      resolveGetPackage();
      return Promise.resolve({});
    }
  };
  const packages = {
    put: doc => {
      t.is(doc._id, 'bar');
      t.is(doc.name, 'bar');
      t.is(doc._rev.slice(0, 2), '1-');
      resolvePutPackage();
      return Promise.resolve(null);
    }
  };
  const pouchDb = new PouchDB(dbUrl);

  const downloadNewPackages = packageName => {
    t.is(packageName, 'bar');
    resolveDownloadNewPackages();
    return Promise.resolve(null);
  };

  const follow = setupFollow({
    dir, db, packages, skimUrl: dbUrl, downloadNewPackages
  });

  // no name property, should be ignored
  await pouchDb.put({_id: 'foo'});
  await pouchDb.put(input);
  await getDbPromies;
  await putPackagePromise;
  await downloadNewPackagesPromise;

  t.notThrows(() => {
    follow.emit('error', new Error('beep boop'));
  });

  follow.end();
  kill();
});

test('follow() when package is not in db', async t => {
  const {dbUrl, kill} = await setupPouchdbServer();
  const {name: dir} = tmp();
  const input = {
    _id: 'bar',
    name: 'bar'
  };

  let resolveGetPackage;
  const getDbPromies = new Promise(resolve => {
    resolveGetPackage = resolve;
  });

  const db = {
    get: packageName => {
      t.is(packageName, 'bar');
      resolveGetPackage();
      return Promise.reject(new NotFoundError());
    }
  };
  const packages = {};
  const pouchDb = new PouchDB(dbUrl);

  const downloadNewPackages = () => {
    throw new Error('should not be called');
  };

  const follow = setupFollow({
    dir, db, packages, skimUrl: dbUrl, downloadNewPackages
  });

  await pouchDb.put(input);
  await getDbPromies;

  follow.end();
  kill();
});
