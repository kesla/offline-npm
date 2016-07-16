import http from 'http';

import _servertest from 'servertest';
import test from 'tapava';
import Promise from 'bluebird';
import {NotFoundError} from 'level-errors';
import assign from 'object-assign';
import setupHttpServer from 'http-test-server';

import startApp from '../lib/app';

const servertest = (app, path, opts = {}) => new Promise((resolve, reject) => {
  const server = http.createServer(app.callback());
  const stream = _servertest(server, path, opts, (err, res) => {
    if (err) {
      reject(err);
    } else {
      resolve(res);
    }
  });

  if (opts.body) {
    stream.end(opts.body);
  }
});

const jsontest = (app, path, _opts = {}) => {
  const opts =
    _opts.body ?
      assign({encoding: 'json'}, _opts, {body: JSON.stringify(_opts.body)}) :
      assign({encoding: 'json'}, _opts);
  return servertest(app, path, opts);
};

const noop = () => {};

test('GET /:package, known', async t => {
  const data = {
    name: 'foo',
    versions: {
      '1.2.3': {
        dist: {
          tarball: 'will-be-overwritten'
        }
      },
      '1.2.4': {},
      'not-valid-semver': {}
    }
  };
  const expected = {
    name: 'foo',
    versions: {
      '1.2.3': {
        dist: {
          tarball: 'http://localhost:8044/tarballs/foo/1.2.3.tgz'
        }
      },
      '1.2.4': {
        dist: {
          tarball: 'http://localhost:8044/tarballs/foo/1.2.4.tgz'
        }
      }
    }
  };
  const packages = {
    get: packageName => {
      t.is(packageName, 'foo');
      return Promise.resolve(data);
    }
  };
  const app = startApp({port: 8044, packages, getTarball: noop, registryUrl: 'http://irrelevant/'});
  const {body: actual, statusCode} = await jsontest(app, '/foo');

  t.deepEqual(actual, expected);
  t.is(statusCode, 200);
});

test('GET /:package, unknown', async t => {
  const packages = {
    get: () => Promise.reject(new NotFoundError())
  };
  const app = startApp({port: 8044, packages, getTarball: noop, registryUrl: 'http://irrelevant/'});
  const {body, statusCode} = await jsontest(app, '/beep');

  t.deepEqual(body, {});
  t.is(statusCode, 404);
});

test('GET /:package error', async t => {
  const packages = {
    get: () => Promise.reject(new Error('Beep boop'))
  };
  const app = startApp({port: 8044, packages, getTarball: noop, registryUrl: 'http://irrelevant/'});
  const {body, statusCode} = await servertest(app, '/beep');

  t.is(body.toString(), 'Beep boop');
  t.is(statusCode, 500);
});

test('GET /:package/:dist-tag', async t => {
  const packages = {
    get: packageName => {
      t.is(packageName, 'beep');

      return Promise.resolve({
        'name': 'beep',
        'dist-tags': {
          latest: '1.0.0'
        },
        'versions': {
          '2.0.0-beta1': {
            version: '2.0.0-beta1'
          },
          '1.0.0': {
            version: '1.0.0'
          },
          '0.5.0': {
            version: '0.5.0'
          },
          '0.5.1': {
            version: '0.5.1'
          }
        }
      });
    }
  };
  const app = startApp({port: 8044, packages, getTarball: noop, registryUrl: 'http://irrelevant/'});
  const {body, statusCode} = await jsontest(app, '/beep/latest');
  t.deepEqual(body, {dist: {tarball: 'http://localhost:8044/tarballs/beep/1.0.0.tgz'}, version: '1.0.0'});
  t.is(statusCode, 200);
});

test('GET /:package/:version', async t => {
  const packages = {
    get: packageName => {
      t.is(packageName, 'beep');

      return Promise.resolve({
        name: 'beep',
        versions: {
          '1.0.0': {
            version: '1.0.0'
          },
          '0.5.0': {
            version: '0.5.0'
          },
          '0.5.1': {
            version: '0.5.1'
          }
        }
      });
    }
  };
  const app = startApp({port: 8044, packages, getTarball: noop, registryUrl: 'http://irrelevant/'});
  const {body, statusCode} = await jsontest(app, '/beep/^0.5.0');
  t.deepEqual(body, {dist: {tarball: 'http://localhost:8044/tarballs/beep/0.5.1.tgz'}, version: '0.5.1'});
  t.is(statusCode, 200);
});

