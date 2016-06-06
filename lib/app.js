import Koa from 'koa';
import conditional from 'koa-conditional-get';
import etag from 'koa-etag';
import info from './info-route';

export default ({db, port}) => {
  const app = new Koa();

  app.use(conditional());
  app.use(etag());
  app.use(info({db, port}));

  app.listen(port);
};
