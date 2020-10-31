const c = require('c4console')

const http = require('http')


module.exports = {c, run(options) {
  const dev = typeof options.dev == 'boolean' ? options.dev : !process.env.PORT
  const port = !dev ? process.env.PORT
    : typeof options.port == 'number' ? options.port : 3000

  if (dev) require = require('up2require')(require)

  const handleRequest = require('./reqHan.cjs', dev)

  const server = http.createServer(handleRequest)

  server.listen(port, reportStart).on('error', c)

  server.dev = this.dev = dev

  server.public = this.public = options.public || __dirname + '/public'

  return server
}}


function reportStart() {
  if (dev) c(`HTTP Server started at http://localhost:${port}`)
  else c('===== server started =====')
}
