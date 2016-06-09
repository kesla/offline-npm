import Koa from 'koa';
import conditional from 'koa-conditional-get';
import etag from 'koa-etag';
import logger from 'koa-logger';
import {get} from 'koa-route';

export default ({getPackage, getTarball, port}) => {
  const app = new Koa();

  app.use(logger());
  app.use(conditional());
  app.use(etag());
  app.use(get('/:packageName', function * (packageName) {
    this.set('Content-Type', 'application/json; charset=utf-8');
    try {
      this.body = JSON.stringify(yield getPackage(packageName));
    } catch (err) {
      this.body = '{}';
      this.status = 404;
    }
  }));
  app.use(get('/tarballs/:pkg/:version.tgz', function * (pkg, version) {
    this.body = yield getTarball({pkg, version});
  }));

  const server = app.listen(port, () => {
    console.log(`offline-npm listening on http://localhost:${server.address().port}`);
  });
};
