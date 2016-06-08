import {get} from 'koa-route';
import {sync as mkdirp} from 'mkdirp';
import {join} from 'path';
import {readFile, writeFile} from 'then-fs';
import got from 'got';
import setupAsyncCache from 'async-cache-promise';
import {Agent as HttpAgent} from 'http';
import {Agent as HttpsAgent} from 'https';
import startsWith from 'lodash.startswith';

export default ({dir, tarballUrl}) => {
  const Agent = startsWith(tarballUrl, 'https') ? HttpsAgent : HttpAgent;
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
      const url = join(tarballUrl, `${pkg}/-/${fileName}`);
      const {body} = yield got(url, {encoding: null, agent});
      this.body = body;
      yield writeFile(tarballFileName, body);
    }
  });
};
