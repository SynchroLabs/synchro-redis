var net = require('net')
var resp = require('./resp')

function RedisClient(configuration)
{
	// http://stackoverflow.com/questions/11353277/what-is-the-proper-way-to-use-socket-io-callbacks-within-classes-in-node-js
	var client = this

	this.parserState = {}
	this.responseTimeout = 10
	this.callbacks = []
	this.timeouts = []
	this.pendingRequests = []
	this.connection = null
	this.pendingConnection = null
	this.configuration = configuration

	this.maybeCreateNewConnection = function()
	{
		if ((!this.connection) && (!this.pendingConnection))
		{
			client.pendingConnection = net.connect(client.configuration, function() {
				client.connection = client.pendingConnection
				client.pendingConnection = null
				client.connection.on('data', function(data) {
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
				client.maybeFlushPendingRequests()
			})
		}
	}

	this.sendCommand = function(params, callback)
	{
		this.callbacks.push(callback)
		this.timeouts.push(setTimeout(function() {
				client.connectionGoneBad()
				callback({ errorString: "Timed out while waiting for response" })
			}, this.responseTimeout))
		this.pendingRequests.push(resp.encode_redis(params))
		this.maybeCreateNewConnection()
		this.maybeFlushPendingRequests()
	}

	this.maybeFlushPendingRequests = function()
	{
		if (this.connection)
		{
			var arrayLength = this.pendingRequests.length
			for (var counter = 0;counter < arrayLength;++counter)
			{
				try
				{
					this.connection.write(this.pendingRequests[0])
					this.pendingRequests.shift()
				}
				catch (err)
				{
					// Connection must be crabby, shoot it
					this.connectionGoneBad()
					break
				}
			}
		}
	}

	this.connectionGoneBad = function()
	{
		this.connection = null
		this.callbacks = []
		this.timeouts = []
		this.maybeCreateNewConnection()
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
