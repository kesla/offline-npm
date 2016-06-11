import _servertest from 'servertest';
import test from 'tapava';
import Promise from 'bluebird';
import startApp from '../lib/app';
import http from 'http';

const servertest = Promise.promisify(_servertest);

test('app, known package', function * (t) {
  const data = {foo: 'bar'};
  const getPackage = packageName => {
    t.is(packageName, 'foo');
    return Promise.resolve(data);
  };
  const app = startApp({getPackage});
  const server = http.createServer(app.callback());
  const {body, statusCode} = yield servertest(server, '/foo', {encoding: 'json'});

  t.deepEqual(body, data);
  t.is(statusCode, 200);
});
