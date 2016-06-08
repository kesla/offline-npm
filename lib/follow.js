import _changes from 'concurrent-couch-follower';
import {wrap as co} from 'co';
import {join} from 'path';

const changes = (fn, opts) => {
  const stream = _changes((row, done) => {
    co(fn)(row)
      .then(() => done())
      .catch(done);
  }, opts);

  stream.on('error', err => console.error(err));
};

export default ({dir, db}) => {
  changes(function * ({doc, seq}) {
    delete doc._id;
    delete doc._rev;
    if (doc.name) {
      console.log(`${seq} ${doc.name}`);
      yield db.put(doc.name, doc);
    }
  }, {
    db: 'https://skimdb.npmjs.com/registry',
    sequence: join(dir, 'sequence'),
    concurrency: 10
  });
};
