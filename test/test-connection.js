var assert = require('assert')
var resp = require('../resp')
var net = require('net')

// http://lostechies.com/derickbailey/2012/08/17/asynchronous-unit-tests-with-mocha-promises-and-winjs/

function RedisServer(running)
{
	var objects = {}

	this.server = net.createServer(function(connection) {
		var parserState = {}

		connection.on('data', function(data) {
			var offset = 0

		    	while (offset < data.length)
			{
				offset = resp.parse(data, offset, parserState)

				if ('completeType' in parserState)
				{
					var returnData = ""

					switch (parserState.completeType[0].toString())
					{
						case "set":
							objects[parserState.completeType[1]] = parserState.completeType[2]
							returnData = "OK"
							break;

						case "get":
							returnData = objects[parserState.completeType[1]]
							break;
					}

			    		parserState = {}

					connection.write(resp.encode_redis(returnData))
				}
		    	}			
		})
	})
	this.server.listen(0, running)
}

describe('Redis connection', function() {
	var value = new Date().toString()
	var port = 0 // 6379
	var server = null

	before(function(done) {
		server = new RedisServer(function() {
			port = server.server.address().port
			done()
		})
	})

	it('should connect', function(done) {
		var connection = net.connect({ port: port}, function() {
			done()
		})
	})
	it('should authenticate')
	it('should set objects', function(done) {
		var command = [ "set", "unittest", value ]
		var parserState = {}

		var connection = net.connect({ port: port}, function() {
			connection.write(resp.encode_redis(command))
		})

		connection.on('data', function(data) {
			var offset = 0

			while (offset < data.length)
			{
				offset = resp.parse(data, offset, parserState)

				if ('completeType' in parserState)
				{
					assert.equal(parserState.completeType, "OK")

					parserState = {}
					done()
				}
			}
		})
	})
	it('should get objects', function(done) {
		var command = [ "get", "unittest" ]
		var parserState = {}

		var connection = net.connect({ port: port}, function() {
			connection.write(resp.encode_redis(command))
		})

		connection.on('data', function(data) {
			var offset = 0

			while (offset < data.length)
			{
				offset = resp.parse(data, offset, parserState)

				if ('completeType' in parserState)
				{
					assert.equal(parserState.completeType, value)

					parserState = {}
					done()
				}
			}
		})
	})
	it('should recover if the connection dies')
})
