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
  const getPackagePromies = new Promise(
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

  const packages = {
    get: packageName => {
      t.is(packageName, 'bar');
      resolveGetPackage();
      return Promise.resolve({});
    },
    put: doc => {
      t.is(doc._id, 'bar');
      t.is(doc.name, 'bar');
      t.is(doc._rev.slice(0, 2), '1-');
      resolvePutPackage();
      return Promise.resolve(null);
    }
  };
  const db = new PouchDB(dbUrl);

  const downloadNewPackages = packageName => {
    t.is(packageName, 'bar');
    resolveDownloadNewPackages();
    return Promise.resolve(null);
  };

  const follow = setupFollow({
    dir, packages, skimUrl: dbUrl, downloadNewPackages
  });

  // no name property, should be ignored
  yield db.put({_id: 'foo'});
  yield db.put(input);
  yield getPackagePromies;
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
  const getPackagePromies = new Promise(
    resolve => { resolveGetPackage = resolve; }
  );

  const packages = {
    get: packageName => {
      t.is(packageName, 'bar');
      resolveGetPackage();
      return Promise.reject(new NotFoundError());
    },
    put: () => {
      throw new Error('should not be called');
    }
  };
  const db = new PouchDB(dbUrl);

  const downloadNewPackages = () => {
    throw new Error('should not be called');
  };

  const follow = setupFollow({
    dir, packages, skimUrl: dbUrl, downloadNewPackages
  });

  yield db.put(input);
  yield getPackagePromies;

  follow.end();
  kill();
});
