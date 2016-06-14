import Koa from 'koa';
import conditional from 'koa-conditional-get';
import etag from 'koa-etag';
import logger from 'koa-logger';
import {get} from 'koa-route';
import assert from 'assert';

export default ({getPackage, getTarball}) => {
  assert(getPackage, 'getPackage is required');
  assert(getTarball, 'getTarball is required');

  const app = new Koa();

  app.use(logger());
  app.use(conditional());
  app.use(etag());
  app.use(get('/:packageName', function * (packageName) {
    this.set('Content-Type', 'application/json; charset=utf-8');
    try {
      this.body = JSON.stringify(yield getPackage(packageName));
    } catch (err) {
      if (err.notFound) {
        this.body = '{}';
        this.status = 404;
        return;
      }
      this.body = err.message;
      this.status = 500;
    }
  }));
  app.use(get('/tarballs/:packageName/:version.tgz', function * (packageName, version) {
    this.body = yield getTarball({packageName, version});
  }));

  return app;
};
