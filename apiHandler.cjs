const {decode} = require('querystring')
const {stringify, parse} = JSON,  {assign, setPrototypeOf} = Object
const {server: {dev, secure, checks, given}, digest, cook, up2, c}
  = require('.')
const apiHandlers = dev ? null : require('./apiEnlist.cjs')
if (dev) require = up2(require)
const key = process.env.ADMIN_KEY || 'ADMIN_KEY'


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
    if (access != 'guest') {
      var invoice =
        await (checks[access] || checkTheKey)(request, response, given)
      if (!invoice) return response.writeHead(401)
        .end(stringify({error: "unauthorized API request"}))
    }
    const data = extractData(await receive(request), querystring)
    let answer = await (handler({data, invoice, method, url}, given))
    if (response.also) answer = response.also(answer) || answer
    response.end(stringify(answer))
  } catch (err) {
    if (err.code != 'MODULE_NOT_FOUND') c(err)
    response.writeHead(400).end(typeof err == 'string' ? err
      : stringify({error: "unable to handle this API request"}))
  }
}


function receive(request, parts = []) {
  return new Promise((resolve, reject) => request
    .on('data', part => parts.push(part))
    .on('end', () => resolve(Buffer.concat(parts).toString('utf8')))
    .on('error', reject))
}

function extractData(_raw, _querystring) {
  let _value, type
  try {
    type = typeof (_value = parse(_raw))
    if (type == 'object' && Array.isArray(_value)) type = 'array'
  } catch {}
  const decoded = decode(_querystring)
  const raws = {_raw, _querystring}
  return type=='array' ? assign(_value, decoded, raws)
    : setPrototypeOf(assign(decoded, type=='object' ? _value : {_value}), raws)
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

function checkTheKey(request, response) {
  if (digest(request.headers.cookie).key != key) return
  response.setHeader('set-cookie', cook('key', key, !dev, 1800))
  return 'admin'
}
