import _servertest from 'servertest';
import test from 'tapava';
import Promise from 'bluebird';
import startApp from '../lib/app';
import http from 'http';
import {NotFoundError} from 'level-errors';
import assign from 'object-assign';
import setupHttpServer from './utils/http-server';

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
    _opts.body
    ? assign({encoding: 'json'}, _opts, {body: JSON.stringify(_opts.body)})
    : assign({encoding: 'json'}, _opts);
  return servertest(app, path, opts);
};

const noop = () => {};

test('GET /:package, known', function * (t) {
  const data = {foo: 'bar'};
  const packages = {
    get: packageName => {
      t.is(packageName, 'foo');
      return Promise.resolve(data);
    }
  };
  const app = startApp({packages, getTarball: noop, registryUrl: 'http://irrelevant/'});
  const {body, statusCode} = yield jsontest(app, '/foo');

  t.deepEqual(body, data);
  t.is(statusCode, 200);
});

test('GET /:package, unknown', function * (t) {
  const packages = {
    get: packageName => Promise.reject(new NotFoundError())
  };
  const app = startApp({packages, getTarball: noop, registryUrl: 'http://irrelevant/'});
  const {body, statusCode} = yield jsontest(app, '/beep');

  t.deepEqual(body, {});
  t.is(statusCode, 404);
});

test('GET /:package error', function * (t) {
  const packages = {
    get: packageName => Promise.reject(new Error('Beep boop'))
  };
  const app = startApp({packages, getTarball: noop, registryUrl: 'http://irrelevant/'});
  const {body, statusCode} = yield servertest(app, '/beep');

  t.is(body.toString(), 'Beep boop');
  t.is(statusCode, 500);
});

test('GET /:package/:dist-tag', function * (t) {
  const packages = {
    get: packageName => {
      t.is(packageName, 'beep');

      return Promise.resolve({
        'dist-tags': {
          latest: '1.0.0'
        },
        versions: {
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
  const app = startApp({packages, getTarball: noop, registryUrl: 'http://irrelevant/'});
  const {body, statusCode} = yield jsontest(app, '/beep/latest');
  t.deepEqual(body, {version: '1.0.0'});
  t.is(statusCode, 200);
});

test('GET /:package/:version', function * (t) {
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
            version: '0.5.1'
          }
        }
      });
    }
  };
  const app = startApp({packages, getTarball: noop, registryUrl: 'http://irrelevant/'});
  const {body, statusCode} = yield jsontest(app, '/beep/^0.5.0');
  t.deepEqual(body, {version: '0.5.1'});
  t.is(statusCode, 200);
});

test('GET /:package/:version, unknown version', function * (t) {
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
  const app = startApp({packages, getTarball: noop, registryUrl: 'http://irrelevant/'});
  const {body, statusCode} = yield jsontest(app, '/beep/^0.5.2');
  t.deepEqual(body, {});
  t.is(statusCode, 404);
});

test('GET /:package/:version, unknown tag', function * (t) {
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
  const app = startApp({packages, getTarball: noop, registryUrl: 'http://irrelevant/'});
  const {body, statusCode} = yield jsontest(app, '/beep/none-existing-tag');
  t.deepEqual(body, {});
  t.is(statusCode, 404);
});
test('GET /:package/:version, unknown package', function * (t) {
  const packages = {
    get: packageName => Promise.reject(new NotFoundError())
  };
  const app = startApp({packages, getTarball: noop, registryUrl: 'http://irrelevant/'});
  const {body, statusCode} = yield jsontest(app, '/beep/latest');

  t.deepEqual(body, {});
  t.is(statusCode, 404);
});

test('GET /:package/:version, error', function * (t) {
  const packages = {
    get: packageName => Promise.reject(new Error('beep boop'))
  };
  const app = startApp({packages, getTarball: noop, registryUrl: 'http://irrelevant/'});
  const {body, statusCode} = yield servertest(app, '/beep/latest');

  t.deepEqual(body.toString(), 'beep boop');
  t.is(statusCode, 500);
});

test('GET /tarballs/:packageName/:version.tgz', function * (t) {
  const getTarball = ({packageName, version}) => {
    t.is(packageName, 'bar');
    t.is(version, '666.7.8');
    return Promise.resolve('blipp');
  };
  const app = startApp({packages: {}, getTarball, registryUrl: 'http://irrelevant'});
  const {body, statusCode} = yield servertest(app, '/tarballs/bar/666.7.8.tgz');
  t.is(body.toString(), 'blipp');
  t.is(statusCode, 200);
});

test('PUT /* proxies to registryUrl', function * (t) {
  const {shutdown, baseUrl: registryUrl} = yield setupHttpServer((req, res) => {
    t.is(req.method, 'PUT');
    t.match(req.headers, {beep: 'boop'});
    t.is(req.url, '/some/random/url');
    req.once('data', chunk => {
      t.deepEqual(JSON.parse(chunk.toString()), {request: true});
      res.end('{"result": true}');
    });
  });
  const app = startApp({packages: {}, getTarball: noop, registryUrl});
  const {body, statusCode} = yield jsontest(app, '/some/random/url', {
    method: 'put',
    body: {request: true},
    headers: {beep: 'boop'}
  });

  t.deepEqual(body, {result: true});
  t.is(statusCode, 200);
  yield shutdown();
});

test('DELETE /* proxies to registryUrl', function * (t) {
  const {shutdown, baseUrl: registryUrl} = yield setupHttpServer((req, res) => {
    t.is(req.method, 'DELETE');
    t.match(req.headers, {beep: 'boop'});
    t.is(req.url, '/some/random/url');
    res.end('{"result": true}');
  });
  const app = startApp({packages: {}, getTarball: noop, registryUrl});
  const {body, statusCode} = yield jsontest(app, '/some/random/url', {
    method: 'delete',
    headers: {beep: 'boop'}
  });

  t.deepEqual(body, {result: true});
  t.is(statusCode, 200);
  yield shutdown();
});
