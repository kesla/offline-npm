import {get} from 'koa-route';
import _mkdirp from 'mkdirp';
import Promise from 'bluebird';
import {join} from 'path';
import {exists, readFile, writeFile} from 'then-fs';
import got from 'got';

const mkdirp = Promise.promisify(_mkdirp);

export default ({dir}) =>
  get('/tarballs/:packageName/:fileName', function * (packageName, fileName) {
    mkdirp(join(dir, 'tarballs', packageName));
    const {body} = yield got(`https://registry.npmjs.org/${packageName}/-/${packageName}-${fileName}`, {
      encoding: null
    });
    this.body = body;
    writeFile(join(dir, 'tarballs', packageName, fileName), body);
  });
