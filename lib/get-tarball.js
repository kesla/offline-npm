import {wrap as co} from 'co';
import {join} from 'path';
import {readFile, writeFile} from 'then-fs';
import setupAsyncCache from 'async-cache-promise';
import setupGot from './got';
import {sync as mkdirp} from 'mkdirp';

export default ({dir, tarballUrl}) => {
  const got = setupGot(tarballUrl);
  mkdirp(dir);
  const fileCache = setupAsyncCache({
    load: fileName => {
      console.log(`adding ${fileName} to tarball cache`);
      return readFile(fileName);
    },
    // max cache size, 100mb
    max: 100 * 1024 * 1024,
    length: value => value.length
  });

  return co(function * ({pkg, fileName}) {
    const tarballFileName = join(dir, fileName);
    try {
      return yield fileCache.get(tarballFileName);
    } catch (err) {
      const {body} = yield got(`${pkg}/-/${fileName}`);
      yield writeFile(tarballFileName, body);
      return body;
    }
  });
};
