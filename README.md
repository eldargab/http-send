# http-send

Http send function inspired by `res.send()` of [express](https://github.com/visionmedia/express)

Supports:
  - Sending of strings, buffers and streams
  - Automatic `Content-Length` assignment
  - `HEAD` requests handling
  - Freshness checking
  - ETags

## Examples

```javascript
var send = require('http-send')

// send hello world string
send(req, res, 'Hello world')

// do something when response were closed or finished
// works only for node >= 0.10
send(req, res, 'foo', function () {
  // no chances to respond here
})

// streaming
// works only for node >= 0.10
var stream = fs.createReadStream('foo.txt')
stream.on('error', function (err) {
  if (res.headersSent) {
    res.destroy()
  } else { // we can respond
    var msg = err.stack
    res.writeHead(500, {
      'Content-Type': 'text/plain',
      'Content-Length': Buffer.byteLength(msg)
    })
    res.end(msg)
  }
})
send(req, res, stream, function () {
  stream.destroy()
})
```

## Installation

```
npm install http-send
```

## License

MIT
