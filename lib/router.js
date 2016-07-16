import assert from 'assert';

import KoaRouter from 'koa-router';
import setupProxy from 'koa-proxy';
import normalize from 'normalize-npm-registry-package';
import {map, set, setIn} from 'immutable-object-methods';

import getVersionFromRangeOrTag from './get-version-from-range-or-tag';

export default ({port, packages, getTarball, registryUrl}) => {
  assert(packages, 'packages is required');
  assert(getTarball, 'getTarball is required');
  assert(registryUrl, 'registryUrl is required');
  assert(port, 'port is required');

  const router = new KoaRouter();

  const fix = _pkg => {
    const pkg = normalize(_pkg);
    const packageName = pkg.name;

    const updated = map(pkg.versions, (value, version) =>
      setIn(value, ['dist', 'tarball'], `http://localhost:${port}/tarballs/${packageName}/${version}.tgz`)
    );

    return set(pkg, 'versions', updated);
  };

  router.use(setupProxy({
    host: registryUrl,
    match: /^\/@/
  }));

  router.get('/:packageName', function * () {
    const {packageName} = this.params;
    this.set('Content-Type', 'application/json; charset=utf-8');
    try {
      this.body = JSON.stringify(fix(yield packages.get(packageName)));
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
      const packageData = fix(yield packages.get(packageName));
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
