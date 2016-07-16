import assert from 'assert';
import {join} from 'path';

import level from 'level';
import setupSubLevel from 'level-sublevel';
import Promise from 'bluebird';
import msgpack from 'msgpack';
import mkdirp from 'mkdirp-then';

const valueEncoding = {
  encode: msgpack.pack,
  decode: msgpack.unpack,
  buffer: true,
  type: 'msgpack'
};

export default async ({dir}) => {
  assert(dir, 'dir is required');

  const dbDir = join(dir, 'db');
  await mkdirp(dbDir);

  const _db = setupSubLevel(level(dbDir, {valueEncoding}));
  const sublevel = _db.sublevel('packages');
  return {
    get: Promise.promisify(sublevel.get),
    put: Promise.promisify(sublevel.put),
    close: _db.close
  };
};
