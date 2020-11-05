const {decode} = require('querystring')
const {stringify, parse} = JSON,  {assign} = Object

const {server: {dev, secure}, up2, c} = require('.')
const apiHandlers = dev ? null : require('./apiEnlist.cjs')
if (dev) require = up2(require)
const checkAuth = require('./authChecker.cjs', dev)


module.exports = handleAPI


async function handleAPI(request, response) {
  response.setHeader('content-type', 'application/json; charset=utf-8')
  try {
    const {method, url} = request
    const [path_api, querystring] = url.split('?')
    const {handler, access} = dev ?
      findHandler(require(`.${path_api}.cjs`, dev), method) :
        apiHandlers[path_api][method] || apiHandlers[path_api].ANY
    if (!handler) throw 'unable to handle this request method'
    let user = 'guest'
    if (access != 'guest') {
      user = await checkAuth(request, response, access)
      if (!user) {
        response.statusCode = 401
        return response.end(stringify({error: "unauthorized API request"}))
      }
    }
    const data = extractData(await receive(request), querystring)
    response.end(stringify(await (handler(data, user, method, url))))
  } catch (err) {
    c(err)
    response.statusCode = 400
    response.end(stringify({error: "unable to handle this API request"}))
  }
}


function receive(request, parts = []) {
  return new Promise((resolve, reject) => request
    .on('data', part => parts.push(part))
    .on('end', () => resolve(Buffer.concat(parts).toString('utf8')))
    .on('error', reject))
}

function extractData(__raw, querystring) {
  let __value, type
  try {
    type = typeof (__value = parse(__raw))
    if (type == 'object' && Array.isArray(__value)) type = 'array'
  } catch {}
  const decoded = decode(querystring)
  return type=='array' ? assign(__value, decoded, {__raw})
    : assign(decoded, type=='object' ? __value : {__value}, {__raw})
}

function findHandler(module, method) {
  if (typeof module == 'function')
    return {handler: module, access: secure && 'admin'}
  if (typeof module == 'object') {
    const found = module[method] || module[method.toLowerCase()]
      || module.ANY || module.any
    if (typeof found == 'function')  return {handler: found,
        access: module.access || secure && 'admin' || 'guest'}
    if (typeof found == 'object')  return {handler: found.handler,
        access: found.access || module.access || secure && 'admin' || 'guest'}
  }
}
