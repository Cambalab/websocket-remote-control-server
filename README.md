## websockets-remote-control-server

Websockets-remote-control is a JS project that provides two libraries: a client and a
server that can link two devices through websockets.

- [Client](https://github.com/Cambalab/websocket-remote-control-client)
- Server (this library)

This library initializes the Websockets server. Maintains a list of connected clients, in addition to running validations and listening to events. 

#### Example

In the `/demo` folder of the [client](https://github.com/Cambalab/websocket-remote-control-client) library

### Installation

`npm install websocket-remote-control-server`

### Usage

After installing the library:

Create and run a web server. You can use [Express](https://expressjs.com) following our 
[example](link-to-example).

Require the `websockets-remote-control-server` and initialize it:

```
// app.js (in our example)

let WebControlServer = require('websocket-remote-control-server');
let webcontrol = new WebControlServer(server);
```
And done! Now, you should install and use the [client library] to be able to listen and answer to the previously listed events.

### How it works

When a client connects (through a socket), the server is attentive of the following events:

- `getSpecialNumber`: Sends the socket id and the Special Number to the `screen`. The Special Number is an auto-generated token used for pairing both devices.

- `linkController`: Validates that the `screen` and the `controller` are correctly paired. 

- `alreadyLinked`: Emits an event alerting the involved sockets that the client which is trying connect is already paired.

- `data`: Validates that the data received is an url and is from an existent client. If the validation is correct, the data is sended to the client.
