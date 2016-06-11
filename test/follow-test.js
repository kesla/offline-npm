import test from 'tapava';
import setupFollow from '../lib/follow';
import {dirSync} from 'tmp';
import setupPouchdbServer from './utils/pouchdb-server';
import PouchDB from 'pouchdb-http';

test('follow()', function * (t) {
  const {dbUrl, kill} = yield setupPouchdbServer();
  const {name: dir} = dirSync();
  const input = {
    _id: 'bar',
    name: 'bar'
  };
  const putPackage = doc => {
    t.is(doc._id, 'bar');
    t.is(doc.name, 'bar');
    t.is(doc._rev.slice(0, 2), '1-');
    follow.end();
    kill();
    return Promise.resolve(null);
  };
  const db = new PouchDB(dbUrl);

  const follow = setupFollow({
    dir, putPackage, skimUrl: dbUrl
  });

  yield db.put(input);
});
