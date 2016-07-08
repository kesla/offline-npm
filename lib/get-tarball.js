import {join} from 'path';
import {readFile, writeFile} from 'then-fs';
import got from './got';
import assert from 'assert';

export default ({dir, registryUrl}) => {
  assert(dir, 'dir is required');
  assert(registryUrl, 'registryUrl is required');

  return function * ({packageName, version}) {
    const fileName = `${packageName}-${version}.tgz`;
    const tarballFileName = join(dir, fileName);
    try {
      return yield readFile(tarballFileName);
    } catch (err) {
      const {body} = yield got(`${registryUrl}/${packageName}/-/${fileName}`);
      yield writeFile(tarballFileName, body);
      return body;
    }
  };
};
