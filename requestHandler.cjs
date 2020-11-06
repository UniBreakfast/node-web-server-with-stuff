const {server: {dev, public, apis}, up2} = require('.')
if (dev) require = up2(require)

const handleAPI = require('./apiHandler.cjs', dev)
const handleMiss = require('./missHandler.cjs', dev)

const {createReadStream, promises: {stat}} = require('fs')
const typeDict = require('./types')


module.exports = handleRequest


async function handleRequest(request, response) {
  let {method, url} = request

  if (apis.some(api => url.startsWith(api) && url.length > api.length))    return handleAPI(request, response)

  if (treatIfSpecial(request, response)) return

  if (method == 'GET') {
    if (url == '/') url += 'index.html'
    let path = public + url.replace(/\/$/, '')
    const found = await check(path)
    if (found == 'file') return giveFile(path, response)
    if (found == 'folder') {
      path += '/index.html'
      if (await check(path) == 'file') return giveFile(path, response)
    }
    if (path.match(/\/[^.]*$/)) {
      path += '.html'
      if (await check(path) == 'file') return giveFile(path, response)
    }
    return handleMiss(request, response)
  }
  response.writeHead(400).end('"unexpected request method and/or URL"')
}

async function check(path) {
  try {
    const found = await stat(path)
    return found.isDirectory() ? 'folder' : 'file'
  } catch { return }
}

function giveFile(path, response) {
  const extMatch = path.match(/\.([^\/]*)$/)
  const type = typeDict[extMatch ? extMatch[1] : 'html']
  if (type) response.setHeader('content-type', type)
  createReadStream(path).pipe(response)
}

function treatIfSpecial(request, response) {}
