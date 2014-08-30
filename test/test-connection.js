var net = require('net')

// http://lostechies.com/derickbailey/2012/08/17/asynchronous-unit-tests-with-mocha-promises-and-winjs/

describe('Redis connection', function() {
	it('should connect', function(done) {
		var connection = net.connect({ port: 6379}, function() {
			done()
		})
	})
	it('should authenticate')
	it('should set objects')
	it('should get objects')
	it('should recover if the connection dies')
})
