AjaxIOAjax =

    open : off

    onopen : (cb) ->
        @open = on
        if typeof cb is 'function' then cb()

    close : (cb) ->
        @open = off
        if typeof cb is 'function' then cb()

    parseXML : (str) ->
        if window.DOMParser?
            xml = new window.DOMParser()
            xml.parseFromString str.trim(), 'text/xml'
        else if window.ActiveXObject? and (xml = new window.ActiveXObject 'Microsoft.XMLDOM')
            xml.async = 'false'
            xml.loadXML str.trim()
            xml
        else
            throw
                name     : 'XML Parser not available'
                message  : 'This browser does not support XML parsing.'
                toString : -> "#{@name}:#{@message}"

    parseJSON : (str) ->
        JSON.parse str.trim()


    ajax : (type, route, data, callback, poll, stopAtFirst) ->
        if not @open then return -1
        doPoll = true
        x = new XMLHttpRequest() if window.XMLHttpRequest?
        x = new ActiveXObject 'Microsoft.XMLHTTP' if not window.XMLHttpRequest?
        x.timeout = @args.timeout
        x.onreadystatechange = =>
            if not @open
                x.abort()
                return -1
            if x.readyState is 4
                response = x.response || x.responseText
                if not response then return -1
                responseType = 'html'
                if not @args.response
                    contentType = (x.getResponseHeader 'Content-Type').toLowerCase()
                else
                    contentType = @args.response.toLowerCase()
                if contentType.indexOf 'json' > -1
                    response = @parseJSON response
                    responseType = 'json'
                else if contentType.indexOf 'xml' > -1
                    response = @parseXML response
                    responseType = 'xml'

                if 200 >= x.status < 300 or x.status is 304
                    # done
                    if x.responseText and stopAtFirst
                        if responseType is 'json'
                            if x.responseText isnt '[]' and x.responseText isnt '{}'
                                doPoll = false
                        else if responseType is 'xml'
                            if x.responseText isnt ''
                                doPoll = false
                        else if x.responseText isnt ''
                            doPoll = false
                    if callback and 'done' of callback
                        @done callback.done, response, x.statusText, x
                else
                    #fail
                    if callback and 'fail' of callback
                        @fail callback.fail, response, x.statusText, x
                #always
                if callback and 'always' of callback
                    if typeof callback is 'function'
                        @always callback.always, response, x.statusText, x
                    else
                        if poll and not doPoll
                            callback.always.splice 0, 1
                        for cb in callback.always
                            @always cb, response, x.statusText, x
        q = []
        q = for key, val of data
            val = if typeof val is 'function' then val() else val
            "#{encodeURIComponent key}=#{encodeURIComponent val}"

        if type is 'GET'
            a = document.createElement 'a'
            a.href = @path
            search = if a.search isnt '' then '&' else '?'
            q = if q.length then search + q.join '&' else ''
            x.open type, "#{@path}#{route}#{q}", true
            try
                x.send null
            catch e
                #
        else if type is 'POST'
            x.open type, "#{@path}#{route}", true
            x.setRequestHeader 'Content-type', 'application/x-www-form-urlencoded'
            try
                x.send q.join '&'
            catch e
                #
        x.ontimeout = =>
            if callback and 'always' of callback
                if callback isnt 'function' and doPoll
                    @always callback.always[0]
        x

    done : (callback, response, status, xhr) ->
        if typeof callback isnt 'function'
            throw
                name     : 'Invalid callback type'
                message  : 'callback.done should be of type "function"'
                toString : -> "#{@name}:#{@message}"
        callback response, status, xhr

    fail : (callback, response, status, xhr) ->
        if typeof callback isnt 'function'
            throw
                name     : 'Invalid callback type'
                message  : 'callback.fail should be of type "function"'
                toString : -> "#{@name}:#{@message}"
        callback response, status, xhr

    always : (callback, response, status, xhr) ->
        if typeof callback isnt 'function'
            throw
                name     : 'Invalid callback type'
                message  : 'callback.always should be of type "function"'
                toString : -> "#{@name}:#{@message}"
        callback response, status, xhr

    # e.g. route = welcome
    # e.g. callback = {done : function(){}, fail : function(){}, always: function(){}}
    emit : (route, data, callback = {}) ->
        if typeof callback is 'function'
            callback =
                done : callback
        @ajax 'POST', route, data, callback

    on : (route, data, callback = {}, poll = 1000, stopAtFirst = false) ->
        if typeof callback is 'function'
            callback =
                done : callback
        if poll is true
            poll = 1000
        always = []
        if poll
            always.push =>
                setTimeout =>
                    @ajax 'GET', route, data, callback, true, stopAtFirst
                , poll
        if callback.always
            always.push callback.always
        callback.always = always
        @ajax 'GET', route, data, callback, poll, stopAtFirst


AjaxIOSocketIO =

    socket : null

    onopen : (cb) ->
        @socket = new io "#{@path}:#{@port}"
        @socket.on 'connect', ->
            if typeof cb is 'function' then cb()



    close : (cb) ->
        @socket.close()
        @socket = null
        if typeof cb is 'function' then cb()

    emit : (route, data, callback = {}) ->
        if typeof callback is 'function'
            callback =
                done : callback
        @socket.emit route, data
        callback.done() if callback? and callback.done?

    on : (route, data, callback = {}) ->
        if typeof callback is 'function'
            callback =
                done : callback
        @socket.on route, (response) ->
            callback.done response  if callback? and callback.done?

class window.AjaxIO

    @include : (obj) ->
        for key, value of obj when key not in ['included']
            @::[key] = value
        obj.included?.apply @
        @

    constructor: (type, path, port_args) ->
        @type = type
        @path = path

        if type is 'ajax'
            @args =
                response : null
                timeout : 30000
            @args.response = port_args.response if port_args and 'response' of port_args
            @args.timeout = port_args.timeout if port_args and 'timeout' of port_args
            AjaxIO.include AjaxIOAjax
        else if type is 'socket.io'
            @port = port_args || 3000
            AjaxIO.include AjaxIOSocketIO
        else
            throw
                name     : 'Invalid connection type'
                message  : 'type should be either "ajax" or "socket.io"'
                toString : -> "#{@name}:#{@message}"
