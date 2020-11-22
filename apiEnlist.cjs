const {assign, fromEntries } = Object
const { readdir } = require('fs').promises
const { server: {apis, secure, accessors}, c} = require('.')
const checks = {}, apiHandlers = {}


module.exports = {checks, apiHandlers}


if (accessors) {
  const searchChecks = path => readdir(process.cwd()+path)
    .then(list => list.map(name => path+'/'+name)
      .forEach(path => path.match(/\.c?js$/) ? grabCheck(path)
        : searchChecks(path))).catch(c)

  const grabCheck = path => {
    const check = require(process.cwd()+path)
    if (typeof check == 'function')
      checks[path.replace(/^.[^/\\]+.|\.c?js$/g, '')] = check
  }

  searchChecks(accessors.slice(0, -1))
}


apis.forEach(path => searchAPI(path.slice(0, -1)))


function searchAPI(path) {
  readdir(process.cwd()+path).then(list => list.map(name => path+'/'+name)
    .forEach(path => path.match(/\.c?js$/)
      ? assign(apiHandlers, extractHandlers(path)) : searchAPI(path))).catch(c)
}

function extractHandlers(path) {
  let module = require(process.cwd()+path)
  if (typeof module == 'function' || module.handler) module = {any: module}
  const methods = []
  for (const key in module) {
    if (key != 'access' && !methods.includes(key.toUpperCase()))
      methods.push(key.toUpperCase())
  }
  const handleBundle = fromEntries(methods.map(method => {
    const found = module[method] || module[method.toLowerCase()]
    return [method, typeof found!='function' ? {handler: found.handler,
      access: found.access || module.access || secure && 'admin' || 'guest'} :
        {handler: found, access: module.access || secure && 'admin' || 'guest'}
    ]
  }))
  apiHandlers[path.replace(/^\.|\.c?js$/g, '')] = handleBundle
}
