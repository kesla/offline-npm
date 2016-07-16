import got from 'got';
import assign from 'object-assign';
import httpHttpsAgent from 'http-https-agent';

const getAgent = httpHttpsAgent({
  keepAlive: true
});

const fixOps = (url, opts = {}) => assign({encoding: null, agent: getAgent(url)}, opts);

export default (url, opts) =>
  got(url, fixOps(url, opts));

export const stream = (url, opts) =>
  got.stream(url, fixOps(url, opts));
