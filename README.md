# node-web-server-with-stuff

This is a vanilla JS web server made with the nodeJS buit-in http module. It also includes a couple of modules I wrote to make my life easier ([`up2require`](https://www.npmjs.com/package/up2require) and [`c4console`](https://www.npmjs.com/package/c4console)). I made this module with my personal learning/development process in mind. Got used to use Heroku, so it's ready for the heroku deploy (respects its env.PORT by default). It also by default will run in production mode on it and in dev mode locally.

## Installation
```
npm i node-web-server-with-stuff
```
## Usage

Most basic setup-and-run would be

```js
require('node-web-server-with-stuff').server.run()
```
In this case it will run with default settings: port 3000 locally and whichever Heroku provides for it up there, dev-mode locally and prod-mode up there, `/public/` folder for pages supposed to be present in the project root directory and it's better be having at least an `index.html`, `/api/` folder for various API handlers supposed to be present at the root too, but it's not the end of the world if it isn't there. By default API endpoints are secured by one system-level variable ADMIN_KEY, so you may want to set it in Settings tab on Heroku. If none set the key value defaults to its name "ADMIN_KEY". But custom security access checks are much preferred and by default they would be loaded from `/access/` folder.

But imported module also can provide some helper functions and/or handle an options object.

```js
const {server, up2, c} = require('node-web-server-with-stuff')
const options = {/* dev: false, port: 5500 */, public: '/front'}
server.run(options)
const {dev} = server
if (dev) require = up2(require)
// ...
```
Here `options` object provides a way to configure the server (it can take dev mode and port even though in this instance they are skipped). Here it allows to select another folder for public files.
Also there are two functions imported here. `up2` is an alias for `upgradeToUpdate` from my [`up2require`](https://www.npmjs.com/package/up2require) module and `c` is my shorthand for an advanced `console.log` variant from my [`c4console`](https://www.npmjs.com/package/c4console) module.
In this example I let server decide if it's a dev run or a prod one and use or don't use `up2` based on that.

We can also configure the APIs. Here is an elaborate example. It provides additional `given` things (like the database connection or additional functions) to any custom check function or API-handler that cares to take them.

```js
process.env.ADMIN_KEY = '5UPP3Rpassw0rd' // you would do this in a separate .gitignore-d file
const {server} = require('node-web-server-with-stuff')

const {validateFn, rules, anything} = require('./from/your/modules.js')
const conn = db.connect(/* credentials */) // your database of choice connection here
const options = {/* secure: false, */ accessors: '/checks', api: ['/data', '/secret_api'],
  given: {conn, validateFn, rules, anything} }
server.run(options)
```
And then in the `/data` (or `/secret_api`) folder could be for example a `notes.js` (or `notes.cjs`) file (those API-handlers can also be deep in the sufolders) and in such file would be

```js
module.exports = function ({request, granted, conn, validateFn, rules, anything}) {
  // and here would be the function body, and it's supposed to simply
  // return what should be sent to the client by this API-endpoint
  // data received from the client is available as a promise in request.data
  // granted - is the data returned by the check function
}
```
This function will handle requests with any http methods at URL `/data/notes` and those would have to have the cookie `key=5UPP3Rpassw0rd` or they would be rejected before the handler function will be called. Also that admin-cookie would be renewed for half an hour.
To use custom checks we will have to add them in the `/checks/` folder as `.js` or `.cjs` files. For example there can be `user.js` that provides a function for checking if user is actually logged in.

```js
module.exports = async ({request, response, conn}) => {
  const user = await conn.collection('users').findOne({token: request.cookie.token})
  if (user) return user.login // this returned value will be passed to the
                             // API handler above as granted (or grant)
}
```
And if this function will throw or return falsy value the API will gracefully fail to provide the data requested. Otherwise a handler will be called to handle the requested API. The file can also look like this

```js
module.exports = {
  GET: {access: 'guest', handler({conn}) {
    // this one will require no credentials whatsoever
    // get notes via the connection and simply return them
  }},
  POST: {access: 'user', handler({req, resp, grant, conn, validateFn, rules}) {
    // this one will use the checks.user(request, response, given) to check
    // if user is recognised and it can for example get, validate and save
    // new notes for him or throw - needs to throw JSON string to send it
    // to the client
  }},
  DELETE: {access: 'moderator', handler({conn}) {
    // this one will use the checks.moderator(request, response, given) to
    // check user and it can for example delete some notes
  }}
}
```
In these examples `request` (or `req`) and `response` (or `resp`) objects have all the getters, setters and methods provided by the [`httpity`](https://www.npmjs.com/package/httpity) module. For example `request.data` is a promise giving us the cumulative object from the request body and request URL querystring both parsed if needed. And `granted` (or `grant`) may for example contain an id, login or name of the user confirmed (returned) by the used `checks.method()` or any other internal information corresponding to the successful access check.
