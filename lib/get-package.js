import normalize from 'normalize-npm-registry-package';
import setupAsyncCache from 'async-cache-promise';
import Promise from 'bluebird';

export default ({get, port}) => {
  return setupAsyncCache({
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
  }).get;
};
