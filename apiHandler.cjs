const {stat} = require('fs/promises')
const {server: {dev, apis, secure, accessors, given}, up2, c} = require('.')
const {checks={}, apiHandlers={}} = dev || !apis.length && !accessors ? {}
  : require('./apiEnlist.cjs')
if (dev) require = up2(require)
const key = process.env.ADMIN_KEY || 'ADMIN_KEY'


module.exports = handleAPI


async function handleAPI(request, response) { c('handleAPI')
  const req = request,  resp = response
  response.type = 'json'
  try {
    const {method, path} = request
    const {handler, access} = dev ? await findHandler(method, path)
      : apiHandlers[path][method] || apiHandlers[path].ANY
    if (!handler) throw 'unable to handle this request method'
    let grant, granted
    if (access && access != 'guest') {
      const check = (dev ? await findCheck(access) : checks[access])
        || checkTheKey
      grant = granted = await check({request, response, req, resp, ...given})
      if (!granted)
        return response.send({error: "unauthorized API request"}, 401)
    }
    let answer = await (handler({request, response, granted, ...given,
      req, resp, grant}))
    if (!response.writableEnded) response.body = answer
  } catch (err) {
    if (err.code != 'MODULE_NOT_FOUND') c(err)
    response.send(typeof err == 'string' ? err
      : {error: "unable to handle this API request"}, 400)
  }
}


async function findHandler(method, path) {
  const module = await findModule(path)
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

function findCheck(access) {
  return findModule(accessors + access)
}

async function findModule(path) {
  path = process.cwd() + path
  if (await stat(path+'.js').catch(()=>{})) path+='.js'
  else if (await stat(path+'.cjs').catch(()=>{})) path+='.cjs'
  else return
  return require(path, dev)
}

function checkTheKey({request, response}) {
  if (request.cookie.key != key) return
  response.setCookie('key', key, 1800)
  return 'admin'
}
