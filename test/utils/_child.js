import PouchDBCore from 'pouchdb-core';
import PouchDBMemory from 'pouchdb-adapter-memory';
import setupExpressPouchDB from 'express-pouchdb';

const PouchDB = PouchDBCore
  .plugin(PouchDBMemory)
  .defaults({adapter: 'memory'});

const app = setupExpressPouchDB(PouchDB);
/* eslint-disable no-new */
new PouchDB('foo', {
  adapter: 'memory'
});
/* eslint-enable no-new */

const server = app.listen(0, () => {
  const {port} = server.address();
  const dbUrl = `http://localhost:${port}/foo`;

  process.send({dbUrl});
});
