import {get} from 'koa-route';
import {sync as mkdirp} from 'mkdirp';
import {join} from 'path';
import {readFile, writeFile} from 'then-fs';
import got from 'got';

export default ({dir}) => {
  const dirName = join(dir, 'tarballs');

  mkdirp(dirName);

  return get('/tarballs/:packageName/:fileName', function * (packageName, fileName) {
    const tarballFileName = join(dirName, `${packageName}-${fileName}`);
    try {
      this.body = yield readFile(tarballFileName);
    } catch (err) {
      const {body} = yield got(`https://registry.npmjs.org/${packageName}/-/${packageName}-${fileName}`, {
        encoding: null
      });
      this.body = body;
      yield writeFile(tarballFileName, body);
    }
  });
};
