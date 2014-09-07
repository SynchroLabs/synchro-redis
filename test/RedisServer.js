var net = require('net')
var resp = require('../resp')

function RedisServer(running)
{
	var objects = {}

	this.server = net.createServer(function(connection) {
		var parserState = {}

		connection.on('data', function(data) {
			var offset = 0

		    	while (offset < data.length)
			{
				offset = resp.parse(data, offset, parserState)

				if ('completeType' in parserState)
				{
					var returnData = ""

					switch (parserState.completeType[0].toString())
					{
						case "set":
							objects[parserState.completeType[1]] = parserState.completeType[2]
							returnData = "OK"
							break;

						case "get":
							returnData = objects[parserState.completeType[1]]
							break;
					}

			    		parserState = {}

					connection.write(resp.encode_redis(returnData))
				}
		    	}			
		})
	})
	this.server.listen(0, running)
}

exports.RedisServer = RedisServer

