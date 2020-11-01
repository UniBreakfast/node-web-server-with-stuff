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
In this case it will run with default settings: port 3000 locally and whichever Heroku provides for it up there, dev-mode locally and prod-mode up there, `/public/` folder for pages supposed to be present in the project root directory and it's better be having at least an `index.html`, `/api/` folder for various API handlers supposed to be preset at the root too, but it's not the end of the world if it isn't there (just don't count on any file to be fe)

But it also can provide some helper functions and/or handle an options object.

```js
const {server, up2, c} = require('node-web-server-with-stuff')
const options = {/* dev: false, port: 5500 */, public: __dirname+'/front'}
server.run(options)
const {dev} = server
if (dev) require = up2(require)
```
Here `options` object provides a way to configure the server (it can take dev mode and port even though in this instance they are skipped). Here it allows to select another folder for public files.
Also there are two functions imported here. `up2` is an alias for `upgradeToUpdate` from my [`up2require`](https://www.npmjs.com/package/up2require) module and `c` is my shorthand for an advanced `console.log` variant from my [`c4console`](https://www.npmjs.com/package/c4console) module.
In this example I let server decide if it's a dev run or a prod one and use or don't use `up2` based on that.
