import AsyncCache from 'async-cache-promise';
import assert from 'assert';
import got from './got';
import {wrap as co} from 'co';
import npa from 'npm-package-arg';

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

  const getFromRegistry = function * (packageName) {
    const {escapedName} = npa(packageName);
    const {body} = yield got(`${registryUrl}/${escapedName}`, {json: true});
    return body;
  };

  return {
    get: function * (packageName) {
      return packageName[0] === '@'
        ? yield getFromRegistry(packageName)
        : yield cache.get(packageName);
    },
    put
  };
};

export default packages;
