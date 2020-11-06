const {assign, fromEntries } = Object
const { readdir } = require('fs/promises')
const { server: {apis, secure}, c} = require('.')
const apiHandlers = {}


module.exports = apiHandlers


apis.forEach(path => searchAPI('.'+path.slice(0, -1)))


function searchAPI(path) {
  readdir(path).then(list => list.map(name => path+'/'+name).forEach(path =>
    path.match(/\.c?js$/) ? assign(apiHandlers, extractHandlers(path))
      : searchAPI(path))).catch(c)
}

function extractHandlers(path) {
  let module = require(path)
  path = path.replace(/^\.|\.c?js$/g, '')
  if (typeof module == 'function') module = {any: module}
  const methods = []
  for (const key in module) {
    if (key != 'access' && !methods.includes(key.toUpperCase()))
      methods.push(key.toUpperCase())
  }
  apiHandlers[path] = fromEntries(methods.map(method => {
    const found = module[method] || module[method.toLowerCase()]
    return [method, typeof found!='function' ? {handler: found.handler,
      access: found.access || module.access || secure && 'admin' || 'guest'} :
        {handler: found, access: module.access || secure && 'admin' || 'guest'}
    ]
  }))
}
