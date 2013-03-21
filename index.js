var fresh = require('fresh')
var crc = require('buffer-crc32').signed

/*
 * Send http response
 *
 * @param {ServerRequest} req
 * @param {ServerResponse} res
 * @param {Buffer|String|Stream|null} body
 * @param {Function} cb
 */

module.exports = function send (req, res, body, cb) {
  if (cb) {
    res.on('finish', cb)
    res.on('close', cb)
  }

  var head = req.method == 'HEAD'
    , type
    , stream
    , status = res.statusCode || 200

  if (body == null) {
    type = 'text/html'
    body = ''
  } else if (typeof body == 'string') {
    type = 'text/html'
    body = new Buffer(body)
  } else if (body.pipe) {
    type = 'application/octet-stream'
    stream = body
    body = null
  } else  { // buffer
    type = 'application/octet-stream'
  }

  if (!res.getHeader('Content-Type')) {
    res.setHeader('Content-Type', type)
  }

  if (!res.getHeader('Content-Length') && body != null) {
    res.setHeader('Content-Length', String(body.length))
  }

  // ETag support
  if (body && body.length > 1024 && !res.getHeader('ETag')) {
    res.setHeader('ETag', '"' + crc(body) + '"')
  }

  res.statusCode = status >= 200 && status < 300 && fresh(req.headers, res._headers)
    ? 304
    : status

  // strip irrelevant headers
  if (204 == res.statusCode || 304 == res.statusCode) {
    res.removeHeader('Content-Type')
    res.removeHeader('Content-Length')
    res.removeHeader('Transfer-Encoding') // https://github.com/visionmedia/express/pull/1451
    body = stream = null
  }

  if (head) {
    res.end()
  } else if (stream) {
    res.on('close', function () {
      stream.unpipe(res)
    })
    stream.pipe(res)
  } else {
    res.end(body)
  }
}
