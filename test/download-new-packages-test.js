import test from 'tapava';
import setupDownloadNewPackages from '../lib/download-new-packages';

test('downloadNewPackages()', function * (t) {
  const actualTarballs = [];
  const getNewPackages = function * (packageName) {
    t.is(packageName, 'foo-bar');
    return ['1.1.1', '1.2.0'];
  };
  const getTarball = function * ({packageName, version}) {
    t.is(packageName, 'foo-bar');
    actualTarballs.push({packageName, version});
  };
  const downloadNewPackages = setupDownloadNewPackages({
    getNewPackages, getTarball
  });

  yield downloadNewPackages('foo-bar');
  const expectedTarballs = [
    {packageName: 'foo-bar', version: '1.1.1'},
    {packageName: 'foo-bar', version: '1.2.0'}
  ];
  t.deepEqual(actualTarballs, expectedTarballs);
});
