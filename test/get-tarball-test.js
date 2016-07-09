import test from 'tapava';
import setupGetTarball from '../lib/get-tarball';
import {dirSync as tmp} from 'tmp';
import fs from 'then-fs';
import {join} from 'path';
import setupHttpServer from './utils/http-server';
import Promise from 'bluebird';

test('getTarball() local file', function * (t) {
  const {name: dir} = tmp();
  yield fs.writeFile(join(dir, 'package-1.0.0.tgz'), 'foobar');
  const getTarball = setupGetTarball({dir, packages: {}});
  const tarball = yield getTarball({packageName: 'package', version: '1.0.0'});
  const expected = 'foobar';
  const actual = tarball.toString();
  t.is(actual, expected);
});

test('getTarball() remote file', function * (t) {
  const {name: dir} = tmp();
  const {shutdown, baseUrl: tarballUrl} = yield setupHttpServer((req, res) => {
    t.is(req.url, '/custom/package/url.tgz');
    res.end('foobar');
  });

  const packages = {
    get: packageName => {
      t.is(packageName, 'package');
      return Promise.resolve({
        versions: {
          '1.0.0': {
            dist: {
              tarball: `${tarballUrl}/custom/package/url.tgz`
            }
          }
        }
      });
    }
  };
  const getTarball = setupGetTarball({dir, packages});
  const tarball = yield getTarball({packageName: 'package', version: '1.0.0'});
  const expected = 'foobar';
  const actual = tarball.toString();
  t.is(actual, expected);
  yield shutdown();
});
