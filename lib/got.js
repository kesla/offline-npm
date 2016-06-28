import got from 'got';
import {Agent as HttpAgent} from 'http';
import {Agent as HttpsAgent} from 'https';
import startsWith from 'lodash.startswith';
import assert from 'assert';
import assign from 'object-assign';

export default baseUrl => {
  assert(baseUrl, 'baseUrl is required');

  const Agent = startsWith(baseUrl, 'https') ? HttpsAgent : HttpAgent;
  const agent = new Agent({keepAlive: true});
  return (relativeUrl, opts = {}) => {
    const url = `${baseUrl}/${relativeUrl}`;
    return got(url, assign({encoding: null, agent}, opts));
  };
};
