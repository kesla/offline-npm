import {get} from 'koa-route';
import normalize from 'normalize-npm-registry-package';

export default ({db, port}) => get('/:packageName', function * (packageName) {
  const ctx = this;
  ctx.set('Content-Type', 'application/json; charset=utf-8');
  try {
    const doc = normalize(yield db.get(packageName));

    Object.keys(doc.versions).forEach(version => {
      doc.versions[version].dist.tarball =
        `http://localhost:${port}/tarballs/${packageName}/${version}.tgz`;
    });

    ctx.body = JSON.stringify(doc);
  } catch (err) {
    ctx.body = '{}';
    ctx.status = 404;
  }
});
