import test from 'tapava';
import setupDownloadNewPackages from '../lib/download-new-packages';

test('downloadNewPackages()', async t => {
  const actualTarballs = [];
  const getNewPackages = packageName => {
    t.is(packageName, 'foo-bar');
    return Promise.resolve(['1.1.1', '1.2.0']);
  };
  const getTarball = ({packageName, version}) => {
    t.is(packageName, 'foo-bar');
    actualTarballs.push({packageName, version});
    return Promise.resolve(null);
  };
  const downloadNewPackages = setupDownloadNewPackages({
    getNewPackages, getTarball
  });

  await downloadNewPackages('foo-bar');
  const expectedTarballs = [
    {packageName: 'foo-bar', version: '1.1.1'},
    {packageName: 'foo-bar', version: '1.2.0'}
  ];
  t.deepEqual(actualTarballs, expectedTarballs);
});
