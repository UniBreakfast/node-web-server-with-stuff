const {server: {dev}, c} = require('.')
const key = process.env.ADMIN_KEY
const maxAge = 86400*3

module.exports = checkAuth


async function checkAuth(request, response) {
  let {cookie} = request.headers
  cookie = parse(cookie)
  c(cookie)
  console.log(cookie)
  if (cookie.key != key) return
  cookie = `key=${key}; Max-Age=${maxAge}; Path=/`
  if (!dev) cookie = `__Secure-${cookie}; Secure; HttpOnly; SameSite=Strict`
  response.setHeader('set-cookie', cookie)
  return 'admin'
}

function parse(cookie) {
  return cookie && Object.fromEntries(cookie.split('; ')
    .map(pair => pair.split('='))) || {}
}
