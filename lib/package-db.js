import assert from 'assert';
import {join} from 'path';

import {readFile, writeFile} from 'then-fs';
import mkdirp from 'mkdirp-then';

export default async ({dir}) => {
  assert(dir, 'dir is required');

  await mkdirp(join(dir, 'packages'));

  const filename = name => join(dir, 'packages', `${name}.json`);

  return {
    get: async name => {
      try {
        const buffer = await readFile(filename(name));
        return JSON.parse(buffer.toString());
      } catch (err) {
        if (err && err.code === 'ENOENT') {
          err.notFound = true;
        }
        throw err;
      }
    },
    put: async (name, value) => writeFile(filename(name), JSON.stringify(value))
  };
};
