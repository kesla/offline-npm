import {get} from 'koa-route';
import {join} from 'path';
import setupGetTarball from './get-tarball';

export default ({dir, tarballUrl}) => {
  const getTarball = setupGetTarball({
    dir: join(dir, 'tarballs'), tarballUrl
  });

  return get('/:pkg/-/:fileName', function * (pkg, fileName) {
    this.body = yield getTarball({pkg, fileName});
  });
};
