import {join} from 'path';
import {readFile, writeFile} from 'then-fs';
import setupGot from './got';
import assert from 'assert';

export default ({dir, tarballUrl}) => {
  assert(dir, 'dir is required');
  assert(tarballUrl, 'tarballUrl is required');

  const got = setupGot(tarballUrl);

  return function * ({packageName, version}) {
    const fileName = `${packageName}-${version}.tgz`;
    const tarballFileName = join(dir, fileName);
    try {
      return yield readFile(tarballFileName);
    } catch (err) {
      const {body} = yield got(`${packageName}/-/${fileName}`);
      yield writeFile(tarballFileName, body);
      return body;
    }
  };
};
