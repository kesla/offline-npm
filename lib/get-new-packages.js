import assert from 'assert';

import findNewerNpmPackage from 'find-newer-npm-package';

import getInstalledPackages from './get-installed-packages';

const getInstalledVersions = function * ({dir, packageName}) {
  const installedPackages = yield getInstalledPackages(dir);
  return installedPackages[packageName] || [];
};

const getAvailableVersions = function * ({packages, packageName}) {
  const obj = yield packages.get(packageName);
  return Object.keys(obj.versions);
};

export default ({dir, packages}) => {
  assert(dir, 'dir is required');
  assert(packages, 'packages is required');

  return function * (packageName) {
    const [installedVersions, availableVersions] = yield [
      getInstalledVersions({dir, packageName}),
      getAvailableVersions({packages, packageName})
    ];
    assert(Array.isArray(installedVersions), 'installedVersions must be an Array');
    assert(Array.isArray(availableVersions), 'availableVersions must be an Array');
    return installedVersions.length === 0 ?
      [] :
      findNewerNpmPackage(installedVersions, availableVersions);
  };
};
