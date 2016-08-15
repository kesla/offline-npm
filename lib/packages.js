import assert from 'assert';

import normalize from 'normalize-registry-metadata';

import got from './got';

const packages = ({db, skimUrl, registryUrl}) => {
  assert(db, 'db is required');
  assert(skimUrl, 'skimUrl is required');
  assert(registryUrl, 'registryUrl is required');

  const get = async packageName => {
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
      normalize(pkg);
      await db.put(pkg.name, pkg);
    }

    return pkg;
  };

  const put = data => {
    return db.put(data.name, data);
  };

  return {get, put};
};

export default packages;
