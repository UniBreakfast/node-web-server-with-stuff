const {server: {dev, public}} = require('./index.cjs')
if (dev) require = require('up2require')(require)

const handleMiss = require('./missHandler.cjs', dev)

const {createReadStream, promises: {stat}} = require('fs')
const typeDict = require('./types')


module.exports = handleRequest


async function handleRequest(request, response) {
  let {method, url} = request

  if (url.startsWith('/api/')) {

  } else if (treatIfSpecial(request, response)) {
    return
  } else if (method == 'GET') {
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
