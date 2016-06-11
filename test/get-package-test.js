import test from 'tapava';
import setupGetPackage from '../lib/get-package';

test('getPackage()', function * (t) {
  let called = 0;
  const get = packageName => {
    called = called + 1;
    t.is(packageName, 'foo');
    return Promise.resolve({
      name: 'foo',
      versions: {
        '1.2.3': {
          dist: {
            tarball: 'will-be-overwritten'
          }
        },
        'not-valid-semver': {
        }
      }
    });
  };
  const expected = {
    name: 'foo',
    versions: {
      '1.2.3': {
        dist: {
          tarball: 'http://localhost:1234/tarballs/foo/1.2.3.tgz'
        }
      }
    }
  };
  const getPackage = setupGetPackage({get, port: 1234});
  const actual = yield getPackage('foo');
  t.deepEqual(actual, expected);
  t.is(called, 1, 'get() is called once');
  yield getPackage('foo');
  t.is(called, 1, 'get() is still called once (cached)');
});
