var assert = require('assert')

// http://redis.io/topics/protocol

function bufferIndexOf(buffer, value, offset)
{
	var value = value.charCodeAt(0)
	var returnValue = -1

	for (;offset < buffer.length;++offset)
	{
		if (buffer[offset] == value)
		{
			returnValue = offset
			break
		}
	}

	return returnValue
}

function respParse(data, offset, state)
{
	var dataType = data.toString('utf8', offset, offset + 1)

	switch (dataType)
	{
		case '$':
			// Bulk string
			// Figure out the length
			var len = parseInt(data.toString('utf8', 1 + offset, bufferIndexOf(data, '\r', offset)))
			offset = bufferIndexOf(data, '\n', offset) + 1
			// Now grab the string
			if (len > -1)
			{
				var end = bufferIndexOf(data, '\n', offset)
				state.completeType = data.toString('utf8', offset, end - 1)
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
			var len = parseInt(data.toString('utf8', 1 + offset, bufferIndexOf(data, '\r', offset)))
			state.completeType = (len == -1) ? null : []
			offset = bufferIndexOf(data, '\n', offset) + 1
			for (counter = 0;counter < len;++counter)
			{
				var newElement = {}
				offset = respParse(data, offset, newElement)
				state.completeType[counter] = newElement.completeType
			}
			break;

		default:
			var end = bufferIndexOf(data, '\n', offset)
			state.completeType = data.toString('utf8', 1 + offset, end - 1)
			offset = end + 1

			// Fix the type if it's a number

			if (dataType == ':')
			{
				state.completeType = parseInt(state.completeType)
			}
			break;
	}

	return offset
}

describe('RESP parser', function() {
	function parseFromBuffer(data)
	{
		var returnValue = {}
		var offset = respParse(data, 0, returnValue)
		assert('completeType' in returnValue)
		assert.equal(offset, data.length)
		return returnValue.completeType
	}

	function parseFromString(data)
	{
		return parseFromBuffer(new Buffer(data))
	}

	it('should exist', function() {
		assert(respParse)
	})

	it('should accept data from a Buffer')

	it('should accept data from a string', function() {
		assert.equal(parseFromString("+a\r\n"), "a")
	})

	it('should indicate when a type has been completely received')

	it('should indicate if there is data remaining to be processed', function() {
		var data = new Buffer("+a\r\n+b\r\n")
		var returnValue = {}

		// There are two string objects in the buffer, at offset 0 and
		// offset 4

		// First one is offset 0, return value is offset 4

		assert.equal(respParse(data, 0, returnValue), 4)
		assert.equal(returnValue.completeType, "a")

		// Second one is offset 4, return value is offset 8

		returnValue = {}
		assert.equal(respParse(data, 4, returnValue), 8)
		assert.equal(returnValue.completeType, "b")
	})

	it('should parse simple strings', function() {
		assert.equal(parseFromString("+a\r\n"), "a")
	})

	it('should parse errors')

	describe('integer handling', function() {
		it('should parse integers', function() {
			assert.equal(parseFromString(":1234\r\n"), 1234)
		})

		it('should make integers Javascript Numbers', function() {
			assert.equal(typeof(parseFromString(":1234\r\n")), "number")
		})
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

		it('should handle null elements in arrays', function() {
			assert.deepEqual(parseFromString("*2\r\n:1234\r\n$-1\r\n"), [1234, null])
		})
	})
})

