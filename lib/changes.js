import changes from 'concurrent-couch-follower';
import {wrap as co} from 'co';

export default (fn, opts) => {
  changes((row, done) => {
    co(fn)(row)
      .then(() => done())
      .catch(done);
  }, opts);
};
