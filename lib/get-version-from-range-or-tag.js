import {maxSatisfying, validRange} from 'semver';

class NotFoundError extends Error {
  constructor (msg) {
    super(msg);
    this.notFound = true;
  }
}

export default ({versions, 'dist-tags': distTags = {}}, rangeOrTag) => {
  const range = validRange(rangeOrTag);
  const version = range
    ? maxSatisfying(Object.keys(versions), range)
    : distTags[rangeOrTag];
  const obj = versions[version];

  if (!obj) {
    throw new NotFoundError();
  }

  return obj;
};
