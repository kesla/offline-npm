import assert from 'assert';

import findNewerNpmPackage from 'find-newer-npm-package';

import getInstalledPackages from './get-installed-packages';

const getInstalledVersions = async ({dir, packageName}) => {
  const installedPackages = await getInstalledPackages(dir);
  return installedPackages[packageName] || [];
};

const getAvailableVersions = async ({packages, packageName}) => {
  const obj = await packages.get(packageName);
  return Object.keys(obj.versions);
};

export default ({dir, packages}) => {
  assert(dir, 'dir is required');
  assert(packages, 'packages is required');

  return async packageName => {
    const [installedVersions, availableVersions] = await Promise.all([
      getInstalledVersions({dir, packageName}),
      getAvailableVersions({packages, packageName})
    ]);
    assert(Array.isArray(installedVersions), 'installedVersions must be an Array');
    assert(Array.isArray(availableVersions), 'availableVersions must be an Array');
    return installedVersions.length === 0 ?
      [] :
      findNewerNpmPackage(installedVersions, availableVersions);
  };
};
