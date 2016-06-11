import {fork} from 'child_process';
import Promise from 'bluebird';
import {join} from 'path';

export default () => {
  const child = fork(
    join(__dirname, '/_worker.js')
  );

  return new Promise(resolve => {
    child.once('message', ({dbUrl}) => {
      resolve({
        dbUrl, kill: child.kill.bind(child)
      });
    });
  });
};
