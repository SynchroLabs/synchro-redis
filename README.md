Intended to be our own replacement for accessing redis from node.js

Currently implements parsing and encoding of the [RESP protocol](http://redis.io/topics/protocol)

Combining this with connection management and retries and other stuff is the
ultimate goal.

To generate a redis-compatible command (such as PUT), simply call encode_redis
with a Javascript array:

```Javascript
> var resp = require('./resp')
undefined
> var session = { id: "sessionuuid" }
undefined
> var transmit_buffer = resp.encode_redis(["SET", session.id, session])
undefined
> transmit_buffer.toString()
'*3\r\n$3\r\nSET\r\n$11\r\nsessionuuid\r\n$20\r\n{"id":"sessionuuid"}\r\n'
> 
```

