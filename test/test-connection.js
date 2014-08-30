var assert = require('assert')
var resp = require('../resp')
var net = require('net')

// http://lostechies.com/derickbailey/2012/08/17/asynchronous-unit-tests-with-mocha-promises-and-winjs/

describe('Redis connection', function() {
	it('should connect', function(done) {
		var connection = net.connect({ port: 6379}, function() {
			done()
		})
	})
	it('should authenticate')
	it('should set objects', function(done) {
		var value = new Date().toString()

		var command = [ "set", "unittest", value ]
		var parserState = {}

		var connection = net.connect({ port: 6379}, function() {
			connection.write(resp.encode_redis(command))
		})

		connection.on('data', function(data) {
			resp.parse(data, 0, parserState)

			if ('completeType' in parserState)
			{
				assert.equal(parserState.completeType, "OK")
				done()
			}
		})
	})
	it('should get objects')
	it('should recover if the connection dies')
})
