var assert = require('assert')
var resp = require('../resp')
var net = require('net')
var RedisServer = require('./RedisServer')
var RedisClient = require('../RedisClient')

// http://lostechies.com/derickbailey/2012/08/17/asynchronous-unit-tests-with-mocha-promises-and-winjs/

describe('Redis client', function() {
	var value = new Date().toString()
	var server = null
	var client = null

	before(function(done) {
		server = new RedisServer.RedisServer(function() {
			client = new RedisClient.RedisClient({ port: server.server.address().port })
			done()
		})
	})

	it('should authenticate')
	it('should set objects', function(done) {
		client.set("unittest", value, function(response) {
			assert.equal(response.response, "OK")
			done()
		})
	})
	it('should get objects', function(done) {
		client.get("unittest", function(response) {
			assert.equal(response.response, value)
			done()
		})
	})
	it('should notify callers if a response is not received within a timeout period', function(done) {
		server.explodeOnCommand = true

		client.get("unittest", function(response) {
			assert.equal(response.errorString, "Timed out while waiting for response")
			done()
		})
	})
	it('should recover after a request fails', function(done) {
		client.get("unittest", function(response) {
			assert.equal(response.errorString, "Timed out while waiting for response")
			server.explodeOnCommand = false

			client.set("unittest", value, function(response) {
				assert.equal(response.response, "OK")
				done()
			})
		})
	})
})
