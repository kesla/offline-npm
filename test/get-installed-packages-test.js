import {join} from 'path';

import test from 'tapava';
import {dirSync as tmp} from 'tmp';
import {sync as touch} from 'touch';

import getInstalledPackages from '../lib/get-installed-packages';

test('getInstalledPackages', async t => {
  const {name: dir} = tmp();
  touch(join(dir, 'foo-bar-1.0.0.tgz'));
  touch(join(dir, 'foo-bar-1.1.0.tgz'));
  touch(join(dir, 'foo-baz-1.0.0.tgz'));
  const actual = await getInstalledPackages(dir);
  const expected = {
    'foo-bar': ['1.0.0', '1.1.0'],
    'foo-baz': ['1.0.0']
  };
  t.deepEqual(actual, expected);
});
