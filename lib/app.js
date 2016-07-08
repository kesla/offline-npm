import Koa from 'koa';
import conditional from 'koa-conditional-get';
import etag from 'koa-etag';
import logger from 'koa-logger';
import setupRouter from './router';
import assert from 'assert';

export default ({getPackage, getTarball}) => {
  assert(getPackage, 'getPackage is required');
  assert(getTarball, 'getTarball is required');

  const app = new Koa();
  const router = setupRouter({getPackage, getTarball});

  app.use(logger());
  app.use(conditional());
  app.use(etag());
  app.use(router.routes());

  return app;
};
