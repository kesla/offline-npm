import __servertest from 'servertest';
import test from 'tapava';
import Promise from 'bluebird';
import startApp from '../lib/app';
import http from 'http';
import {NotFoundError} from 'level-errors';
import assign from 'object-assign';

const _servertest = Promise.promisify(__servertest);
const servertest = (app, path, opts) =>
  _servertest(http.createServer(app.callback()), path, opts);
const jsontest = (app, path, opts) =>
  servertest(app, path, assign({encoding: 'json'}, opts));
const noop = () => {};

test('/:package, known', function * (t) {
  const data = {foo: 'bar'};
  const getPackage = packageName => {
    t.is(packageName, 'foo');
    return Promise.resolve(data);
  };
  const app = startApp({getPackage, getTarball: noop});
  const {body, statusCode} = yield jsontest(app, '/foo');

  t.deepEqual(body, data);
  t.is(statusCode, 200);
});

test('/:package, unknown', function * (t) {
  const getPackage = packageName => Promise.reject(new NotFoundError());
  const app = startApp({getPackage, getTarball: noop});
  const {body, statusCode} = yield jsontest(app, '/beep');

  t.deepEqual(body, {});
  t.is(statusCode, 404);
});

test('/:package error', function * (t) {
  const getPackage = packageName => Promise.reject(new Error('Beep boop'));
  const app = startApp({getPackage, getTarball: noop});
  const {body, statusCode} = yield servertest(app, '/beep');

  t.is(body.toString(), 'Beep boop');
  t.is(statusCode, 500);
});

test('/:package/:dist-tag', function * (t) {
  const getPackage = packageName => {
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
  };
  const app = startApp({getPackage, getTarball: noop});
  const {body, statusCode} = yield jsontest(app, '/beep/latest');
  t.deepEqual(body, {version: '1.0.0'});
  t.is(statusCode, 200);
});

test('/:package/:version', function * (t) {
  const getPackage = packageName => {
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
  };
  const app = startApp({getPackage, getTarball: noop});
  const {body, statusCode} = yield jsontest(app, '/beep/^0.5.0');
  t.deepEqual(body, {version: '0.5.1'});
  t.is(statusCode, 200);
});

test('/:package/:version, unknown version', function * (t) {
  const getPackage = packageName => {
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
  };
  const app = startApp({getPackage, getTarball: noop});
  const {body, statusCode} = yield jsontest(app, '/beep/^0.5.2');
  t.deepEqual(body, {});
  t.is(statusCode, 404);
});

test('/:package/:version, unknown tag', function * (t) {
  const getPackage = packageName => {
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
  };
  const app = startApp({getPackage, getTarball: noop});
  const {body, statusCode} = yield jsontest(app, '/beep/none-existing-tag');
  t.deepEqual(body, {});
  t.is(statusCode, 404);
});
test('/:package/:version, unknown package', function * (t) {
  const getPackage = packageName => Promise.reject(new NotFoundError());
  const app = startApp({getPackage, getTarball: noop});
  const {body, statusCode} = yield jsontest(app, '/beep/latest');

  t.deepEqual(body, {});
  t.is(statusCode, 404);
});

test('/:package/:version, error', function * (t) {
  const getPackage = packageName => Promise.reject(new Error('beep boop'));
  const app = startApp({getPackage, getTarball: noop});
  const {body, statusCode} = yield servertest(app, '/beep/latest');

  t.deepEqual(body.toString(), 'beep boop');
  t.is(statusCode, 500);
});

test('/tarballs/:packageName/:version.tgz', function * (t) {
  const getTarball = ({packageName, version}) => {
    t.is(packageName, 'bar');
    t.is(version, '666.7.8');
    return Promise.resolve('blipp');
  };
  const app = startApp({getPackage: noop, getTarball});
  const {body, statusCode} = yield servertest(app, '/tarballs/bar/666.7.8.tgz');
  t.is(body.toString(), 'blipp');
  t.is(statusCode, 200);
});
