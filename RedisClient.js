var net = require('net')
var resp = require('./resp')

function RedisClient(configuration)
{
	// http://stackoverflow.com/questions/11353277/what-is-the-proper-way-to-use-socket-io-callbacks-within-classes-in-node-js
	var client = this

	this.connection = net.connect(configuration)
	this.parserState = {}
	this.responseTimeout = 10
	this.callbacks = []
	this.timeouts = []

	this.connection.on('data', function(data) {
		var offset = 0

		while (offset < data.length)
		{
			offset = resp.parse(data, offset, client.parserState)

			if ('completeType' in client.parserState)
			{
				var callback = client.callbacks.shift()
				clearTimeout(client.timeouts.shift())

				callback({ response: client.parserState.completeType })

				client.parserState = {}
			}
		}
	})

	this.sendCommand = function(params, callback)
	{
		this.callbacks.push(callback)
		this.timeouts.push(setTimeout(callback, this.responseTimeout, { errorString: "Timed out while waiting for response" }))
		this.connection.write(resp.encode_redis(params))
	}

	this.set = function(key, value, callback)
	{
		this.sendCommand(["set", key, value], callback)
	}

	this.get = function(key, callback)
	{
		this.sendCommand(["get", key], callback)
	}
}

exports.RedisClient = RedisClient
