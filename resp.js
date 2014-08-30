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

function parseGuaranteedOneElement(data, offset, state)
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
				offset = parseGuaranteedOneElement(data, offset, newElement)
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

var parsingState =
{
	Initial : 0,
	EatingUntilCR : 1,
	EatLF : 2,
	ParsingBulkStringLength : 3,
	ParsingBulkStringLengthEatLF : 4,
	ParsingBulkStringContents : 5,
	ParsingBulkStringContentsEatCR : 6,
	ParsingBulkStringContentsEatLF : 7,
}

exports.parse = function (data, offset, state)
{
	if (!state.parsingState)
	{
		state.parsingState = parsingState.Initial
	}

	var stop = false

	for (;((offset < data.length) && (!stop));++offset)
	{
		var thisByte = data[offset];
		var thisByteAsString = String.fromCharCode(thisByte)

		switch (state.parsingState)
		{
			case parsingState.Initial:
				state.respType = thisByteAsString
				state.composingEntity = ""

				if (thisByteAsString == respTypes.BulkString)
				{
					state.bulkStringLength = 0
					state.bulkStringLengthSign = null
					state.parsingState = parsingState.ParsingBulkStringLength;
				}
				else
				{
					state.parsingState = parsingState.EatingUntilCR
				}
				break;

			case parsingState.EatingUntilCR:
				if (thisByteAsString == '\r')
				{
					state.parsingState = parsingState.EatLF
				}
				else
				{
					state.composingEntity += thisByteAsString
				}
				break;

			case parsingState.EatLF:
				if (state.respType == respTypes.Integer)
				{
					state.completeType = parseInt(state.composingEntity)
				}
				else
				{
					state.completeType = state.composingEntity
				}
				stop = true
				break;

			case parsingState.ParsingBulkStringLength:
				if (thisByteAsString == '\r')
				{
					state.parsingState = parsingState.ParsingBulkStringLengthEatLF
					state.bulkStringLength *= state.bulkStringLengthSign
				}
				else
				{
					if (!state.bulkStringLengthSign)
					{
						state.bulkStringLengthSign = (thisByteAsString == '-') ? -1 : +1
					}

					if (thisByteAsString != '-')
					{
						state.bulkStringLength *= 10
						state.bulkStringLength += parseInt(thisByteAsString)
					}
				}
				break;

			case parsingState.ParsingBulkStringLengthEatLF:
				if (state.bulkStringLength == -1)
				{
					state.completeType = null
					stop = true
				}
				else
				{
					if (state.bulkStringLength > 0)
					{
						state.parsingState = parsingState.ParsingBulkStringContents
					}
					else
					{
						state.parsingState = parsingState.ParsingBulkStringContentsEatCR
					}
					state.bulkStringBufferOffset = 0
					state.bulkStringBuffer = new Buffer(state.bulkStringLength)
				}
				break;

			case parsingState.ParsingBulkStringContents:
				state.bulkStringBuffer.writeUInt8(thisByte, state.bulkStringBufferOffset)
				++state.bulkStringBufferOffset
				if (state.bulkStringBufferOffset >= state.bulkStringLength)
				{
					state.parsingState = parsingState.ParsingBulkStringContentsEatCR
				}
				break;

			case parsingState.ParsingBulkStringContentsEatCR:
				state.parsingState = parsingState.ParsingBulkStringContentsEatLF
				break;

			case parsingState.ParsingBulkStringContentsEatLF:
				state.completeType = state.bulkStringBuffer;
				stop = true
				break;
		}
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

