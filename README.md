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

At this point, you will have a `Buffer` object that contains the exact on-the-wire
data to transmit to redis, which should be compatible with the normal
[`net.Socket.write`](http://nodejs.org/api/net.html#net_socket_write_data_encoding_callback)
function.

Parsing incoming data is a little trickier, since the data will come in potentially
irregular chunks. A chunk of data from the wire may have too little or too much
data in order to parse to a RESP object.

The Synchro RESP module will handle these cases. On each invocation of the
`resp.parse` function, it will return the offset of the next byte to use out of
the provided buffer (or `buffer.length` if all of the data was consumed).
Additionally, the `completeType` member of the state object will be present
when a complete RESP type has been parsed.

Note that `completeType` may not be set after an invocation (most likely due to
only partial data received). Also note that `completeType` may be set after an
invocation, but the returned offset is less than the buffer length (most likely
due to additional incoming RESP objects that straddled the network framing).

1. On the initial invocation of `resp.parse` supply an empty state object.
1. If, after invoking `resp.parse`, the `completeType` member is set in the state
   object, then do what you need to do with `completeType`, and supply an empty
   state object on the next invocation of `resp.parse`.
1. If, after invoking `resp.parse`, the offset returned is less than the buffer
   length, then provide this offset and buffer to the next invocation of
   `resp.parse`. Do this as many times as needed until the offset returned is
   the length of the buffer.

