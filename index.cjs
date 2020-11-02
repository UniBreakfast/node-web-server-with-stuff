const c = require('c4console')
const up2 = require('up2require')

const http = require('http')


module.exports = {server: {run}, up2, c}


function run(options={}) {
  const dev = this.dev =
    typeof options.dev == 'boolean' ? options.dev : !process.env.PORT

  const port = !dev ? process.env.PORT || options.port
    : typeof options.port == 'number' ? options.port : 3000

  this.public = options.public || process.cwd() + '/public'

  if (dev) require = up2(require)

  const handleRequest = require('./requestHandler.cjs', dev)

  const server = http.createServer(handleRequest)

  server.dev = dev

  server.on('error',
    err => err.code=='EADDRINUSE' ? start(server, port+1) : c(err))

  start(server, port)

  return server
}


function start(server, port) {
  server.listen(port, () => {
    if (server._connectionKey.endsWith(port)) reportStart(server.dev, port)
    else c(`port ${port} is already in use`)
  })
}

function reportStart(dev, port) {
  if (dev) c(`HTTP Server started at http://localhost:${port}`)
  else c(`===== server started on port ${port} =====`)
}
