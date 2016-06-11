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

test('/:package, known', function * (t) {
  const data = {foo: 'bar'};
  const getPackage = packageName => {
    t.is(packageName, 'foo');
    return Promise.resolve(data);
  };
  const app = startApp({getPackage});
  const {body, statusCode} = yield jsontest(app, '/foo');

  t.deepEqual(body, data);
  t.is(statusCode, 200);
});

test('/:package, unknown', function * (t) {
  const getPackage = packageName => Promise.reject(new NotFoundError());
  const app = startApp({getPackage});
  const {body, statusCode} = yield jsontest(app, '/beep');

  t.deepEqual(body, {});
  t.is(statusCode, 404);
});

test('/:package error', function * (t) {
  const getPackage = packageName => Promise.reject(new Error('Beep boop'));
  const app = startApp({getPackage});
  const {body, statusCode} = yield servertest(app, '/beep');

  t.is(body.toString(), 'Beep boop');
  t.is(statusCode, 500);
});
