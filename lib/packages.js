import normalize from 'normalize-npm-registry-package';
import AsyncCache from 'async-cache-promise';
import assert from 'assert';
import setupGot from './got';
import {wrap as co} from 'co';

const packages = ({db, port, skimUrl}) => {
  assert(db, 'db is required');
  assert(port, 'port is required');
  assert(skimUrl, 'skimUrl is required');

  const got = setupGot(skimUrl);

  const fix = _pkg => {
    const pkg = normalize(_pkg);
    const packageName = pkg.name;

    Object.keys(pkg.versions).forEach(version => {
      pkg.versions[version].dist.tarball =
        `http://localhost:${port}/tarballs/${packageName}/${version}.tgz`;
    });
    return pkg;
  };

  const put = data => {
    cache.set(data.name, fix(data));
    return db.put(data.name, data);
  };

  const cache = new AsyncCache({
    load: co(function * (packageName) {
      let pkg;
      try {
        pkg = yield db.get(packageName);
      } catch (err) {
        if (!err.notFound) {
          throw err;
        }

        const {body} = yield got(packageName, {json: true});
        pkg = body;
        yield put(pkg);
      }

      return fix(pkg);
    }),
    max: 10000
  });

  return {
    get: cache.get.bind(cache),
    put
  };
};

export default packages;
