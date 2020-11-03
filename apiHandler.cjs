const {server: {dev}, up2, c} = require('.')
if (dev) require = up2(require)
const {stringify, parse} = JSON
const checkAuth = require('./authChecker.cjs', dev)


module.exports = handleAPI


async function handleAPI(request, response) {
  response.setHeader('content-type', 'application/json; charset=utf-8')
  try {
    const [path_api, querystring] = request.url.split('?')
    const handleRoute = require(`.${path_api}.cjs`, dev)
    if (handleRoute.secure) {
      if (!await checkAuth(request, response)) {
        response.statusCode = 401
        return response.end(stringify({error: "unauthorized API request"}))
      }
    }
    let body = await receive(request)
    try { body = parse(body) } catch {}
    response.end(stringify(await handleRoute(body)))
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

/*

Находим обработчик для апи
Если он защищённый, проверяем право на доступ (checkAccess)
Получаем резолюцию
Если получена резолюция,


*/
