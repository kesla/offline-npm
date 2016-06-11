import normalize from 'normalize-npm-registry-package';
import AsyncCache from 'async-cache-promise';
import Promise from 'bluebird';

export default ({get, port}) => {
  const cache = new AsyncCache({
    load: packageName => get(packageName)
      .then(_pkg => {
        const pkg = normalize(_pkg);

        Object.keys(pkg.versions).forEach(version => {
          pkg.versions[version].dist.tarball =
            `http://localhost:${port}/tarballs/${packageName}/${version}.tgz`;
        });
        return Promise.resolve(pkg);
      }),
    max: 10000
  });

  return cache.get.bind(cache);
};
