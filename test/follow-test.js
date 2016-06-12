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

  let putPackageResolve;
  const putPackagePromise = new Promise(resolve => {
    putPackageResolve = resolve;
  });

  const putPackage = doc => {
    t.is(doc._id, 'bar');
    t.is(doc.name, 'bar');
    t.is(doc._rev.slice(0, 2), '1-');
    putPackageResolve();
    return Promise.resolve(null);
  };
  const db = new PouchDB(dbUrl);

  const follow = setupFollow({
    dir, putPackage, skimUrl: dbUrl
  });

  // no name property, should be ignored
  yield db.put({_id: 'foo'});
  yield db.put(input);
  yield putPackagePromise;

  t.notThrows(() => {
    follow.emit('error', new Error('beep boop'));
  });

  follow.end();
  kill();
});
