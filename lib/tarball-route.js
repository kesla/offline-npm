import {get} from 'koa-route';
import _mkdirp from 'mkdirp';
import Promise from 'bluebird';
import {join} from 'path';
import {exists, readFile, writeFile} from 'then-fs';
import got from 'got';

const mkdirp = Promise.promisify(_mkdirp);

export default ({dir}) =>
  get('/tarballs/:packageName/:fileName', function * (packageName, fileName) {
    const dirName = join(dir, 'tarballs', packageName);
    try {
      this.body = yield readFile(join(dirName, fileName));
    } catch (err) {
      const {body} = yield got(`https://registry.npmjs.org/${packageName}/-/${packageName}-${fileName}`, {
        encoding: null
      });
      this.body = body;
      yield mkdirp(dirName);
      yield writeFile(join(dir, 'tarballs', packageName, fileName), body);
    }
  });
