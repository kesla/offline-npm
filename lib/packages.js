import AsyncCache from 'async-cache-promise';
import assert from 'assert';
import got from './got';
import {wrap as co} from 'co';

const packages = ({db, skimUrl, registryUrl}) => {
  assert(db, 'db is required');
  assert(skimUrl, 'skimUrl is required');
  assert(registryUrl, 'registryUrl is required');

  const put = data => {
    cache.set(data.name, data);
    return db.put(data.name, data);
  };

  const cache = new AsyncCache({
    load: co(function * (packageName) {
      let pkg;
      try {
        pkg = yield db.get(packageName);
      } catch (err) {
        if (!err.notFound) {
          throw err;
        }

        console.log(`get package from ${skimUrl}/${packageName}`);
        const {body} = yield got(`${skimUrl}/${packageName}`, {json: true});
        pkg = body;
        yield put(pkg);
      }

      return pkg;
    }),
    max: 10000
  });

  const get = packageName => cache.get(packageName);

  return {get, put};
};

export default packages;
