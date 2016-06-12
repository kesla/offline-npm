import test from 'tapava';
import setupFollow from '../lib/follow';
import {dirSync as tmp} from 'tmp';
import setupPouchdbServer from './utils/pouchdb-server';
import PouchDB from 'pouchdb-http';
import Promise from 'bluebird';

test('follow()', function * (t) {
  const {dbUrl, kill} = yield setupPouchdbServer();
  const {name: dir} = tmp();
  const input = {
    _id: 'bar',
    name: 'bar'
  };

  let resolvePutPackage;
  const putPackagePromise = new Promise(
    resolve => { resolvePutPackage = resolve; }
  );

  let resolveDownloadNewPackages;
  const downloadNewPackagesPromise =  new Promise(
    resolve => { resolveDownloadNewPackages = resolve; }
  );

  const putPackage = doc => {
    t.is(doc._id, 'bar');
    t.is(doc.name, 'bar');
    t.is(doc._rev.slice(0, 2), '1-');
    resolvePutPackage();
    return Promise.resolve(null);
  };
  const db = new PouchDB(dbUrl);

  const downloadNewPackages = packageName => {
    t.is(packageName, 'bar');
    resolveDownloadNewPackages();
    return Promise.resolve(null);
  };

  const follow = setupFollow({
    dir, putPackage, skimUrl: dbUrl, downloadNewPackages
  });

  // no name property, should be ignored
  yield db.put({_id: 'foo'});
  yield db.put(input);
  yield putPackagePromise;
  yield downloadNewPackagesPromise;

  t.notThrows(() => {
    follow.emit('error', new Error('beep boop'));
  });

  follow.end();
  kill();
});
