import test from 'tapava';
import setupPackages from '../lib/packages';

test('packages.get()', function * (t) {
  let called = 0;
  const db = {
    get: packageName => {
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
    }
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
  const packages = setupPackages({db, port: 1234});
  const actual = yield packages.get('foo');
  t.deepEqual(actual, expected);
  t.is(called, 1, 'get() is called once');
  yield packages.get('foo');
  t.is(called, 1, 'get() is still called once (cached)');
});

test('packages.put & packages.get', function * (t) {
  let called = 0;
  const input = {
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
  };
  const db = {
    put: (packageName, data) => {
      called = called + 1;
      t.is(packageName, 'foo');
      t.deepEqual(data, input);
      return Promise.resolve(null);
    }
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
  const packages = setupPackages({db, port: 1234});
  yield packages.put(input);
  t.is(called, 1);
  const actual = yield packages.get('foo');
  t.deepEqual(actual, expected);
});
