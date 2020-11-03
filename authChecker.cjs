const {server: {dev}, c} = require('.')
const key = process.env.ADMIN_KEY
const maxAge = 86400*3

module.exports = checkAuth


async function checkAuth(request, response) {
  let {cookie=''} = request.headers
  cookie = parse(cookie)
  c(cookie)
  console.log(cookie)
  const resolution = trivialCheck(cookie)
  if (!resolution) return
  cookie = `key=${resolution}; Max-Age=${maxAge}`
  if (!dev) cookie = `__Secure-${cookie}; Path=/; Secure; HttpOnly; SameSite=Strict`
  response.setHeader('set-cookie', cookie)
  return true
}

function parse(cookie) {
  return cookie && Object.fromEntries(cookie.split('; ')
    .map(pair => pair.split('='))) || {}
}

function trivialCheck(cookie) {
  return cookie.key == key ? key : false
}
