
/*
AjaxIO v1.0.2
shout@bhittani.com

Copyright (c) 2014 M. Kamal Khan <http://bhittani.com/javascript/ajaxio/>

The MIT License (MIT)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
 */

(function() {
  var AjaxIOAjax, AjaxIOSocketIO;

  AjaxIOAjax = {
    open: false,
    onopen: function(cb) {
      this.open = true;
      if (typeof cb === 'function') {
        return cb();
      }
    },
    close: function(cb) {
      this.open = false;
      if (typeof cb === 'function') {
        return cb();
      }
    },
    parseXML: function(str) {
      var xml;
      if (window.DOMParser != null) {
        xml = new window.DOMParser();
        return xml.parseFromString(str.trim(), 'text/xml');
      } else if ((window.ActiveXObject != null) && (xml = new window.ActiveXObject('Microsoft.XMLDOM'))) {
        xml.async = 'false';
        xml.loadXML(str.trim());
        return xml;
      } else {
        throw {
          name: 'XML Parser not available',
          message: 'This browser does not support XML parsing.',
          toString: function() {
            return "" + this.name + ":" + this.message;
          }
        };
      }
    },
    parseJSON: function(str) {
      return JSON.parse(str.trim());
    },
    ajax: function(type, route, data, callback, poll, stopAtFirst) {
      var a, doPoll, e, key, q, search, val, x;
      if (!this.open) {
        return -1;
      }
      doPoll = true;
      if (window.XMLHttpRequest != null) {
        x = new XMLHttpRequest();
      }
      if (window.XMLHttpRequest == null) {
        x = new ActiveXObject('Microsoft.XMLHTTP');
      }
      x.onreadystatechange = (function(_this) {
        return function() {
          var cb, contentType, response, responseType, _i, _len, _ref, _ref1, _results;
          if (!_this.open) {
            x.abort();
            return -1;
          }
          if (x.readyState === 4) {
            response = x.response || x.responseText;
            if (!response) {
              return -1;
            }
            responseType = 'html';
            if (!_this.args.response) {
              contentType = (x.getResponseHeader('Content-Type')).toLowerCase();
            } else {
              contentType = _this.args.response.toLowerCase();
            }
            if (contentType.indexOf('json' > -1)) {
              response = _this.parseJSON(response);
              responseType = 'json';
            } else if (contentType.indexOf('xml' > -1)) {
              response = _this.parseXML(response);
              responseType = 'xml';
            }
            if ((200 >= (_ref = x.status) && _ref < 300) || x.status === 304) {
              if (x.responseText && stopAtFirst) {
                if (responseType === 'json') {
                  if (x.responseText !== '[]' && x.responseText !== '{}') {
                    doPoll = false;
                  }
                } else if (responseType === 'xml') {
                  if (x.responseText !== '') {
                    doPoll = false;
                  }
                } else if (x.responseText !== '') {
                  doPoll = false;
                }
              }
              if (callback && 'done' in callback) {
                _this.done(callback.done, response, x.statusText, x);
              }
            } else {
              if (callback && 'fail' in callback) {
                _this.fail(callback.fail, response, x.statusText, x);
              }
            }
            if (callback && 'always' in callback) {
              if (typeof callback === 'function') {
                return _this.always(callback.always, response, x.statusText, x);
              } else {
                if (poll && !doPoll) {
                  callback.always.splice(0, 1);
                }
                _ref1 = callback.always;
                _results = [];
                for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
                  cb = _ref1[_i];
                  _results.push(_this.always(cb, response, x.statusText, x));
                }
                return _results;
              }
            }
          }
        };
      })(this);
      q = [];
      q = (function() {
        var _results;
        _results = [];
        for (key in data) {
          val = data[key];
          val = typeof val === 'function' ? val() : val;
          _results.push("" + (encodeURIComponent(key)) + "=" + (encodeURIComponent(val)));
        }
        return _results;
      })();
      if (type === 'GET') {
        a = document.createElement('a');
        a.href = this.path;
        search = a.search !== '' ? '&' : '?';
        q = q.length ? search + q.join('&') : '';
        x.open(type, "" + this.path + route + q, true);
        x.timeout = this.args.timeout;
        try {
          x.send(null);
        } catch (_error) {
          e = _error;
        }
      } else if (type === 'POST') {
        x.open(type, "" + this.path + route, true);
        x.timeout = this.args.timeout;
        x.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        try {
          x.send(q.join('&'));
        } catch (_error) {
          e = _error;
        }
      }
      x.ontimeout = (function(_this) {
        return function() {
          if (callback && 'always' in callback) {
            if (callback !== 'function' && doPoll) {
              return _this.always(callback.always[0]);
            }
          }
        };
      })(this);
      return x;
    },
    done: function(callback, response, status, xhr) {
      if (typeof callback !== 'function') {
        throw {
          name: 'Invalid callback type',
          message: 'callback.done should be of type "function"',
          toString: function() {
            return "" + this.name + ":" + this.message;
          }
        };
      }
      return callback(response, status, xhr);
    },
    fail: function(callback, response, status, xhr) {
      if (typeof callback !== 'function') {
        throw {
          name: 'Invalid callback type',
          message: 'callback.fail should be of type "function"',
          toString: function() {
            return "" + this.name + ":" + this.message;
          }
        };
      }
      return callback(response, status, xhr);
    },
    always: function(callback, response, status, xhr) {
      if (typeof callback !== 'function') {
        throw {
          name: 'Invalid callback type',
          message: 'callback.always should be of type "function"',
          toString: function() {
            return "" + this.name + ":" + this.message;
          }
        };
      }
      return callback(response, status, xhr);
    },
    emit: function(route, data, callback) {
      if (callback == null) {
        callback = {};
      }
      if (typeof callback === 'function') {
        callback = {
          done: callback
        };
      }
      return this.ajax('POST', route, data, callback);
    },
    on: function(route, data, callback, poll, stopAtFirst) {
      var always;
      if (callback == null) {
        callback = {};
      }
      if (poll == null) {
        poll = 1000;
      }
      if (stopAtFirst == null) {
        stopAtFirst = false;
      }
      if (typeof callback === 'function') {
        callback = {
          done: callback
        };
      }
      if (poll === true) {
        poll = 1000;
      }
      always = [];
      if (poll) {
        always.push((function(_this) {
          return function() {
            return setTimeout(function() {
              return _this.ajax('GET', route, data, callback, true, stopAtFirst);
            }, poll);
          };
        })(this));
      }
      if (callback.always) {
        always.push(callback.always);
      }
      callback.always = always;
      return this.ajax('GET', route, data, callback, poll, stopAtFirst);
    }
  };

  AjaxIOSocketIO = {
    socket: null,
    onopen: function(cb) {
      var s;
      s = this.path;
      if (this.port) {
        s = "" + this.path + ":" + this.port;
      }
      this.socket = new io(s, {
        'forceNew': true
      });
      return this.socket.on('connect', function() {
        if (typeof cb === 'function') {
          return cb();
        }
      });
    },
    close: function(cb) {
      this.socket.close();
      this.socket = null;
      if (typeof cb === 'function') {
        return cb();
      }
    },
    emit: function(route, data, callback) {
      if (callback == null) {
        callback = {};
      }
      if (typeof callback === 'function') {
        callback = {
          done: callback
        };
      }
      this.socket.emit(route, data);
      if ((callback != null) && (callback.done != null)) {
        return callback.done();
      }
    },
    on: function(route, data, callback) {
      if (callback == null) {
        callback = {};
      }
      if (typeof callback === 'function') {
        callback = {
          done: callback
        };
      }
      return this.socket.on(route, function(response) {
        if ((callback != null) && (callback.done != null)) {
          return callback.done(response);
        }
      });
    }
  };

  window.AjaxIO = (function() {
    AjaxIO.include = function(obj) {
      var key, value, _ref;
      for (key in obj) {
        value = obj[key];
        if (key !== 'included') {
          this.prototype[key] = value;
        }
      }
      if ((_ref = obj.included) != null) {
        _ref.apply(this);
      }
      return this;
    };

    function AjaxIO(type, path, port_args) {
      this.type = type;
      this.path = path;
      if (type === 'ajax') {
        this.args = {
          response: null,
          timeout: 30000
        };
        if (port_args && 'response' in port_args) {
          this.args.response = port_args.response;
        }
        if (port_args && 'timeout' in port_args) {
          this.args.timeout = port_args.timeout;
        }
        AjaxIO.include(AjaxIOAjax);
      } else if (type === 'socket.io') {
        this.port = port_args || false;
        AjaxIO.include(AjaxIOSocketIO);
      } else {
        throw {
          name: 'Invalid connection type',
          message: 'type should either be "ajax" or "socket.io"',
          toString: function() {
            return "" + this.name + ":" + this.message;
          }
        };
      }
    }

    return AjaxIO;

  })();

}).call(this);

//# sourceMappingURL=ajaxio.js.map