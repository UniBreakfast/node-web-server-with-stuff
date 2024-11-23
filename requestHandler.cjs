const { server: { dev, publicPath, apis }, up2 } = require('.')

if (dev) require = up2(require)

const handleAPI = require('./apiHandler.cjs', dev)
const handleMiss = require('./missHandler.cjs', dev)

const { stat } = require('fs').promises

module.exports = handleRequest

async function handleRequest(request, response) {
  let { method, url } = request

  if (apis.some(
    api => url.startsWith(api) && url.length > api.length
  )) {
    handleAPI(request, response)
    return 
  }

  if (treatIfSpecial(request, response)) return

  if (method == 'GET') {
    if (url == '/') url += 'index.html'

    let path = publicPath + url.replace(/\/$/, '')

    const found = await check(path)

    if (found == 'file') return response.path = path

    if (found == 'folder') {
      path += '/index.html'

      if (await check(path) == 'file') return response.path = path
    }

    if (path.match(/\/[^.]*$/)) {
      path += '.html'

      if (await check(path) == 'file') return response.path = path
    }

    return handleMiss(request, response)
  }

  response.send('"unexpected request method and/or URL"', 400)
}

async function check(path) {
  try {
    const found = await stat(path)

    return found.isDirectory() ? 'folder' : 'file'
  } catch {}
}

function treatIfSpecial(request, response) { }
