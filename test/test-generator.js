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
		it('should use bulk string for Javascript Buffer', function() {
			var binaryData = new Buffer(256)
			var finalBuffer = new Buffer(6 + 256 + 2)	// $256\r\n<256 bytes of data>\r\n

			for (var counter = 0;counter < binaryData.length;++counter)
			{
				binaryData[counter] = counter
			}

			finalBuffer.write("$256\r\n")
			binaryData.copy(finalBuffer, 6)
			finalBuffer.write("\r\n", 6 + 256)

			assert.deepEqual(resp.encode(binaryData), finalBuffer)
		})
		it('should use simple string for Javascript string', function() {
			assert.equal(resp.encode('a'), "+a\r\n")
		})
		it('should use array for Javascript array', function() {
			assert.equal(resp.encode([1234,'a']), "*2\r\n:1234\r\n+a\r\n")
		})
	})
})
