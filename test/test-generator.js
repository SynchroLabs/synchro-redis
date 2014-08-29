var assert = require('assert')
var resp = require('../resp')

describe('RESP generator', function() {
	it('should exist', function() {
		assert(resp.encode)
	})
	it('should generate simple strings', function() {
		assert.equal(resp.encode('a'), "+a\r\n")
	})
	it('should generate integers', function() {
		assert.equal(resp.encode(1234), ":1234\r\n")
	})
	it('should generate bulk strings')
	it('should generate arrays')
	describe('automatic type selection', function() {
		it('should use integer for Javascript number', function() {
			assert.equal(resp.encode(1234), ":1234\r\n")
		})
		it('should use bulk string for Javascript Buffer')
		it('should use simple string for Javascript string', function() {
			assert.equal(resp.encode('a'), "+a\r\n")
		})
		it('should use array for Javascript array')
	})
})
