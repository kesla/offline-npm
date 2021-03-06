import {join} from 'path';

import test from 'tapava';
import {dirSync as tmp} from 'tmp';
import fs from 'then-fs';
import Promise from 'bluebird';
import setupHttpServer from 'http-test-server';

import setupGetTarball from '../lib/get-tarball';

test('getTarball() local file', async t => {
  const {name: dir} = tmp();
  await fs.writeFile(join(dir, 'package-1.0.0.tgz'), 'foobar');
  const getTarball = setupGetTarball({dir, packages: {}});
  const tarball = await getTarball({packageName: 'package', version: '1.0.0'});
  const expected = 'foobar';
  const actual = tarball.toString();
  t.is(actual, expected);
});

test('getTarball() remote file', async t => {
  const {name: dir} = tmp();
  const {shutdown, baseUrl: tarballUrl} = await setupHttpServer((req, res) => {
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
  const tarball = await getTarball({packageName: 'package', version: '1.0.0'});
  const expected = 'foobar';
  const actual = tarball.toString();
  t.is(actual, expected);
  await shutdown();
});
