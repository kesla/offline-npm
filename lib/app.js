import Koa from 'koa';
import conditional from 'koa-conditional-get';
import etag from 'koa-etag';
import info from './info-route';
import tarball from './tarball-route';
import logger from 'koa-logger';

export default ({db, port, dir, tarballUrl}) => {
  const app = new Koa();

  app.use(logger());
  app.use(conditional());
  app.use(etag());
  app.use(info({db, port}));
  app.use(tarball({dir, tarballUrl}));

  app.listen(port);
};
