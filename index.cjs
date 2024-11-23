const { assign } = Object
const c = require('c4console')
const up2 = require('up2require')
const httpity = require('httpity')

module.exports = { server: { run }, up2, c }

function run(options = {}) {
  const dev = typeof options.dev == 'boolean' ? 
    options.dev : !process.env.PORT
  const secure = typeof options.secure == 'boolean' ? 
    options.secure : false

  httpity.secure = options.secureCookie === undefined ? 
    !dev : options.secureCookie

  const props = {
    dev, secure,
    port: dev ? options.port || process.env.PORT || 3000
      : process.env.PORT || options.port || 3000,
    publicPath: options.publicPath || process.cwd() + '/public',
    apis: (
      !options.api ? ['api'] : Array.isArray(options.api) ? 
        options.api : [options.api]
    ).map(normalize),
    accessors: !secure ? '' :
      normalize(options.accessors) || '/access/',
    checks: options.checks || {},
    given: awaitProps(options.given)
  }

  assign(this, props)

  if (dev) require = up2(require)
    
  const handleRequest = require('./requestHandler.cjs', dev)
  const server = assign(httpity.createServer(handleRequest), props)

  server.on(
    'error', 
    err => err.code == 'EADDRINUSE' ? 
      start(server, server.port = ++this.port) : c(err)
  )

  start(server, this.port)

  return server
}

function start(server, port) {
  server.listen(port, () => {
    if (server._connectionKey.endsWith(port)) {
      reportStart(server.dev, port)
    } else {
      c(`port ${port} is already in use`)
    }
  })
}

function reportStart(dev, port) {
  if (dev) c(`HTTP Server started at http://localhost:${port}`)
  else c(`===== server started on port ${port} =====`)
}

function normalize(path) {
  return path && `/${path.replace(/^[/\\]*|[/\\]*$/g, '')}/`
}

function awaitProps(obj = {}) {
  for (const key in obj) {
    const value = obj[key]
    if (value instanceof Promise)
      value.then(value => obj[key] = value).catch(c)
  }
  return obj
}
