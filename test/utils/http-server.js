import http from 'http';
import shutdown from 'http-shutdown';

export default function * (onRequest) {
  const server = yield new Promise(resolve => {
    const _server = http.createServer(onRequest).listen(0, () => resolve(_server));
  });

  shutdown(server);

  return {
    shutdown: () => new Promise(resolve => {
      server.shutdown(resolve);
    }),
    baseUrl: `http://localhost:${server.address().port}`
  };
}
