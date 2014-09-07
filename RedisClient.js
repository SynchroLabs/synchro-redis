var net = require('net')
var resp = require('./resp')

function RedisClient(configuration)
{
	// http://stackoverflow.com/questions/11353277/what-is-the-proper-way-to-use-socket-io-callbacks-within-classes-in-node-js
	var client = this

	this.connection = net.connect(configuration)
	this.parserState = {}

	this.connection.on('data', function(data) {
		var offset = 0

		while (offset < data.length)
		{
			offset = resp.parse(data, offset, client.parserState)

			if ('completeType' in client.parserState)
			{
				client.currentCallback(client.parserState.completeType)

				client.parserState = {}
			}
		}
	})

	this.set = function(key, value, callback)
	{
		this.currentCallback = callback
		this.connection.write(resp.encode_redis(["set", key, value]))
	}

	this.get = function(key, callback)
	{
		this.currentCallback = callback
		this.connection.write(resp.encode_redis(["get", key]))
	}
}

exports.RedisClient = RedisClient
