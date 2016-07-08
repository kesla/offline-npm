import KoaRouter from 'koa-router';
import getVersionFromRangeOrTag from './get-version-from-range-or-tag';
import assert from 'assert';
import setupProxy from 'koa-proxy';

export default ({packages, getTarball, registryUrl}) => {
  assert(packages, 'packages is required');
  assert(getTarball, 'getTarball is required');
  assert(registryUrl, 'registryUrl is required');

  const router = new KoaRouter();

  router.get('/:packageName', function * () {
    const {packageName} = this.params;
    this.set('Content-Type', 'application/json; charset=utf-8');
    try {
      this.body = JSON.stringify(yield packages.get(packageName));
    } catch (err) {
      if (err.notFound) {
        this.body = '{}';
        this.status = 404;
        return;
      }
      this.body = err.message;
      this.status = 500;
    }
  });

  router.get('/:packageName/:rangeOrTag', function * () {
    const {packageName, rangeOrTag} = this.params;
    this.set('Content-Type', 'application/json; charset=utf-8');
    try {
      const packageData = yield packages.get(packageName);
      this.body = JSON.stringify(getVersionFromRangeOrTag(packageData, rangeOrTag));
    } catch (err) {
      if (err.notFound) {
        this.body = '{}';
        this.status = 404;
        return;
      }

      this.body = err.message;
      this.status = 500;
    }
  });

  router.get('/tarballs/:packageName/:version.tgz', function * () {
    const {packageName, version} = this.params;
    this.body = yield getTarball({packageName, version});
  });

  const proxy = setupProxy({host: registryUrl});

  router.put('/*', proxy);
  router.delete('/*', proxy);

  return router;
};
