var assert = require('assert')

// http://redis.io/topics/protocol

function respParse(data, offset, state)
{
	switch (data[offset])
	{
		case '$':
			// Bulk string
			// Figure out the length
			len = parseInt(data.substring(1 + offset, data.indexOf('\r', offset)))
			offset = data.indexOf('\n', offset) + 1
			// Now grab the string
			if (len > -1)
			{
				end = data.indexOf('\n', offset)
				state.completeType = data.substring(offset, end - 1)
				offset = end + 1
			}
			else
			{
				state.completeType = null
			}
			break;

		case '*':
			// Array
			// Figure out the length
			len = parseInt(data.substring(1 + offset, data.indexOf('\r', offset)))
			state.completeType = (len == -1) ? null : []
			offset = data.indexOf('\n', offset) + 1
			if (len > 0)
			{
				for (counter = 0;counter < len;++counter)
				{
					newElement = {}
					offset = respParse(data, offset, newElement)
					state.completeType[counter] = newElement.completeType
				}
			}
			break;

		default:
			end = data.indexOf('\n', offset)
			state.completeType = data.substring(1 + offset, end - 1)
			offset = end + 1
			break;
	}
	return offset
}

describe('RESP parser', function() {
	function parseFromString(data)
	{
		returnValue = {}
		offset = respParse(data, 0, returnValue)
		assert('completeType' in returnValue)
		assert.equal(offset, data.length)
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
		it('should parse arrays', function() {
			assert.deepEqual(parseFromString("*2\r\n:1234\r\n+a\r\n"), [1234, "a"])
		})

		it('should parse empty arrays', function() {
			assert.deepEqual(parseFromString("*0\r\n"), [])
		})

		it('should parse null arrays', function() {
			assert.equal(parseFromString("*-1\r\n"), null)
		})

		it('should handle null elements in arrays')
	})
})

