AjaxIO
=========

Seamless socket.io and ajax long polling fallback.

AjaxIO allows seamless alteration between socket.io and ajax long polling
while maintaining a single codebase (frontend javascript).
P.S. jQuery is not required.

# Setup

```
<!-- load socket.io - this should be loaded before ajaxio -->
<script src="socket.io-1.0.6.js"></script>
<!-- load ajaxio -->
<script src="ajaxio.min.js"></script>
```

# Usage

## Instantiate
* Ajax
```
/*
 * @param  string - ajax || socket.io
 * @param  string Path to server side ajax response/script
 * @param  object Optional arguments
 * @return object Connection
 */
var connection = new AjaxIO('ajax', 'ajax.php', {
    response : 'json', // default response type is json.
    timeout  : 30000   // default timeout is 30 seconds.
});
```

* Socket.IO
```
/*
 * @param  string - ajax || socket.io
 * @param  string Path to socket.io server/host
 * @param  int    Port [3000]
 * @return object Connection
 */
var connection = new AjaxIO('socket.io', 'http://127.0.0.1', 3000);
```

## Sending

Example
```
// Proceed after we establish a connection.
connection.onopen(function(){
    console.log('Connection Established');
    /*
     * Send data/message
     *
     * @param string   Route. For ajax, this will be appended to the url.
     * @param object   Key value bindings. For ajax, this will be a POST
     * @param function Callback. Only for AJAX.
     *                 For socket.io, this will be ignored.
     *                 May be included for socket in future.
     */
    connection.emit('route', {foo: 'bar'}, function(response){
        console.log('Sent: ' + JSON.stringify({foo: 'bar'}));
    });
    /*
     * Send data/message
     *
     * @param string   Route. For ajax, this will be appended to the url.
     *                 Long polling for AJAX as GET request.
     * @param object   Key value bindings (GET params).
     *                 Only for AJAX. For socket.io, this will be ignored.
     * @param function Callback.
     * @param int      Poll interval after successful request.
     *                 Default: 1000ms (1 second).
     *                 Only for AJAX. For socket.io, this will be ignored.
     * @param bool     Stop after first successful request?
     *                 Default: false.
     *                 Only for AJAX. For socket.io, this will be ignored.
     */
    connection.on('route', {}, function(response){
        console.log('Received: ' + JSON.stringify(response));
        connection.close(function(){
            console.log('Connection Closed');
        });
    });
});
```

# Release History

* 1.0.0 Initial release

# License

[The MIT License](http://opensource.org/licenses/MIT)