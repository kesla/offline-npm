import assert from 'assert';

import AsyncCache from 'async-cache-promise';

import got from './got';

const packages = ({db, skimUrl, registryUrl}) => {
  assert(db, 'db is required');
  assert(skimUrl, 'skimUrl is required');
  assert(registryUrl, 'registryUrl is required');

  const cache = new AsyncCache({
    load: async packageName => {
      let pkg;
      try {
        pkg = await db.get(packageName);
      } catch (err) {
        if (!err.notFound) {
          throw err;
        }

        console.log(`get package from ${skimUrl}/${packageName}`);
        const {body} = await got(`${skimUrl}/${packageName}`, {json: true});
        pkg = body;
        cache.set(pkg.name, pkg);
        await db.put(pkg.name, pkg);
      }

      return pkg;
    },
    max: 10000
  });

  const put = data => {
    cache.set(data.name, data);
    return db.put(data.name, data);
  };

  const get = packageName => cache.get(packageName);

  return {get, put};
};

export default packages;