test('GET /:package/:version, unknown version', async t => {
  const packages = {
    get: packageName => {
      t.is(packageName, 'beep');

      return Promise.resolve({
        versions: {
          '1.0.0': {
            version: '1.0.0'
          },
          '0.5.0': {
            version: '0.5.0'
          },
          '0.5.1': {
            versions: '0.5.1'
          }
        }
      });
    }
  };
  const app = startApp({port: 8044, packages, getTarball: noop, registryUrl: 'http://irrelevant/'});
  const {body, statusCode} = await jsontest(app, '/beep/^0.5.2');
  t.deepEqual(body, {});
  t.is(statusCode, 404);
});

test('GET /:package/:version, unknown tag', async t => {
  const packages = {
    get: packageName => {
      t.is(packageName, 'beep');

      return Promise.resolve({
        versions: {
          '1.0.0': {
            version: '1.0.0'
          },
          '0.5.0': {
            version: '0.5.0'
          },
          '0.5.1': {
            versions: '0.5.1'
          }
        }
      });
    }
  };
  const app = startApp({port: 8044, packages, getTarball: noop, registryUrl: 'http://irrelevant/'});
  const {body, statusCode} = await jsontest(app, '/beep/none-existing-tag');
  t.deepEqual(body, {});
  t.is(statusCode, 404);
});
test('GET /:package/:version, unknown package', async t => {
  const packages = {
    get: () => Promise.reject(new NotFoundError())
  };
  const app = startApp({port: 8044, packages, getTarball: noop, registryUrl: 'http://irrelevant/'});
  const {body, statusCode} = await jsontest(app, '/beep/latest');

  t.deepEqual(body, {});
  t.is(statusCode, 404);
});

test('GET /:package/:version, error', async t => {
  const packages = {
    get: () => Promise.reject(new Error('beep boop'))
  };
  const app = startApp({port: 8044, packages, getTarball: noop, registryUrl: 'http://irrelevant/'});
  const {body, statusCode} = await servertest(app, '/beep/latest');

  t.deepEqual(body.toString(), 'beep boop');
  t.is(statusCode, 500);
});

test('GET /tarballs/:packageName/:version.tgz', async t => {
  const getTarball = ({packageName, version}) => {
    t.is(packageName, 'bar');
    t.is(version, '666.7.8');
    return Promise.resolve('blipp');
  };
  const app = startApp({port: 8044, packages: {}, getTarball, registryUrl: 'http://irrelevant'});
  const {body, statusCode} = await servertest(app, '/tarballs/bar/666.7.8.tgz');
  t.is(body.toString(), 'blipp');
  t.is(statusCode, 200);
});

test('PUT /* proxies to registryUrl', async t => {
  const {shutdown, baseUrl: registryUrl} = await setupHttpServer((req, res) => {
    t.is(req.method, 'PUT');
    t.match(req.headers, {beep: 'boop'});
    t.is(req.url, '/some/random/url');
    t.deepEqual(JSON.parse(req.body.toString()), {request: true});
    res.end('{"result": true}');
  });
  const app = startApp({port: 8044, packages: {}, getTarball: noop, registryUrl});
  const {body, statusCode} = await jsontest(app, '/some/random/url', {
    method: 'put',
    body: {request: true},
    headers: {beep: 'boop'}
  });

  t.deepEqual(body, {result: true});
  t.is(statusCode, 200);
  await shutdown();
});

test('DELETE /* proxies to registryUrl', async t => {
  const {shutdown, baseUrl: registryUrl} = await setupHttpServer((req, res) => {
    t.is(req.method, 'DELETE');
    t.match(req.headers, {beep: 'boop'});
    t.is(req.url, '/some/random/url');
    res.end('{"result": true}');
  });
  const app = startApp({port: 8044, packages: {}, getTarball: noop, registryUrl});
  const {body, statusCode} = await jsontest(app, '/some/random/url', {
    method: 'delete',
    headers: {beep: 'boop'}
  });

  t.deepEqual(body, {result: true});
  t.is(statusCode, 200);
  await shutdown();
});

test('GET /@* (scoped) proxies to registryUrl', async t => {
  const {shutdown, baseUrl: registryUrl} = await setupHttpServer((req, res) => {
    t.is(req.method, 'GET');
    t.match(req.headers, {beep: 'boop'});
    t.is(req.url, '/@scope/random/url');
    res.end('{"result": true}');
  });
  const app = startApp({port: 8044, packages: {}, getTarball: noop, registryUrl});
  const {body, statusCode} = await jsontest(app, '/@scope/random/url', {
    headers: {beep: 'boop'}
  });

  t.deepEqual(body, {result: true});
  t.is(statusCode, 200);
  await shutdown();
});
