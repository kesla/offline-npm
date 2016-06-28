import _changes from 'concurrent-couch-follower';
import {wrap as co} from 'co';
import {join} from 'path';
import nodeify from 'nodeify';
import assert from 'assert';

const concurrency = 10;

const changes = (fn, opts) => {
  return _changes((row, done) => {
    nodeify(co(fn)(row), done);
  }, opts);
};

export default ({dir, packages, db, skimUrl, downloadNewPackages}) => {
  assert(dir, 'dir is required');
  assert(db, 'db is required');
  assert(packages, 'packages is required');
  assert(skimUrl, 'skimUrl is required');
  assert(downloadNewPackages, 'downloadNewPackages is required');

  const stream = changes(function * ({doc, seq}) {
    if (doc.name) {
      console.log(`${seq} ${doc.name}`);
      try {
        yield db.get(doc.name);
      } catch (err) {
        if (err.notFound) {
          return;
        }
        throw err;
      }
      console.log(`syncing ${doc.name}`);
      yield packages.put(doc);
      yield downloadNewPackages(doc.name);
    }
  }, {
    db: skimUrl, sequence: join(dir, 'sequence'), concurrency
  });

  stream.on('error', err => {
    console.error(err);
    console.error(err.stack);
  });

  return stream;
};
