import Koa from 'koa';
import {get} from 'koa-route';
import conditional from 'koa-conditional-get';
import etag from 'koa-etag';

export default ({db}) => {
  const app = new Koa();

  app.use(conditional());
  app.use(etag());

  app.use(get('/:packageName', function * (packageName) {
    this.set('Content-Type', 'application/json; charset=utf-8');
    try {
      const start = new Date();
      const doc = yield db.get(packageName);
      this.body = JSON.stringify(doc);
      const ms = new Date() - start;
      console.log('%s %s - %s', this.method, this.url, ms);
    } catch (err) {
      this.body = '{}';
      this.status = 404;
    }
  }));

  return app;
};
