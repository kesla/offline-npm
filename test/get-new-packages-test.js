import test from 'tapava';
import {dirSync as tmp} from 'tmp';
import {sync as touch} from 'touch';
import {join} from 'path';
import setupGetNewPackages from '../lib/get-new-packages';
import Promise from 'bluebird';

test('getNewPackages() when tarballs exists', function * (t) {
  const {name: dir} = tmp();
  touch(join(dir, 'foo-bar-1.0.0.tgz'));
  touch(join(dir, 'foo-bar-1.1.0.tgz'));
  touch(join(dir, 'foo-baz-2.0.0.tgz'));
  const packages = {
    get: packageName => {
      t.is(packageName, 'foo-bar');

      return Promise.resolve({
        versions: {
          '1.0.0': {},
          '1.1.0': {},
          '1.1.1': {},
          '1.2.0': {},
          '2.0.0': {}
        }
      });
    }
  };
  const getNewPackages = setupGetNewPackages({dir, packages});

  const actual = (yield getNewPackages('foo-bar')).sort();
  const expected = ['1.1.1', '1.2.0', '2.0.0'];
  t.deepEqual(actual, expected);
});

test('getNewPackages() when tarballs does not exists', function * (t) {
  const {name: dir} = tmp();
  const packages = {
    get: packageName => Promise.resolve({
      versions: {
        '1.0.0': {}
      }
    })
  };

  const getNewPackages = setupGetNewPackages({dir, packages});

  const actual = (yield getNewPackages('foo-bar')).sort();
  const expected = [];
  t.deepEqual(actual, expected);
});