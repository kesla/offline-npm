import got from 'got';
import assign from 'object-assign';
import httpHttpsAgent from 'http-https-agent';

const getAgent = httpHttpsAgent({
  keepAlive: true
});

export default (url, opts) =>
  got(url, assign({encoding: null, agent: getAgent(url)}, opts));
