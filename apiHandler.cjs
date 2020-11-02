const {server: {dev}, up2} = require('.')
if (dev) require = up2(require)
const {stringify} = JSON


module.exports = handleAPI


async function handleAPI(request, response) {
  response.setHeader('content-type', 'application/json; charset=utf-8')
  try {
    const [url, querystring] = request.url.split('?')
    const handleRoute = require(`.${url}.cjs`, dev)
    response.end(stringify(await handleRoute()))
  } catch (err) {
    c(err)
    response.statusCode = 400
    response.end(stringify({error: "unable to handle this API request"}))
  }
}
