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

