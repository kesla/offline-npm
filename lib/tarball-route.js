import {get} from 'koa-route';
import {sync as mkdirp} from 'mkdirp';
import {join} from 'path';
import {readFile, writeFile} from 'then-fs';
import got from 'got';
import {Agent} from 'https';

export default ({dir}) => {
  const agent = new Agent({keepAlive: true});
  const dirName = join(dir, 'tarballs');

  mkdirp(dirName);

  return get('/:pkg/-/:fileName', function * (pkg, fileName) {
    const tarballFileName = join(dirName, fileName);
    try {
      this.body = yield readFile(tarballFileName);
    } catch (err) {
      const url = `https://registry.npmjs.org/${pkg}/-/${fileName}`;
      const {body} = yield got(url, {encoding: null, agent});
      this.body = body;
      yield writeFile(tarballFileName, body);
    }
  });
};
