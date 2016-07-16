import assert from 'assert';
import {join} from 'path';

import {readFile, writeFile} from 'then-fs';
import got from './got';

export default ({dir, packages}) => {
  assert(dir, 'dir is required');
  assert(packages, 'packages is required');

  return function * ({packageName, version}) {
    const fileName = `${packageName}-${version}.tgz`;
    const tarballFileName = join(dir, fileName);
    try {
      return yield readFile(tarballFileName);
    } catch (err) {
      const {versions: {[version]: {dist: {tarball}}}} = yield packages.get(packageName);

      console.log(`downloading tarball from ${tarball}`);
      const {body} = yield got(tarball);
      yield writeFile(tarballFileName, body);
      return body;
    }
  };
};
