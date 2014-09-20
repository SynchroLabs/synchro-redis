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

	beforeEach(function(done) {
		server = new RedisServer.RedisServer(function() {
			client = new RedisClient.RedisClient({ port: server.server.address().port })
			done()
		})
	})

	afterEach(function() {
		server.close()
		server = null
	})

	it('should authenticate')
	it('should set and get objects', function(done) {
		client.set("unittest", value, function(response) {
			assert.equal(response.response, "OK")
			client.get("unittest", function(response) {
				assert.equal(response.response.toString(), value)
				done()
			})
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
		client.set("unittest", value, function(response) {
			assert.equal(response.response, "OK")

			server.explodeOnCommand = true

			client.get("unittest", function(response) {
				assert.equal(response.errorString, "Timed out while waiting for response")
				server.explodeOnCommand = false

				client.get("unittest", function(response) {
					assert.equal(response.response.toString(), value)
					done()
				})
			})
		})
	})
})
