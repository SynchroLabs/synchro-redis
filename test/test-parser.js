var assert = require('assert')

// http://redis.io/topics/protocol

function respParse(data, state)
{
	state.completeType = data.substring(1, data.length - 2)
}

describe('RESP parser', function() {
	function parseFromString(data)
	{
		returnValue = {}
		respParse(data, returnValue)
		assert(returnValue.completeType)
		return returnValue.completeType
	}

	it('should exist', function() {
		assert(respParse)
	})

	it('should accept data from a Buffer')

	it('should accept data from a string')

	it('should indicate when a type has been completely received')

	it('should indicate if there is data remaining to be processed')

	it('should parse simple strings', function() {
		assert.equal(parseFromString("+a\r\n"), "a")
	})

	it('should parse errors')

	it('should parse integers')

	describe('bulk string handling', function() {
		it('should parse bulk strings')

		it('should parse empty bulk strings')

		it('should parse null bulk strings')
	})

	describe('array handling', function() {
		it('should parse arrays')

		it('should parse empty arrays')

		it('should parse null arrays')

		it('should handle null elements in arrays')
	})
})

