var RedisClient = require('./RedisClient')

var client = new RedisClient.RedisClient({ port: 6379 })

var key = "unittest"
var value = new Date().toString()

console.log("setting " + key + " to " + value)

client.set(key, value, function(response) {
	console.log("set response = " + JSON.stringify(response))

	client.get("unittest", function(getresponse) {
		console.log("get response = " + JSON.stringify(getresponse))
		console.log("getresponse.response.toString() = " + getresponse.response.toString())

		client.close()
	})
})
