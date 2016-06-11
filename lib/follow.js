import _changes from 'concurrent-couch-follower';
import {wrap as co} from 'co';
import {join} from 'path';

const concurrency = 10;

const changes = (fn, opts) => {
  return _changes((row, done) => {
    co(fn)(row)
      .then(() => done())
      .catch(done);
  }, opts);
};

export default ({dir, putPackage, skimUrl}) => {
  const stream = changes(function * ({doc, seq}) {
    delete doc._id;
    delete doc._rev;
    if (doc.name) {
      console.log(`${seq} ${doc.name}`);
      yield putPackage(doc);
    }
  }, {
    db: skimUrl, sequence: join(dir, 'sequence'), concurrency
  });

  stream.on('error', err => console.error(err));
};
