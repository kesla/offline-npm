import normalize from 'normalize-npm-registry-package';
import AsyncCache from 'async-cache-promise';
import Promise from 'bluebird';
import assert from 'assert';

const packages = ({db, port}) => {
  assert(db, 'db is required');
  assert(port, 'port is required');

  const fix = _pkg => {
    const pkg = normalize(_pkg);
    const packageName = pkg.name;

    Object.keys(pkg.versions).forEach(version => {
      pkg.versions[version].dist.tarball =
        `http://localhost:${port}/tarballs/${packageName}/${version}.tgz`;
    });
    return pkg;
  };
  const cache = new AsyncCache({
    load: packageName => db.get(packageName)
      .then(pkg => Promise.resolve(fix(pkg))),
    max: 10000
  });

  return {
    get: cache.get.bind(cache),
    put (data) {
      cache.set(data.name, fix(data));
      return db.put(data.name, data);
    }
  };
};

export default packages;
