import test from 'tapava';
import setupFollow from '../lib/follow';
import {dirSync as tmp} from 'tmp';
import setupPouchdbServer from './utils/pouchdb-server';
import PouchDB from 'pouchdb-http';
import Promise from 'bluebird';
import {NotFoundError} from 'level-errors';

test('follow() when package is in db', function * (t) {
  const {dbUrl, kill} = yield setupPouchdbServer();
  const {name: dir} = tmp();
  const input = {
    _id: 'bar',
    name: 'bar'
  };

  let resolveGetPackage;
  const getDbPromies = new Promise(
    resolve => { resolveGetPackage = resolve; }
  );

  let resolvePutPackage;
  const putPackagePromise = new Promise(
    resolve => { resolvePutPackage = resolve; }
  );

  let resolveDownloadNewPackages;
  const downloadNewPackagesPromise = new Promise(
    resolve => { resolveDownloadNewPackages = resolve; }
  );

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
  yield pouchDb.put({_id: 'foo'});
  yield pouchDb.put(input);
  yield getDbPromies;
  yield putPackagePromise;
  yield downloadNewPackagesPromise;

  t.notThrows(() => {
    follow.emit('error', new Error('beep boop'));
  });

  follow.end();
  kill();
});

test('follow() when package is not in db', function * (t) {
  const {dbUrl, kill} = yield setupPouchdbServer();
  const {name: dir} = tmp();
  const input = {
    _id: 'bar',
    name: 'bar'
  };

  let resolveGetPackage;
  const getDbPromies = new Promise(
    resolve => { resolveGetPackage = resolve; }
  );

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

  yield pouchDb.put(input);
  yield getDbPromies;

  follow.end();
  kill();
});
