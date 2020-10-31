const {server: {dev, public}} = require('./index.cjs')
if (dev) require = require('up2require')(require)

const handleMiss = require('./missHan.cjs', dev)


module.exports = handleRequest


async function handleRequest(request, response) {
  if (request.url == '/')
    return response.end(require('fs').readFileSync(public+'/index.html'))

  return handleMiss(request, response)
}
