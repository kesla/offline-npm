import {readdir} from 'then-fs';
import Promise from 'bluebird';
import versionsFromFilenames from 'versions-from-filenames';

export default dir => readdir(dir)
  .then(files => Promise.resolve(versionsFromFilenames(files)));
