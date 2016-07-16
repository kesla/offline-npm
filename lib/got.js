import {Agent as HttpAgent} from 'http';
import {Agent as HttpsAgent} from 'https';

import got from 'got';
import startsWith from 'lodash.startswith';
import assign from 'object-assign';

const httpsAgent = new HttpsAgent({keepAlive: true});
const httpAgent = new HttpAgent({keepAlive: true});

export default (url, opts) => {
  const agent = startsWith(url, 'https://') ? httpsAgent : httpAgent;
  return got(url, assign({encoding: null, agent}, opts));
};
