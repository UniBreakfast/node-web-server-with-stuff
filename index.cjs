const c = require('c4console')

const http = require('http')


module.exports = {c, server: {run(options) {
  c(options)

  const dev = this.dev =
    typeof options.dev == 'boolean' ? options.dev : !process.env.PORT
  const port = !dev ? process.env.PORT || options.port
    : typeof options.port == 'number' ? options.port : 3000

  this.public = options.public || __dirname + '/public'

  if (dev) require = require('up2require')(require)

  const handleRequest = require('./reqHan.cjs', dev)

  const server = http.createServer(handleRequest)

  server.listen(port, () => reportStart(dev, port)).on('error', c)


  return server
}}}


function reportStart(dev, port) {
  if (dev) c(`HTTP Server started at http://localhost:${port}`)
  else c(`===== server started on port ${port} =====`)
}
