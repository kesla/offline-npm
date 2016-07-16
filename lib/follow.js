import {join} from 'path';
import assert from 'assert';

import _changes from 'concurrent-couch-follower';
import nodeify from 'nodeify';

const changes = (fn, opts) => {
  return _changes((row, done) => {
    nodeify(fn(row), done);
  }, opts);
};

export default ({dir, packages, db, skimUrl, downloadNewPackages}) => {
  assert(dir, 'dir is required');
  assert(db, 'db is required');
  assert(packages, 'packages is required');
  assert(skimUrl, 'skimUrl is required');
  assert(downloadNewPackages, 'downloadNewPackages is required');

  const opts = {
    db: skimUrl,
    sequence: join(dir, 'sequence'),
    concurrency: 10,
    now: true
  };

  const stream = changes(async ({doc, seq}) => {
    if (doc.name) {
      console.log(`${seq} ${doc.name}`);
      try {
        await db.get(doc.name);
      } catch (err) {
        if (err.notFound) {
          return;
        }
        throw err;
      }
      console.log(`syncing ${doc.name}`);
      await packages.put(doc);
      await downloadNewPackages(doc.name);
    }
  }, opts);

  stream.on('error', err => {
    console.error(err);
    console.error(err.stack);
  });

  return stream;
};
