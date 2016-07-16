import assert from 'assert';
import {join} from 'path';

import {readFile, writeFile} from 'then-fs';
import got from './got';

export default ({dir, packages}) => {
  assert(dir, 'dir is required');
  assert(packages, 'packages is required');

  return async ({packageName, version}) => {
    const fileName = `${packageName}-${version}.tgz`;
    const tarballFileName = join(dir, fileName);
    try {
      return await readFile(tarballFileName);
    } catch (err) {
      const {versions: {[version]: {dist: {tarball}}}} = await packages.get(packageName);

      console.log(`downloading tarball from ${tarball}`);
      const {body} = await got(tarball);
      await writeFile(tarballFileName, body);
      return body;
    }
  };
};
