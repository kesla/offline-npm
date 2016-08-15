class NotFoundError extends Error {
  constructor() {
    super('Not Found');
    this.notFound = true;
  }
}

export default NotFoundError;
