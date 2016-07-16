import resolveNpmVersion from 'resolve-npm-version';

class NotFoundError extends Error {
  constructor(msg) {
    super(msg);
    this.notFound = true;
  }
}

export default (pkg, rangeOrTag) => {
  const obj = resolveNpmVersion(pkg, rangeOrTag);

  if (!obj) {
    throw new NotFoundError();
  }

  return obj;
};
