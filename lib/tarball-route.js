import {get} from 'koa-route';
import {sync as mkdirp} from 'mkdirp';
import {join} from 'path';
import {readFile, writeFile} from 'then-fs';
import got from 'got';
import {Agent} from 'https';
import setupAsyncCache from 'async-cache-promise';

export default ({dir}) => {
  const agent = new Agent({keepAlive: true});
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
      const url = `https://registry.npmjs.org/${pkg}/-/${fileName}`;
      const {body} = yield got(url, {encoding: null, agent});
      this.body = body;
      yield writeFile(tarballFileName, body);
    }
  });
};
