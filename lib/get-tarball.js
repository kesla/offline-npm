import {join} from 'path';
import {readFile, writeFile} from 'then-fs';
import AsyncCache from 'async-cache-promise';
import setupGot from './got';

export default ({dir, tarballUrl}) => {
  const got = setupGot(tarballUrl);
  const fileCache = new AsyncCache({
    load: fileName => {
      console.log(`adding ${fileName} to tarball cache`);
      return readFile(fileName);
    },
    // max cache size, 100mb
    max: 100 * 1024 * 1024,
    length: value => value.length
  });

  return function * ({pkg, version}) {
    const fileName = `${pkg}-${version}.tgz`;
    const tarballFileName = join(dir, fileName);
    try {
      return yield fileCache.get(tarballFileName);
    } catch (err) {
      const {body} = yield got(`${pkg}/-/${fileName}`);
      yield writeFile(tarballFileName, body);
      fileCache.set(tarballFileName, body);
      return body;
    }
  };
};
