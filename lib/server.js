import home from 'home';
import start from './index';

const port = process.env.PORT || 8044;
const dir = home.resolve(process.env.OFFLINE_NPM_DIR || '~/.offline-npm');
const skimUrl = process.env.SKIM_RUL || 'https://skimdb.npmjs.com/registry';
const registryUrl = process.env.REGISTRY_URL || 'https://registry.npmjs.org';

start({port, dir, skimUrl, registryUrl})
  .catch(err => {
    console.error(err.message);
    console.error(err.stack);
  });
