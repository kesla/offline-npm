import {get} from 'koa-route';

export default getPackage => get('/:packageName', function * (packageName) {
  const ctx = this;
  ctx.set('Content-Type', 'application/json; charset=utf-8');
  try {
    ctx.body = JSON.stringify(yield getPackage(packageName));
  } catch (err) {
    ctx.body = '{}';
    ctx.status = 404;
  }
});
