import assert from 'assert';

export default ({getNewPackages, getTarball}) => {
  assert(getNewPackages, 'getNewPackages required');
  assert(getTarball, 'getTarball required');
  return async packageName => {
    const newVersions = await getNewPackages(packageName);
    await Promise.all(newVersions.map(
      version => getTarball({packageName, version})
    ));
  };
};
