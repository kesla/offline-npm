import test from 'tapava';
import {dirSync as tmp} from 'tmp';
import {sync as touch} from 'touch';
import {join} from 'path';
import getInstalledPackages from '../lib/get-installed-packages';

test('getInstalledPackages', function * (t) {
  const {name: dir} = tmp();
  touch(join(dir, 'foo-bar-1.0.0.tgz'));
  touch(join(dir, 'foo-bar-1.1.0.tgz'));
  touch(join(dir, 'foo-baz-1.0.0.tgz'));
  const actual = yield getInstalledPackages(dir);
  const expected = {
    'foo-bar': ['1.0.0', '1.1.0'],
    'foo-baz': ['1.0.0']
  };
  t.deepEqual(actual, expected);
});
