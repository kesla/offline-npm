import test from 'tapava';
import setupGetTarball from '../lib/get-tarball';
import {dirSync as tmp} from 'tmp';
import fs from 'then-fs';
import {join} from 'path';
import setupHttpServer from './utils/http-server';

test('getTarball() local file', function * (t) {
  const {name: dir} = tmp();
  yield fs.writeFile(join(dir, 'package-1.0.0.tgz'), 'foobar');
  const getTarball = setupGetTarball({dir, registryUrl: '/does/not/matter'});
  const tarball = yield getTarball({packageName: 'package', version: '1.0.0'});
  const expected = 'foobar';
  const actual = tarball.toString();
  t.is(actual, expected);
});

test('getTarball() remote file', function * (t) {
  const {name: dir} = tmp();
  const {shutdown, baseUrl: registryUrl} = yield setupHttpServer((req, res) => {
    t.is(req.url, '/package/-/package-1.0.0.tgz');
    res.end('foobar');
  });

  const getTarball = setupGetTarball({dir, registryUrl});
  const tarball = yield getTarball({packageName: 'package', version: '1.0.0'});
  const expected = 'foobar';
  const actual = tarball.toString();
  t.is(actual, expected);
  yield shutdown();
});
