"use strict";
var model_api_1 = require("./model.api");
var ModelParseMessage = (function () {
    function ModelParseMessage(severity, property, msg, code, props, qualifiers) {
        this._severity = severity;
        this._property = property;
        this._msg = msg;
        this._code = code;
        this._qualifiers = qualifiers || [];
        this._props = props;
    }
    Object.defineProperty(ModelParseMessage.prototype, "property", {
        get: function () { return this._property; },
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
    Object.defineProperty(ModelParseMessage.prototype, "qualifiers", {
        get: function () { return this._qualifiers; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ModelParseMessage.prototype, "props", {
        get: function () { return this._props; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ModelParseMessage.prototype, "severity", {
        get: function () { return this._severity; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ModelParseMessage.prototype, "isError", {
        get: function () { return this._severity == model_api_1.MessageSeverity.ERROR; },
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
    function ModelParseContext(value, type, required, allowConversion) {
        if (allowConversion === void 0) { allowConversion = true; }
        this._valueTraversal = new ObjectTraversal(value);
        this._currentType = type;
        this._currentRequired = !!required;
        this._allowConversion = allowConversion;
        this._keyPath = [];
        this._typeStack = [];
        this._requiredStack = [];
        this._messages = [];
    }
    ModelParseContext.prototype.currentValue = function () {
        return this._valueTraversal.top;
    };
    ModelParseContext.prototype.currentType = function () {
        return this._currentType;
    };
    ModelParseContext.prototype.currentRequired = function () {
        return this._currentRequired;
    };
    ModelParseContext.prototype.currentKeyPath = function () {
        return this._keyPath;
    };
    ModelParseContext.prototype.pushItem = function (key, required, type) {
        this._valueTraversal.descend(key);
        this._typeStack.push(this._currentType);
        this._requiredStack.push(this._currentRequired);
        var nextType = type;
        if (!nextType) {
            var currentType = this._currentType;
            if (currentType.itemType) {
                nextType = currentType.itemType(key);
            }
            if (!nextType) {
                nextType = type;
            }
        }
        this._currentType = nextType;
        this._currentRequired = !!required;
        this._keyPath.push(key);
    };
    ModelParseContext.prototype.popItem = function () {
        if (0 < this._requiredStack.length) {
            this._valueTraversal.ascend();
            this._currentType = this._typeStack.pop();
            this._currentRequired = this._requiredStack.pop();
            this._keyPath.pop();
        }
    };
    ModelParseContext.prototype.hasMessagesForCurrentValue = function () {
        var keyPath = this.currentKeyPath().join('.');
        return this._messages.some(function (x) { return x.property == keyPath; });
    };
    ModelParseContext.prototype.addWarning = function (msg, code) {
        this.addMessage(model_api_1.MessageSeverity.WARNING, msg, code);
    };
    ModelParseContext.prototype.addError = function (msg, code) {
        this.addMessage(model_api_1.MessageSeverity.ERROR, msg, code);
    };
    ModelParseContext.prototype.addWarningEx = function (msg, code, props) {
        this.addMessageEx(model_api_1.MessageSeverity.WARNING, msg, code, props);
    };
    ModelParseContext.prototype.addErrorEx = function (msg, code, props) {
        this.addMessageEx(model_api_1.MessageSeverity.ERROR, msg, code, props);
    };
    ModelParseContext.prototype.addMessage = function (severity, msg, code) {
        this.addMessageEx(severity, msg, code, {});
    };
    ModelParseContext.prototype.addMessageEx = function (severity, msg, code, props) {
        var sev;
        if (typeof severity === 'boolean') {
            sev = severity ? model_api_1.MessageSeverity.ERROR : model_api_1.MessageSeverity.WARNING;
        }
        else {
            sev = severity;
        }
        var message = new ModelParseMessage(sev, this.currentKeyPath().join('.'), msg, code, props, this.currentType() ? this.currentType().qualifiers || [] : []);
        this._messages.push(message);
    };
    ModelParseContext.prototype.addMessages = function (msgs) {
        (_a = this._messages).push.apply(_a, msgs);
        var _a;
    };
    ModelParseContext.prototype._removeMessages = function (filter) {
        this._messages = this._messages.filter(function (x) { return !filter(x); });
    };
    Object.defineProperty(ModelParseContext.prototype, "messages", {
        get: function () {
            return this._messages;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ModelParseContext.prototype, "warnings", {
        get: function () {
            return this._messages.filter(function (x) { return x.severity === model_api_1.MessageSeverity.WARNING; });
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ModelParseContext.prototype, "errors", {
        get: function () {
            return this._messages.filter(function (x) { return x.severity === model_api_1.MessageSeverity.ERROR; });
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