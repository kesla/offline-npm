import test from 'tapava';
import setupPackages from '../lib/packages';
import {NotFoundError} from 'level-errors';
import http from 'http';

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
  const packages = setupPackages({db, port: 1234, skimUrl: 'http://irrelevant'});
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
    // no get needed since we cache the package in memory
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
  const packages = setupPackages({db, port: 1234, skimUrl: 'http://irrelevant'});
  yield packages.put(input);
  t.is(called, 1);
  const actual = yield packages.get('foo');
  t.deepEqual(actual, expected);
});

test('packages.get() package not in db', function * (t) {
  let called = 0;
  const registryData = {
    name: 'foo',
    versions: {
      '1.2.3': {
        dist: {
          tarball: 'http://localhost:1234/tarballs/foo/1.2.3.tgz'
        }
      }
    }
  };
  const db = {
    get: packageName => Promise.reject(new NotFoundError()),
    put: (packageName, data) => {
      t.is(packageName, 'foo');
      t.deepEqual(data, registryData);
      called++;
      return Promise.resolve(null);
    }
  };
  const skimServer = yield new Promise(resolve => {
    const onRequest = (req, res) => {
      t.is(req.url, '/registry/foo');
      res.end(JSON.stringify(registryData));
    };

    const server = http.createServer(onRequest).listen(0, () => resolve(server));
  });

  const skimUrl = `http://localhost:${skimServer.address().port}/registry`;

  const packages = setupPackages({db, port: 1234, skimUrl});
  const actual = yield packages.get('foo');
  t.deepEqual(actual, registryData);
  t.is(called, 1, 'set() is called');
  yield packages.get('foo');
  t.is(called, 1, 'data is cached and saved');
});
