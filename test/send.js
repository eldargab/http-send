var should = require('should')
var supertest = require('supertest')
var fs = require('fs')
var send = require('..')

describe('http-send', function () {
  var body

  function request (server) {
    server = server || function (req, res) {
      send(req, res, body)
    }
    return supertest(server)
  }

  beforeEach(function () {
    body = null
  })

  it('Should send strings', function (done) {
    body = 'hello world'
    request().get('/')
      .expect('Content-Type', 'text/html')
      .expect(200, 'hello world', done)
  })

  it('Should send buffers', function (done) {
    body = new Buffer('hi')
    request().get('/')
      .expect('Content-Type', 'application/octet-stream')
      .expect(200, 'hi', done)
  })

  it('Should send streams', function (done) {
    var stream = fs.createReadStream(__filename)
    request(function (req, res) {
      stream.on('error', done)
      send(req, res, stream, function () {
        stream.destroy()
      })
    })
    .get('/')
    .expect('Content-Type', 'application/octet-stream')
    .expect(200, /Should send streams/, done)
  })

  describe('When body == null', function () {
    it('Should set body to ""', function (done) {
      body = null
      request().get('/')
        .expect('Content-Length', '0')
        .expect('Content-Type', 'text/html')
        .expect(200, '', done)
    })
  })

  it('Should not override Content-Type', function (done) {
    request(function (req, res) {
      res.setHeader('Content-Type', 'foo/bar')
      send(req, res, 'foo')
    })
    .get('/')
    .expect('Content-Type', 'foo/bar')
    .expect(200, 'foo', done)
  })

  it('Should send ETag for large bodies', function (done) {
    body = Array(1024 * 2).join('-')
    request().get('/')
      .expect('ETag', '"-1498647312"', done)
  })

  describe('When .statusCode is 304', function () {
    it('Should strip Content-* headers, Transfer-Encoding and body', function (done) {
      request(function (req, res) {
        res.statusCode = 304
        res.setHeader('Transfer-Encoding', 'chunked')
        send(req, res, 'hi')
      })
      .get('/')
      .end(function (err, res) {
        if (err) return done(err)
        res.should.not.have.property('content-length')
        res.should.not.have.property('content-type')
        res.should.not.have.property('transfer-encoding')
        res.text.should.equal('')
        done()
      })
    })
  })

  describe('When .statusCode is 204', function () {
    it('Should strip Content-* headers, Transfer-Encoding and body', function (done) {
      request(function (req, res) {
        res.statusCode = 204
        res.setHeader('Transfer-Encoding', 'chunked')
        send(req, res, 'hi')
      })
      .get('/')
      .end(function (err, res) {
        if (err) return done(err)
        res.should.not.have.property('content-length')
        res.should.not.have.property('content-type')
        res.should.not.have.property('transfer-encoding')
        res.text.should.equal('')
        done()
      })
    })
  })

  it('Should respond with 304 when fresh', function (done) {
    body = Array(1024 * 2).join('-')
    request()
      .get('/')
      .set('If-None-Match', '"-1498647312"')
      .expect(304, done)
  })

  it('Should not check for freshness unless 2xx or 303', function (done) {
    request(function (req, res) {
      res.statusCode = 400
      res.setHeader('ETag', 'asd')
      send(req, res, 'hi')
    })
    .get('/')
    .set('If-None-Match', 'asd')
    .expect(400, 'hi', done)
  })

  it('Should call passed callback when response were finished or closed', function (done) {
    var called = false
    request(function (req, res) {
      send(req, res, 'hello', function () {
        called = true
      })
    })
    .get('/')
    .expect(200, 'hello')
    .end(function (err) {
      called.should.be.true
      done(err)
    })
  })
})
