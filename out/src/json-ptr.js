/* /// <reference path="../typings/index.d.ts" /> */
"use strict";
var es6_promise_1 = require("es6-promise");
var JsonPointer = (function () {
    function JsonPointer(ref) {
        this._keypath = (ref || "").split('/').slice(1).map(JsonPointer.unquote);
    }
    JsonPointer.unquote = function (s) {
        var result = s.replace(/~1/g, '/');
        result = result.replace(/~0/g, '~');
        return result;
    };
    JsonPointer.quote = function (s) {
        var result = s.replace(/~/g, '~0');
        result = result.replace(/\//g, '~1');
        return result;
    };
    JsonPointer.deref = function (o, k) {
        return o && o[k];
    };
    JsonPointer.prototype.getValue = function (obj) {
        return this._keypath.reduce(JsonPointer.deref, obj);
    };
    JsonPointer.prototype.asString = function () {
        return ([''].concat(this._keypath)).map(JsonPointer.quote).join('/');
    };
    Object.defineProperty(JsonPointer.prototype, "keys", {
        get: function () {
            return this._keypath;
        },
        enumerable: true,
        configurable: true
    });
    return JsonPointer;
}());
exports.JsonPointer = JsonPointer;
var JsonReference = (function () {
    function JsonReference(ref) {
        var filename = JsonReference.getFilename(ref);
        var pointer = (ref && ref.substring(filename.length + 1)) || "";
        this._pointer = new JsonPointer(decodeURIComponent(pointer));
        this._filename = filename;
    }
    JsonReference.getFilename = function (ref) {
        var filename = "";
        if (ref != null) {
            var hashPos = ref.indexOf('#');
            if (-1 != hashPos) {
                filename = ref.substring(0, hashPos);
            }
            else {
                filename = ref;
            }
        }
        return filename;
    };
    Object.defineProperty(JsonReference.prototype, "filename", {
        get: function () {
            return this._filename;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(JsonReference.prototype, "pointer", {
        get: function () {
            return this._pointer;
        },
        enumerable: true,
        configurable: true
    });
    return JsonReference;
}());
exports.JsonReference = JsonReference;
var JsonReferenceProcessor = (function () {
    function JsonReferenceProcessor(fetch) {
        this._fetch = fetch;
        this._cache = {};
        this._contents = {};
    }
    JsonReferenceProcessor.prototype.fetchRef = function (url) {
        var _this = this;
        var ref = new JsonReference(url);
        var contentPromise = this._fetchContent(ref.filename);
        return contentPromise
            .then(function (x) {
            //console.log("fetching refs for ", x, ref.filename);
            return _this._fetchRefs(x, ref.filename).then(function () { return x; });
        });
    };
    JsonReferenceProcessor.prototype.expandRef = function (url) {
        var _this = this;
        return this.fetchRef(url)
            .then(function (x) {
            // at this point all referenced files should be in _cache
            //console.log("expanding refs for ", x, ref.filename);
            return _this._expandRefs(url);
        });
    };
    JsonReferenceProcessor.prototype._expandRefs = function (url, base) {
        var ref = new JsonReference(url);
        var filename = this._adjustUrl(ref.filename, base);
        if (!filename) {
            throw new Error('invalid reference: no file');
        }
        if (!this._contents.hasOwnProperty(filename)) {
            throw new Error("file not found: " + filename);
        }
        var json = this._contents[filename];
        var obj = ref.pointer.getValue(json);
        return this._expandDynamic(obj, filename, base, []);
    };
    JsonReferenceProcessor.prototype._expandDynamic = function (obj, filename, base, keypath) {
        var _this = this;
        var url = this._adjustUrl(filename, base);
        if (obj && obj.hasOwnProperty && obj.hasOwnProperty("$ref")) {
            return this._expandRefs(obj["$ref"], url);
        }
        else {
            if (!obj) {
                var error = null;
                try {
                    throw new Error("here is a stacktrace");
                }
                catch (xx) {
                    error = xx;
                }
                console.log("expanding undefined? ", obj, filename, base, keypath, error.stack);
            }
        }
        var result = obj;
        if (typeof obj === 'object' && Array.isArray(obj)) {
            result = obj.map(function (x) { return _this._expandDynamic(x, url, null, keypath.slice()); });
        }
        else if (typeof obj === 'object') {
            result = {};
            var keys = Object.keys(obj);
            for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
                var k = keys_1[_i];
                //console.log("define property", k, result);
                Object.defineProperty(result, k, {
                    enumerable: true,
                    get: (function (obj, k) { return _this._expandDynamic(obj[k], url, null, keypath.concat([k])); }).bind(this, obj, k)
                });
            }
        }
        return result;
    };
    JsonReferenceProcessor.prototype._findRefs = function (x) {
        var queue = [];
        var result = [];
        //console.log('findRefs',x);
        queue.push(x);
        var _loop_1 = function() {
            var thisOne = queue.shift();
            //console.log('findRefs',thisOne);
            var ref = thisOne["$ref"];
            if (null != ref) {
                result.push(ref);
            }
            else if (typeof thisOne === 'object') {
                keys = Object.keys(thisOne);
                objs = keys.map(function (k) { return thisOne[k]; });
                queue.push.apply(queue, objs);
            }
        };
        var keys, objs;
        while (0 != queue.length) {
            _loop_1();
        }
        //console.log('findRefs done',x, result);
        return result;
    };
    JsonReferenceProcessor.prototype._fetchContent = function (urlArg, base) {
        var _this = this;
        var url = this._adjustUrl(urlArg, base);
        if (this._cache.hasOwnProperty(url)) {
            return this._cache[url];
        }
        var result = this._fetch(url).then(function (x) { return JSON.parse(x); });
        this._cache[url] = result;
        result.then(function (x) { return (_this._contents[url] = x, x); });
        return result;
    };
    JsonReferenceProcessor.prototype._adjustUrl = function (url, base) {
        return this._urlAdjuster(base)(url);
    };
    JsonReferenceProcessor.prototype._urlAdjuster = function (base) {
        if (null != base) {
            var hashPos = base.indexOf('#');
            if (hashPos == -1) {
                hashPos = base.length;
            }
            var slashPos = base.lastIndexOf('/', hashPos);
            if (-1 != slashPos) {
                var prefix = base.substring(0, slashPos + 1);
                return function (x) {
                    if (null == x || 0 === x.length || '/' === x.substring(0, 1)) {
                        return x;
                    }
                    return prefix + x;
                };
            }
        }
        return function (x) { return x; };
    };
    JsonReferenceProcessor.prototype._fetchRefs = function (x, base) {
        var _this = this;
        var adjuster = this._urlAdjuster(base);
        var refs = this._findRefs(x);
        //console.log("found refs ", refs);
        var files = refs.map(function (x) { return adjuster(JsonReference.getFilename(x)); });
        var filesHash = files.reduce(function (c, f) { c[f] = f; return c; }, {});
        files = Object.keys(filesHash);
        //console.log("found files ", refs, files, " fetching ...");
        var needThen = false;
        var filesPromises = files.map(function (x) {
            if (_this._contents.hasOwnProperty(x)) {
                return _this._contents[x];
            }
            else {
                needThen = true;
                return _this._fetchContent(x);
            }
        });
        //console.log("got promises ", filesPromises);
        var promise = es6_promise_1.Promise.all(filesPromises);
        if (needThen) {
            return promise.then(this._fetchRefsAll.bind(this, files));
        }
        return promise;
    };
    JsonReferenceProcessor.prototype._fetchRefsAll = function (files, x) {
        var result = [];
        for (var i = 0, n = x.length; i < n; ++i) {
            result.push(this._fetchRefs(x[i], files[i]));
        }
        return es6_promise_1.Promise.all(result);
    };
    return JsonReferenceProcessor;
}());
exports.JsonReferenceProcessor = JsonReferenceProcessor;
//# sourceMappingURL=json-ptr.js.map