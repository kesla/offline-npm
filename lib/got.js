import got from 'got';
import {Agent as HttpAgent} from 'http';
import {Agent as HttpsAgent} from 'https';
import startsWith from 'lodash.startswith';
import {join} from 'path';

export default baseUrl => {
  const Agent = startsWith(baseUrl, 'https') ? HttpsAgent : HttpAgent;
  const agent = new Agent({keepAlive: true});
  return relativeUrl => {
    const url = join(baseUrl, relativeUrl);
    return got(url, {encoding: null, agent});
  };
};
