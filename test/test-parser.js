var assert = require('assert')

// http://redis.io/topics/protocol

describe('Parser', function() {
	it('should exist', function() {
		assert(Parser)
	})

	it('should parse simple strings', function() {
		assert(false)
	})

	it('should parse errors', function() {
		assert(false)
	})

	it('should parse integers', function() {
		assert(false)
	})

	describe('bulk string handling', function() {
		it('should parse bulk strings', function() {
			assert(false)
		})
		it('should parse empty bulk strings', function() {
			assert(false)
		})
		it('should parse null bulk strings', function() {
			assert(false)
		})
	})

	describe('array handling', function() {
		it('should parse arrays', function() {
			assert(false)
		})
		it('should parse empty arrays', function() {
			assert(false)
		})
		it('should parse null arrays', function() {
			assert(false)
		})
		it('should handle null elements in arrays', function() {
			assert(false)
		})
	})
})

