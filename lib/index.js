import {sync as mkdirp} from 'mkdirp';
import {join} from 'path';
import level from 'level';
import SubLevel from 'level-sublevel';
import Koa from 'koa';
import {get} from 'koa-route';
import 'babel-polyfill';
import Promise from 'bluebird';
import changes from './changes';

export default ({port, dir}) => {
  const dirs = {
    tarballs: join(dir, 'tarballs'),
    db: join(dir, 'db')
  };
  mkdirp(dirs.tarballs);
  mkdirp(dirs.db);

  const db = SubLevel(level(join(dir, 'db'), {valueEncoding: 'json'}));
  const packagesDb = {
    get: Promise.promisify(db.sublevel('packages').get),
    put: Promise.promisify(db.sublevel('packages').put)
  };
  changes(function * ({doc, seq}) {
    delete doc._id;
    delete doc._rev;
    if (doc.name) {
      console.log(`${seq} ${doc.name}`);
      yield packagesDb.put(doc.name, doc);
    }
  }, {
    db: 'https://skimdb.npmjs.com/registry',
    sequence: join(dir, 'sequence'),
    concurrency: 10
  });

  const app = new Koa();

  app.use(get('/:packageName', function * (packageName) {
    this.set('Content-Type', 'application/json; charset=utf-8');
    try {
      const start = new Date();
      const doc = yield packagesDb.get(packageName);
      this.body = JSON.stringify(doc);
      const ms = new Date() - start;
      console.log('%s %s - %s', this.method, this.url, ms);
    } catch (err) {
      this.body = '{}';
      this.status = 404;
    }
  }));

  app.listen(port);
};
