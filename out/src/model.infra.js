"use strict";
var ModelParseMessage = (function () {
    function ModelParseMessage(isError, path, msg, code) {
        var args = [];
        for (var _i = 4; _i < arguments.length; _i++) {
            args[_i - 4] = arguments[_i];
        }
        this._path = path;
        this._msg = msg;
        this._code = code;
        this._args = args;
        this._isError = isError;
    }
    Object.defineProperty(ModelParseMessage.prototype, "path", {
        get: function () { return this._path; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ModelParseMessage.prototype, "msg", {
        get: function () { return this._msg; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ModelParseMessage.prototype, "code", {
        get: function () { return this._code; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ModelParseMessage.prototype, "args", {
        get: function () { return this._args; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ModelParseMessage.prototype, "isError", {
        get: function () { return this._isError; },
        enumerable: true,
        configurable: true
    });
    return ModelParseMessage;
}());
exports.ModelParseMessage = ModelParseMessage;
var ObjectTraversal = (function () {
    function ObjectTraversal(obj) {
        this._top = obj;
        this._stack = [];
        this._keyPath = [];
    }
    Object.defineProperty(ObjectTraversal.prototype, "top", {
        get: function () {
            return this._top;
        },
        enumerable: true,
        configurable: true
    });
    ObjectTraversal.prototype.descend = function (key) {
        var top = this._top;
        this._stack.push(top);
        this._top = top != null ? top[key] : undefined;
        this._keyPath.push(key);
    };
    ObjectTraversal.prototype.ascend = function () {
        if (0 < this._stack.length) {
            this._top = this._stack.pop();
            this._keyPath.pop();
        }
    };
    return ObjectTraversal;
}());
exports.ObjectTraversal = ObjectTraversal;
var ParallelTraversal = (function () {
    function ParallelTraversal(obj) {
        this._updateTop(obj || []);
        this._stack = [];
    }
    Object.defineProperty(ParallelTraversal.prototype, "top", {
        get: function () { return this._top; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ParallelTraversal.prototype, "topDefined", {
        get: function () { return this._topDefined; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ParallelTraversal.prototype, "topNonNull", {
        get: function () { return this._topNonNull; },
        enumerable: true,
        configurable: true
    });
    ParallelTraversal.prototype.descend = function (key) {
        var top = this._top;
        this._stack.push(top);
        this._updateTop(top != null ? top.map(function (x) { return x[key]; }) : []);
    };
    ParallelTraversal.prototype.ascend = function () {
        if (0 < this._stack.length) {
            this._updateTop(this._stack.pop());
        }
    };
    ParallelTraversal.prototype.prependTop = function (t) {
        this._top.splice(0, 0, t);
    };
    ParallelTraversal.prototype.appendTop = function (t) {
        this._top.push(t);
    };
    ParallelTraversal.prototype._updateTop = function (obj) {
        this._top = obj;
        this._topDefined = obj.filter(function (x) { return (undefined !== x); })[0];
        this._topNonNull = obj.filter(function (x) { return (null != x); })[0];
    };
    return ParallelTraversal;
}());
exports.ParallelTraversal = ParallelTraversal;
var ModelParseContext = (function () {
    function ModelParseContext(value, required, allowConversion) {
        if (allowConversion === void 0) { allowConversion = true; }
        this._valueTraversal = new ObjectTraversal(value);
        this._currentRequired = !!required;
        this._allowConversion = allowConversion;
        this._keyPath = [];
        this._requiredStack = [];
        this._warnings = [];
        this._errors = [];
    }
    ModelParseContext.prototype.currentValue = function () {
        return this._valueTraversal.top;
    };
    ModelParseContext.prototype.currentRequired = function () {
        return this._currentRequired;
    };
    ModelParseContext.prototype.currentKeyPath = function () {
        return this._keyPath;
    };
    ModelParseContext.prototype.pushItem = function (key, required) {
        this._valueTraversal.descend(key);
        this._requiredStack.push(this._currentRequired);
        this._currentRequired = !!required;
        this._keyPath.push(key);
    };
    ModelParseContext.prototype.popItem = function () {
        if (0 < this._requiredStack.length) {
            this._valueTraversal.ascend();
            this._currentRequired = this._requiredStack.pop();
            this._keyPath.pop();
        }
    };
    ModelParseContext.prototype.addMessage = function (isError, msg, code) {
        var args = [];
        for (var _i = 3; _i < arguments.length; _i++) {
            args[_i - 3] = arguments[_i];
        }
        var message = new (ModelParseMessage.bind.apply(ModelParseMessage, [void 0].concat([isError, this.currentKeyPath().join('.'), msg, code], args)))();
        (isError ? this._errors : this._warnings).push(message);
    };
    ModelParseContext.prototype.addWarning = function (msg, code) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        this.addMessage.apply(this, [false, msg, code].concat(args));
    };
    Object.defineProperty(ModelParseContext.prototype, "warnings", {
        get: function () {
            return this._warnings;
        },
        enumerable: true,
        configurable: true
    });
    ModelParseContext.prototype.addError = function (msg, code) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        this.addMessage.apply(this, [true, msg, code].concat(args));
    };
    Object.defineProperty(ModelParseContext.prototype, "errors", {
        get: function () {
            return this._errors;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ModelParseContext.prototype, "allowConversion", {
        get: function () {
            return this._allowConversion;
        },
        enumerable: true,
        configurable: true
    });
    return ModelParseContext;
}());
exports.ModelParseContext = ModelParseContext;
//# sourceMappingURL=model.infra.js.map