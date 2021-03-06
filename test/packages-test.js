import test from 'tapava';
import setupHttpServer from 'http-test-server';

import setupPackages from '../lib/packages';
import NotFoundError from './utils/not-found-error';

test('packages.get()', async t => {
  let called = 0;
  const db = {
    get: packageName => {
      called += 1;
      t.is(packageName, 'foo');
      return Promise.resolve({
        name: 'foo',
        versions: {
          '1.2.3': {}
        }
      });
    }
  };
  const expected = {
    name: 'foo',
    versions: {
      '1.2.3': {}
    }
  };
  const skimUrl = 'http://irrelevant';
  const registryUrl = skimUrl;
  const packages = setupPackages({db, port: 1234, skimUrl, registryUrl});
  const actual = await packages.get('foo');
  t.deepEqual(actual, expected);
  t.is(called, 1, 'get() is called once');
  await packages.get('foo');
});

test('packages.put & packages.get', async t => {
  let called = 0;
  const input = {
    name: 'foo',
    versions: {
      '1.2.3': {}
    }
  };
  const db = {
    put: (packageName, data) => {
      called += 1;
      t.is(packageName, 'foo');
      t.deepEqual(data, input);
      return Promise.resolve(null);
    }
    // no get needed since we cache the package in memory
  };
  const skimUrl = 'http://irrelevant';
  const registryUrl = skimUrl;
  const packages = setupPackages({db, port: 1234, skimUrl, registryUrl});
  await packages.put(input);
  t.is(called, 1);
});

test('packages.get() package not in db', async t => {
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
    get: () => Promise.reject(new NotFoundError()),
    put: (packageName, data) => {
      t.is(packageName, 'foo');
      t.deepEqual(data, registryData);
      called++;
      return Promise.resolve(null);
    }
  };
  const {shutdown, baseUrl} = await setupHttpServer((req, res) => {
    t.is(req.url, '/registry/foo');
    res.end(JSON.stringify(registryData));
  });

  const skimUrl = `${baseUrl}/registry`;
  const registryUrl = 'http://irrelevant';

  const packages = setupPackages({db, port: 1234, skimUrl, registryUrl});
  const actual = await packages.get('foo');
  t.deepEqual(actual, registryData);
  t.is(called, 1, 'set() is called');
  await shutdown();
});
