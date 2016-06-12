import assert from 'assert';

export default ({getNewPackages, getTarball}) => {
  assert(getNewPackages, 'getNewPackages required');
  assert(getTarball, 'getTarball required');
  return function * (packageName) {
    const newVersions = yield getNewPackages(packageName);
    yield newVersions.map(
      version => getTarball({packageName, version})
    );
  };
};
