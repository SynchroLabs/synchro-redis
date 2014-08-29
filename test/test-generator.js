var assert = require('assert')
var resp = require('../resp')

describe('RESP generator', function() {
	it('should exist')
	it('should generate simple strings')
	it('should generate integers')
	it('should generate bulk strings')
	it('should generate arrays')
	describe('automatic type selection', function() {
		it('should use integer for Javascript number')
		it('should use bulk string for Javascript Buffer')
		it('should use simple string for Javascript string')
		it('should use array for Javascript array')
	})
})
