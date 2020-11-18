const {assign} = Object
const c = require('c4console')
const up2 = require('up2require')
const httpity = require('httpity')


module.exports = {server: {run}, up2, c}


function run(options={}) {
  const dev = typeof options.dev == 'boolean' ? options.dev : !process.env.PORT
  httpity.secure = !dev
  const props = { dev,
    port: !dev ? process.env.PORT || options.port
      : typeof options.port == 'number' ? options.port : 3000,
    public: options.public || process.cwd() + '/public',
    apis: (options.api ? Array.isArray(options.api) ? options.api
      : [options.api] : ['api']).map(normalize),
    secure: typeof options.secure == 'boolean' ? options.secure : true,
    checks: options.checks || {},
    given: options.given || {}
  }
  assign(this, props)

  if (dev) require = up2(require)
  const handleRequest = require('./requestHandler.cjs', dev)
  const server = assign(httpity.createServer(handleRequest), props)

  server.on('error', err =>
    err.code=='EADDRINUSE' ? start(server, server.port = ++this.port) : c(err))

  start(server, this.port)

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

function normalize(path) {
  return `/${path.replace(/^[/\\]*|[/\\]*$/g, '')}/`
}
