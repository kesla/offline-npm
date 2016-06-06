import {get} from 'koa-route';

export default ({db, port}) => get('/:packageName', function * (packageName) {
  const ctx = this;
  ctx.set('Content-Type', 'application/json; charset=utf-8');
  try {
    const start = new Date();
    const doc = yield db.get(packageName);

    Object.keys(doc.versions).forEach(version => {
      doc.versions[version].dist.tarball =
        `http://localhost:${port}/tarballs/${packageName}/${version}.tgz`;
    });

    ctx.body = JSON.stringify(doc);
    const ms = new Date() - start;
    console.log('%s %s - %s', ctx.method, ctx.url, ms);
  } catch (err) {
    ctx.body = '{}';
    ctx.status = 404;
  }
});
