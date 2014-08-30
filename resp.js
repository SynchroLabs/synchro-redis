// http://redis.io/topics/protocol

var respTypes = {
	SimpleString : '+',
	Error : '-',
	Integer : ':',
	BulkString : '$',
	Array : '*',
}

exports.respTypes = respTypes

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

exports.parse = function(data, offset, state)
{
	var dataType = data.toString('utf8', offset, offset + 1)

	state.respType = dataType

	switch (dataType)
	{
		case respTypes.BulkString:
			// Bulk string
			// Figure out the length
			var len = parseInt(data.toString('utf8', 1 + offset, bufferIndexOf(data, '\r', offset)))
			offset = bufferIndexOf(data, '\n', offset) + 1
			// Now grab the string
			if (len > -1)
			{
				var end = offset + len + 1
				state.completeType = data.slice(offset, end - 1)
				offset = end + 1
			}
			else
			{
				state.completeType = null
			}
			break;

		case respTypes.Array:
			// Array
			// Figure out the length
			var len = parseInt(data.toString('utf8', 1 + offset, bufferIndexOf(data, '\r', offset)))
			state.completeType = (len == -1) ? null : []
			offset = bufferIndexOf(data, '\n', offset) + 1
			for (counter = 0;counter < len;++counter)
			{
				var newElement = {}
				offset = exports.parse(data, offset, newElement)
				state.completeType[counter] = newElement.completeType
			}
			break;

		default:
			var end = bufferIndexOf(data, '\n', offset)
			state.completeType = data.toString('utf8', 1 + offset, end - 1)
			offset = end + 1

			// Fix the type if it's an integer

			if (dataType == respTypes.Integer)
			{
				state.completeType = parseInt(state.completeType)
			}
			break;
	}

	return offset
}

var javascriptTypeToRespType =
{
	Buffer : respTypes.BulkString,
	number : respTypes.Integer,
	Array : respTypes.Array,
	default : respTypes.SimpleString,
}

exports.encode = function(value)
{
	var valueType = typeof(value)
	var returnValue

	if (valueType == "object")
	{
		if (value instanceof Buffer)
		{
			valueType = "Buffer"
		}
		else if (value instanceof Array)
		{
			valueType = "Array"
		}
	}

	var prefix = javascriptTypeToRespType[valueType] || javascriptTypeToRespType["default"]

	switch (prefix)
	{
		case respTypes.BulkString:
			var lengthString = value.length.toString()
			var crlf = '\r\n'
			var offset = 0

			returnValue = new Buffer(respTypes.BulkString.length + lengthString.length + crlf.length + value.length + crlf.length)

			returnValue.write(respTypes.BulkString, offset)
			offset += respTypes.BulkString.length

			returnValue.write(lengthString, offset)
			offset += lengthString.length

			returnValue.write(crlf, offset)
			offset += crlf.length

			value.copy(returnValue, offset)
			offset += value.length

			returnValue.write(crlf, offset)
			offset += crlf.length
			break;

		case respTypes.Array:
			var arrayLengthString = value.length.toString()
			var crlf = '\r\n'
			var offset = 0
			var elementBuffers = []
			var totalElementsLength = 0

			for (var counter = 0;counter < value.length;++counter)
			{
				var thisElementBuffer = exports.encode(value[counter])

				totalElementsLength += thisElementBuffer.length
				elementBuffers.push(thisElementBuffer)
			}

			returnValue = new Buffer(respTypes.Array.length + arrayLengthString.length + crlf.length + totalElementsLength)

			returnValue.write(respTypes.Array, offset)
			offset += respTypes.BulkString.length

			returnValue.write(arrayLengthString, offset)
			offset += arrayLengthString.length

			returnValue.write(crlf, offset)
			offset += crlf.length

			for (var counter = 0;counter < elementBuffers.length;++counter)
			{
				elementBuffers[counter].copy(returnValue, offset)
				offset += elementBuffers[counter].length
			}
			break;

		default:
			returnValue = new Buffer(prefix + value + '\r\n')
			break;
	}

	return returnValue
}

