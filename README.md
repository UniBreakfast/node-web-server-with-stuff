# node-web-server-with-stuff

A simple and customizable Node.js web server built with the built-in `http` module, enhanced with additional utilities for easier development and deployment.

## Features

- **Vanilla Node.js**: Uses Node.js's built-in `http` module, no external web frameworks.
- **Hot Module Reloading**: Automatically reload modules during development without restarting the server, using [`up2require`](https://www.npmjs.com/package/up2require).
- **Custom Utilities**: Includes helper modules for common tasks:
  - [`httpity`](https://www.npmjs.com/package/httpity): Simplifies HTTP request and response handling.
  - [`up2require`](https://www.npmjs.com/package/up2require): Enhances `require` for hot reloading.
  - [`c4console`](https://www.npmjs.com/package/c4console): Enhanced `console.log` functionality.
- **Easy Deployment**: Ready for deployment on platforms like Heroku, Render, and Vercel.
- **Environment Aware**: Automatically runs in development mode locally and production mode on deployment platforms.
- **Customizable**: Configurable server options, including port, public directory, API handlers, and access control.
- **Modular API Handlers**: Supports modular API endpoints with optional access checks.
- **Dynamic Static File Serving**: Serves static files with intelligent path resolution.

## Installation

Install the package via npm:

```bash
npm install node-web-server-with-stuff
```

## Quick Start

Create a simple server with default settings:

```javascript
const { server } = require('node-web-server-with-stuff');

server.run();
```

This will:

- Start the server on port `3000` locally or use the `PORT` environment variable (useful for deployment platforms).
- Serve static files from the `/public` directory in the project root.
- Serve index.html if a request is made to the root URL.
- Serve html files if a request is made to a path that doesn't have an extension.
- Serve 404 page if a request is made to a non-existent file. 
- Look for API handlers in the `/api` directory.
- Run in development mode locally and production mode on deployment platforms.
- Automatically hot reload API handlers during development without restarting the server.

## Configuration

You can customize the server by passing an options object to `server.run()`:

```javascript
const { server } = require('node-web-server-with-stuff');

const options = {
  port: 5500,
  publicPath: '/front',
  dev: false, // Force production mode
  secure: true, // Enable access control for APIs
  accessors: '/checks', // Directory for access control functions
  api: ['/data', '/secret_api'], // Directories for API handlers
  given: { /* Custom objects to pass to handlers */ },
};

server.run(options);
```

### Available Options

- `port` (number): Port number to run the server on. Defaults to `process.env.PORT` or `3000`.
- `publicPath` (string): Path to the directory containing static files. Defaults to `/public`.
- `dev` (boolean): Set to `true` for development mode or `false` for production mode. Automatically determined if not set.
- `secure` (boolean): Enable or disable access control for API endpoints. Defaults to `false`.
- `accessors` (string): Directory containing access control functions. Defaults to `/access`.
- `api` (string | string[]): Path(s) to directories containing API handlers. Defaults to `/api`.
- `given` (object): Custom objects or functions to pass to API handlers and access control functions.

## Static File Serving

The server serves static files from the `publicPath` directory and those in subdirectories. When a request is made to a URL, the server looks for a corresponding file there.

For example, with `publicPath` set to `/public`, a request to `/about/page` (without extension specified) will look for:

- `/public/about/page/index.html`.
- If no folder named `page` exists in `/public/about/`, it will look for file with name `page` there, without extension.
- If no file named `page` exists in `/public/about/`, it will look for `page.html`.
- If there's no file named `page.html` either, it will serve the 404 page.

## API Handlers

API handlers are modules that process incoming API requests. Place your API handler modules in one or more directories specified by the `api` option (default one is `/api`).

### Endpoint Mapping

- A file `/api/notes.js` or `/api/notes.cjs` will handle requests to the `/api/notes` endpoint.
- API handlers can be nested in subdirectories, and the path corresponds to the URL endpoint.

### Basic API Handler

An API handler can be a JavaScript file exporting a function:

```javascript
// /api/notes.js or /api/notes.cjs or similar

module.exports = async function ({ request, response, granted, conn, validateFn, rules, ...rest }) {
  // Handle the request and return the response data
  const data = await request.data; // Parsed request body and query parameters
  // ... perform operations ...
  return { success: true, data: /* ... */ };
  // returned data can be any JSON-serializable object
};
```

**NOTE**: Here and everywhere in this documentation `req` and `resp` are available aliases for `request` and `response` respectively, so they can be destructured under those names if preferred. 

### Handler Parameters

- `request`: Enhanced HTTP request object provided by `httpity`.
- `response`: Enhanced HTTP response object provided by `httpity`.
- `granted`: Result from the access control function (if access control is enabled).
- `conn`, `validateFn`, `rules`, etc.: Custom objects passed via the `given` option.

### Handling Different HTTP Methods

You can define handlers for specific HTTP methods. In that case, instead of a single function, you export an object with sub-objects for each HTTP method, specifying the access level and the handler function:

```javascript
// /api/notes.js or /api/notes.cjs or similar

module.exports = {
  GET: {
    access: 'guest', // full access
    handler: async function ({ request, response, ...rest }) {
      // Handle GET requests
    },
  },
  POST: {
    // user access provided by the /access/user.js function
    access: 'user', 
    handler: async function ({ request, response, granted, ...rest }) {
      // Handle POST requests with user access
    },
  },
  DELETE: {
    // admin access provided by the /access/admin.js function
    // or the master key from the `ADMIN_KEY` environment variable
    access: 'admin',
    handler: async function ({ request, response, granted, ...rest }) {
      // Handle DELETE requests with admin access
    },
  },
};
```

There's also a simpler way to define handlers for specific HTTP methods if you don't need access control:

```javascript
// /api/notes.js or /api/notes.cjs or similar

module.exports = {
  GET: ({ request, response, ...rest }) => {
    // Handle GET requests
  },
  POST: ({ request, response, ...rest }) => {
    // Handle POST requests
  },
  DELETE: ({ request, response, ...rest }) => {
    // Handle DELETE requests
  }
}
```

## Access Control

When `secure` option is set to `true`, API endpoints require access checks before processing requests. Access control functions are placed in the directory specified by the `accessors` option (default is `/access`).

### Default Access Control

Without custom accessors, the server uses a simple cookie-based access control:

- The client must send a cookie named `key` with the value matching the `ADMIN_KEY` environment variable (customizable via an `.env` file).
- This provides access levels other than `guest`.
- Handlers with `access: 'guest'` are available without any access checks.
- If key is incorrect or missing, the endpoint will respond with `unauthorized`.

### Access Levels

- Access levels are arbitrary names and can be customized.
- There can be any number of access levels.
- If `secure: true` and an API handler specifies an access level without a corresponding accessor function in the `/access` directory, the endpoint will respond with `unauthorized`.

### Creating Access Control Functions

Each access level corresponds to a module exporting a function:

```javascript
// /access/user.js or /access/user.cjs or similar

module.exports = async function ({ request, response, conn, ...rest }) {
  const token = request.cookies.token;
  const user = await conn.collection('users').findOne({ token });
  if (user) {
    return user; // Return user data to be available in `granted`
  } else {
    throw new Error('Unauthorized');
  }
};
```

### Using Access Levels in API Handlers

Specify the required access level in the handler definition:

```javascript
// /api/notes.js

module.exports = {
  POST: {
    access: 'user', // Requires the `/access/user.js` function
    handler: async function ({ request, response, granted, ...rest }) {
      // `granted` contains the user data returned from the access control function
    },
  },
};
```

If `secure: true` and an API handler specifies an access level without a corresponding accessor function, the server will respond with `unauthorized`.

## Helper Modules

The package provides additional helper modules to simplify development:

### `up2require` 

###### for Hot Module Reloading

An alias for [`upgradeToUpdate`](https://www.npmjs.com/package/up2require) from the `up2require` module. 

During development, modules loaded using the upgraded `require` function from `up2require` will hot reload. So you can add, change, or remove them at any time without restarting the server. This is especially useful for rapid development and testing.

To enable hot reloading for a module, pass `true` as the second argument to upgraded `require` function:

### Enabling `up2require` in Development Mode

```javascript
const { server, up2 } = require('node-web-server-with-stuff');

if (server.dev) require = up2(require);
```

Then to enable hot reloading for a specific module use that upgraded `require` function:

```javascript
const myModule = require('./myModule', true);
```

### c4console 
###### for Functionally Transparent Chainable Logging )

An enhanced version of `console.log` from the [`c4console`](https://www.npmjs.com/package/c4console) module.

```javascript
const { c } = require('node-web-server-with-stuff');

c('This is an enhanced console log message');
```

But `c` can also be better used like this:

```javascript
// no imports required to use as a method

[1, 2, 3].map(x => x * 2).c('double').map(x => x * 3).c('triple');

/* will log: */

// doubled: (3) [2, 4, 6]
// tripled: (3) [6, 12, 18]
```

Note that the `c` method is inherited by any non-empty value from the `Object.prototype`, takes optional label argument, and returns the value it was called on, so it can be inserted into a chain of propery reads or function calls to see intermediate values without braking the chain logic.

## More Examples

### Using Custom `publicPath`

Serve static files from a custom directory:

```javascript
const { server } = require('node-web-server-with-stuff');

server.run({ publicPath: '/frontend' });
```

### Passing Custom Objects to Handlers

Provide a database connection and other utilities to API handlers:

```javascript
const { server } = require('node-web-server-with-stuff');
const db = require('./db'); // Your database module
const validateFn = require('./validate');
const rules = require('./rules');

const conn = db.connect(/* credentials */);

server.run({
  secure: true,
  given: { conn, validateFn, rules },
});
```

### Defining an API Handler with Access Control

```javascript
// /api/data/notes.js

module.exports = {
  GET: {
    access: 'user',
    handler: async function ({ request, response, granted, conn }) {
      const notes = await conn.collection('notes').find({ userId: granted.id }).toArray();
      return { notes };
    },
  },
};
```

### Access Control Function

```javascript
// /access/user.js

module.exports = async function ({ request, response, conn }) {
  const token = request.cookies.token;
  const user = await conn.collection('users').findOne({ token });
  if (user) {
    return user;
  } else {
    throw new Error('Unauthorized');
  }
};
```

## License

[MIT](LICENSE)
