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
  if (!res.headersSent) { // we can respond
    res.statusCode = 500
    send(req, res, err.message)
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
