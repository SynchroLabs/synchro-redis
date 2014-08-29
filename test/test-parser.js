var assert = require('assert')

// http://redis.io/topics/protocol

function respParse(data, state)
{
	switch (data[0])
	{
		case '$':
			// Bulk string
			// Figure out the length
			len = parseInt(data.substring(1, data.indexOf('\r')))
			// Now grab the string
			state.completeType = (len == -1) ? null : data.substring(data.indexOf('\n') + 1, data.indexOf('\n') + 1 + len)
			break;

		case '*':
			// Array
			// Figure out the length
			len = parseInt(data.substring(1, data.indexOf('\r')))
			state.completeType = (len == -1) ? null : []
			break;

		default:
			state.completeType = data.substring(1, data.length - 2)
			break;
	}
}

describe('RESP parser', function() {
	function parseFromString(data)
	{
		returnValue = {}
		respParse(data, returnValue)
		assert('completeType' in returnValue)
		return returnValue.completeType
	}

	it('should exist', function() {
		assert(respParse)
	})

	it('should accept data from a Buffer')

	it('should accept data from a string', function() {
		assert.equal(parseFromString("+a\r\n"), "a")
	})

	it('should indicate when a type has been completely received')

	it('should indicate if there is data remaining to be processed')

	it('should parse simple strings', function() {
		assert.equal(parseFromString("+a\r\n"), "a")
	})

	it('should parse errors')

	it('should parse integers', function() {
		assert.equal(parseFromString(":1234\r\n"), 1234)
	})

	describe('bulk string handling', function() {
		it('should parse bulk strings', function() {
			assert.equal(parseFromString("$1\r\na\r\n"), "a")
		})

		it('should parse empty bulk strings', function() {
			assert.equal(parseFromString("$0\r\n\r\n"), "")
		})

		it('should parse null bulk strings', function() {
			assert.equal(parseFromString("$-1\r\n"), null)
		})
	})

	describe('array handling', function() {
		it('should parse arrays')

		it('should parse empty arrays', function() {
			assert.deepEqual(parseFromString("*0\r\n"), [])
		})

		it('should parse null arrays', function() {
			assert.equal(parseFromString("*-1\r\n"), null)
		})

		it('should handle null elements in arrays')
	})
})

