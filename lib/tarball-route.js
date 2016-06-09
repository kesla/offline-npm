import {get} from 'koa-route';
import {sync as mkdirp} from 'mkdirp';
import {join} from 'path';
import {readFile, writeFile} from 'then-fs';
import setupAsyncCache from 'async-cache-promise';
import got from './got';

export default ({dir, tarballUrl}) => {
  const dirName = join(dir, 'tarballs');
  const fileCache = setupAsyncCache({
    load: key => readFile(key),
    max: 1000
  });

  mkdirp(dirName);

  return get('/:pkg/-/:fileName', function * (pkg, fileName) {
    const tarballFileName = join(dirName, fileName);
    try {
      this.body = yield fileCache.get(tarballFileName);
    } catch (err) {
      const {body} = yield got(`${pkg}/-/${fileName}`);
      this.body = body;
      yield writeFile(tarballFileName, body);
    }
  });
};
