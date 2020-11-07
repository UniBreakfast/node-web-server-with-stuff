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
In this case it will run with default settings: port 3000 locally and whichever Heroku provides for it up there, dev-mode locally and prod-mode up there, `/public/` folder for pages supposed to be present in the project root directory and it's better be having at least an `index.html`, `/api/` folder for various API handlers supposed to be preset at the root too, but it's not the end of the world if it isn't there. By default api endpoints are secured by one system-level variable ADMIN_KEY, so you may want to set it in Settings tab on Heroku. If none set the key value defaults to its name "ADMIN_KEY".

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
const {server, digest, cook} = require('node-web-server-with-stuff')
const checks = {
  user(request, response, given) {/* ... */}
  moderator(request, response, given) {/* ... */}
}
const {validateFn, rules, anything} = require('./your/modules.js')
const conn = db.connect(/* credentials */) // your database of choice connection here
const options = {/* secure: false, */checks, api: ['/data', '/secret_api'],
  given: {conn, validateFn, rules, anything} }
server.run(options)
```
And then in the `/data` (or `/secret_api`) folder could be like for an example a `notes.js` (or `notes.cjs`) file (those API-handlers can also be deep in the sufolders) and in such file would be
```js
//                         requestProps               given
module.exports = function ({data, invoice, method, url}, {conn, validateFn, rules, anything}) {
  // and here would be the function body, and it's supposed to simply
  // return what should be sent to the client by this API-endpoint
}
```
This function will handle requests with any http methods at URL `/data/notes` and those would have to have the cookie `key=5UPP3Rpassw0rd` or they would be rejected before the handler function will be called. Also that admin-cookie would be renewed for half an hour.
To use custom checks we provided above we will have to do it like this
```js
module.exports = {
  GET: {access: 'guest', handler(reqProps, {conn}) {
    // this one will require no credentials whatsoever
    // get notes via the connection and simply return them
  }},
  POST: {access: 'user', handler({data, invoice}, {conn, validateFn, rules}) {
    // this one will use the checks.user(request, response, given) to check
    // if user is recognised and it can for example get, validate and save
    // new notes for him or throw - needs to throw JSON string to send it
    // to the client
  }},
  DELETE: {access: 'moderator', handler({data, invoice}, {conn}) {
    // this one will use the checks.moderator(request, response, given) to
    // check user and it can for example delete some notes
  }}
}
```
In these examples `data` is the cumulative object from the request body and request URL querystring (both parsed and not), `invoice` is for example an id, login or name of the user confirmed (returned) by the used `checks.method()` or any other internal information corresponding to the successful access check.
