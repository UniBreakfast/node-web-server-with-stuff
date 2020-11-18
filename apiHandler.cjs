const {stat} = require('fs/promises')
const {server: {dev, secure, checks, given}, up2, c} = require('.')
const apiHandlers = dev ? null : require('./apiEnlist.cjs')
if (dev) require = up2(require)
const key = process.env.ADMIN_KEY || 'ADMIN_KEY'


module.exports = handleAPI


async function handleAPI(request, response) {
  response.type = 'json'
  try {
    const {method, path} = request
    const {handler, access} = dev ? await findHandler(method, path)
      : apiHandlers[path][method] || apiHandlers[path].ANY
    if (!handler) throw 'unable to handle this request method'
    if (access && access != 'guest') {
      const check = checks[access] || checkTheKey
      var invoice = await check(request, response, given)
      if (!invoice)
        return response.send({error: "unauthorized API request"}, 401)
    }
    let answer = await (handler(request, response, invoice, given))
    if (!response.writableEnded) response.body = answer
  } catch (err) {
    if (err.code != 'MODULE_NOT_FOUND') c(err)
    response.send(typeof err == 'string' ? err
      : {error: "unable to handle this API request"}, 400)
  }
}


async function findHandler(method, path) {
  path = process.cwd() + path
  if (await stat(path+'.js').catch(err => null)) path+='.js'
  else if (await stat(path+'.cjs')) path+='.cjs'
  const module = require(path, dev)
  if (typeof module == 'function')
    return {handler: module, access: secure && 'admin' || 'guest'}
  if (typeof module == 'object') {
    const found = module.handler && module || module[method]
      || module[method.toLowerCase()] || module.ANY || module.any
    if (typeof found == 'function')  return {handler: found,
        access: module.access || secure && 'admin' || 'guest'}
    if (typeof found == 'object')  return {handler: found.handler,
        access: found.access || module.access || secure && 'admin' || 'guest'}
  }
}

function checkTheKey(request, response) {
  if (request.cookie.key != key) return
  response.setCookie('key', key, 1800)
  return 'admin'
}
