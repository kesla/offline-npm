import assert from 'assert';

import KoaRouter from 'koa-router';
import normalize from 'normalize-registry-metadata';
import {map, set, setIn, without} from 'immutable-object-methods';

import {stream as streamGot} from './got';
import getVersionFromRangeOrTag from './get-version-from-range-or-tag';

export default ({port, packages, getTarball, registryUrl}) => {
  assert(packages, 'packages is required');
  assert(getTarball, 'getTarball is required');
  assert(registryUrl, 'registryUrl is required');
  assert(port, 'port is required');

  const router = new KoaRouter();

  const fix = pkg => {
    normalize(pkg);
    const packageName = pkg.name;

    const updated = map(pkg.versions, (value, version) =>
      setIn(value, ['dist', 'tarball'], `http://localhost:${port}/tarballs/${packageName}/${version}.tgz`)
    );

    return set(pkg, 'versions', updated);
  };

  const proxy = ctx => {
    const url = `${registryUrl}${ctx.url}`;

    ctx.body = streamGot(url, {
      body: ctx.req,
      headers: without(ctx.request.headers, 'host'),
      method: ctx.request.method
    });
  };

  router.get('/@*', proxy);

  router.get('/:packageName', async ctx => {
    const {packageName} = ctx.params;
    ctx.set('Content-Type', 'application/json; charset=utf-8');
    try {
      ctx.body = JSON.stringify(fix(await packages.get(packageName)));
    } catch (err) {
      if (err.notFound) {
        ctx.body = '{}';
        ctx.status = 404;
        return;
      }
      ctx.body = err.message;
      ctx.status = 500;
    }
  });

  router.get('/:packageName/:rangeOrTag', async ctx => {
    const {packageName, rangeOrTag} = ctx.params;
    ctx.set('Content-Type', 'application/json; charset=utf-8');
    try {
      const packageData = fix(await packages.get(packageName));
      ctx.body = JSON.stringify(getVersionFromRangeOrTag(packageData, rangeOrTag));
    } catch (err) {
      if (err.notFound) {
        ctx.body = '{}';
        ctx.status = 404;
        return;
      }

      ctx.body = err.message;
      ctx.status = 500;
    }
  });

  router.get('/tarballs/:packageName/:version.tgz', async ctx => {
    const {packageName, version} = ctx.params;
    ctx.body = await getTarball({packageName, version});
  });

  router.put('/*', proxy);
  router.post('/*', proxy);
  router.delete('/*', proxy);

  return router;
};
