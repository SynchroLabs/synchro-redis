var assert = require('assert')
var resp = require('../resp')

describe('RESP parser', function() {
	function parseFromBuffer(data)
	{
		var returnValue = {}
		var offset = resp.parse(data, 0, returnValue)
		assert('completeType' in returnValue)
		assert.equal(offset, data.length)
		return returnValue.completeType
	}

	function parseFromString(data)
	{
		return parseFromBuffer(new Buffer(data))
	}

	it('should exist', function() {
		assert(resp.parse)
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

		assert.equal(resp.parse(data, 0, returnValue), 4)
		assert.equal(returnValue.completeType, "a")

		// Second one is offset 4, return value is offset 8

		returnValue = {}
		assert.equal(resp.parse(data, 4, returnValue), 8)
		assert.equal(returnValue.completeType, "b")
	})

	it('should parse simple strings', function() {
		assert.equal(parseFromString("+a\r\n"), "a")
	})

	it('should parse errors', function() {
		var data = new Buffer("-ERR Sadness\r\n")
		var returnValue = {}

		resp.parse(data, 0, returnValue)
		assert.equal(returnValue.completeType, "ERR Sadness")
		assert.equal(returnValue.respType, resp.respTypes.Error)
	})

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

		it('should parse binary data bulk strings', function() {
			var binaryData = new Buffer(256)
			var finalBuffer = new Buffer(6 + 256 + 2)	// $256\r\n<256 bytes of data>\r\n

			for (var counter = 0;counter < binaryData.length;++counter)
			{
				binaryData[counter] = counter
			}

			finalBuffer.write("$256\r\n")
			binaryData.copy(finalBuffer, 6)
			finalBuffer.write("\r\n", 6 + 256)

			assert.deepEqual(parseFromBuffer(finalBuffer), binaryData)
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

