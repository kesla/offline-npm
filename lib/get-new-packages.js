import getInstalledPackages from './get-installed-packages';
import {wrap as co} from 'co';
import findNewerNpmPackage from 'find-newer-npm-package';
import assert from 'assert';

const getInstalledVersions = function * ({dir, packageName}) {
  const installedPackages = yield getInstalledPackages(dir);
  return installedPackages[packageName];
};

const getAvailableVersions = function * ({packages, packageName}) {
  const obj = yield packages.get(packageName);
  return Object.keys(obj.versions);
};

export default ({dir, packages}) => {
  assert(dir, 'dir is required');
  assert(packages, 'packages is required');

  return co(function * (packageName) {
    const [installedVersions, availableVersions] = yield [getInstalledVersions({dir, packageName}), getAvailableVersions({packages, packageName})];
    return findNewerNpmPackage(installedVersions, availableVersions);
  });
};
