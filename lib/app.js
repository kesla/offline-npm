import Koa from 'koa';
import conditional from 'koa-conditional-get';
import etag from 'koa-etag';
import logger from 'koa-logger';
import setupRouter from './router';

export default (opts) => {
  const app = new Koa();
  const router = setupRouter(opts);

  app.use(logger());
  app.use(conditional());
  app.use(etag());
  app.use(router.routes());

  return app;
};
