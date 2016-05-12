
# Why?
  This module implements the '[distributed-eventemitter](https://www.npmjs.com/package/distributed-eventemitter)' API for the browser or single node processes.
  Intended for non-distributed deployments or development.  
  
# Quick Start

  ```js
  var EventEmitter = require('process-eventemitter');
  var events = new EventEmitter(); 
  
  events.on('email.send', (message, resolve, reject) => {
    console.log('sending email...');
    //... send email
    // ...

    resolve('sent');
  });
  
  
  // somewhere else in your code
  events.emitToOne('email.send', {
    to: 'kyberneees@gmail.com',
    subject: 'Hello Node.js',
    body: 'Request/response feature is just awesome...'
  }, 3000).then((response) => {
    if ('sent' === response) {
      console.log('email was sent!');
    }
  }).catch(console.log.bind());
  ```

## Example using ES6 generators
```js 
"use strict";

const co = require('co');
co(function* () {
    try {
        let response = yield events.emitToOne('email.send', {
            to: 'kyberneees@gmail.com',
            subject: 'Hello Node.js',
            body: 'Request/response feature is just awesome...'
        }, 3000);

        if ('sent' === response) {
            console.log('email was sent!');
        }
    } catch (error) {
        console.log('error: ' + error);
    }
});
```

# Requirements
- None

# Installation

```bash
$ npm install process-eventemitter
```

# Features
The same 'distributed-eventemitter' module API, but restricted to a single process and emitter instance. 
The methods 'connect', 'disconnect' are just kept for compatibility, in case you want to make your code distributed later ;) 

# Internal events
```js
events.on('connected', (emitterId) => {
    // triggered when the emitter has been connected
});

events.on('disconnected', (emitterId) => {
    // triggered when the emitter has been disconnected
});

events.on('error', (error) => {
   // triggered when an internal error occurs 
}):

events.on('request', (event, request, raw) => {
   // triggered before invoke a listener using emitToOne feature
   
   // request data filtering and modification is allowed
   // example:
   request.data = ('string' === typeof request.data) ? request.data.toUpperCase() : request.data
}):

events.on('response', (event, response, raw) => {
   // triggered after invoke a listener using emitToOne feature
   
   // response data filtering and modification is allowed
   // example:
   if (response.ok)
     response.data = ('string' === typeof response.data) ? response.data.toUpperCase() : response.data
   else 
     console.log('error ocurred: ' + response.data.message);
}):

```

# API
**getId**: Get the emitter instance unique id.

```js
events.getId(); // UUID v4 value
```

**connect**: Does nothing. Kept for compatilibity with the distributed version.

```js
events.connect().then(()=> {
  console.log('connected');
});
```

**disconnect**:Does nothing. Kept for compatilibity with the distributed version.

```js
events.disconnect().then(()=> {
  console.log('disconnected');
});
```

**emitToOne**: Notify a custom event to only one target listener. The method accept only one argument as event data.

```js
events.on('my.event', (data, resolve, reject) => {
  if ('hello' === data){
    resolve('world');
  } else {
    reject('invalid args');
  }
});

// calling without timeout
events.emitToOne('my.event', 'hello').then((response) => {
  console.log('world' === response);
});

// calling with timeout (ms)
events.emitToOne('my.event', {data: 'hello'}, 100).catch((error) => {
  console.log('invalid args' === error);
});
```

# Tests

```bash
$ npm install
$ npm test
```