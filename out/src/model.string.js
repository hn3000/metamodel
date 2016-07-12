"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var model_base_1 = require("./model.base");
var ModelTypeString = (function (_super) {
    __extends(ModelTypeString, _super);
    function ModelTypeString(c) {
        _super.call(this, 'string', c);
    }
    ModelTypeString.prototype.lowerBound = function () { return null; };
    ;
    ModelTypeString.prototype.upperBound = function () { return null; };
    ;
    ModelTypeString.prototype.parse = function (ctx) {
        var val = ctx.currentValue();
        var result = null;
        if (typeof val === 'string') {
            result = val;
        }
        if (null == result && ctx.currentRequired()) {
            ctx.addError('can not convert to string', val);
        }
        else {
            result = this._checkAndAdjustValue(result, ctx);
        }
        return result;
    };
    ModelTypeString.prototype.validate = function (ctx) {
        this.parse(ctx);
    };
    ModelTypeString.prototype.unparse = function (value) {
        return value;
    };
    ModelTypeString.prototype.asString = function (val) { return val; };
    ModelTypeString.prototype.fromString = function (val) { return val; };
    ModelTypeString.prototype.create = function () { return ""; };
    ModelTypeString.prototype._kind = function () { return 'string'; };
    return ModelTypeString;
}(model_base_1.ModelTypeItem));
exports.ModelTypeString = ModelTypeString;
var ModelTypeConstraintPossibleValues = (function (_super) {
    __extends(ModelTypeConstraintPossibleValues, _super);
    function ModelTypeConstraintPossibleValues(values) {
        _super.call(this);
        this._allowedValues = values || [];
    }
    Object.defineProperty(ModelTypeConstraintPossibleValues.prototype, "allowedValues", {
        get: function () {
            return this._allowedValues; // might wanna return a copy
        },
        enumerable: true,
        configurable: true
    });
    ModelTypeConstraintPossibleValues.prototype._id = function () { return "oneof[" + this._allowedValues.join(',') + "]"; };
    ModelTypeConstraintPossibleValues.prototype.checkAndAdjustValue = function (val, ctx) {
        var result = val;
        if (-1 === this._allowedValues.indexOf(val)) {
            if (this.isWarningOnly) {
                ctx.addWarning('not a recommended value', val);
                result = val;
            }
            else {
                ctx.addError('not a valid value', val);
                result = null;
            }
        }
        return result;
    };
    return ModelTypeConstraintPossibleValues;
}(model_base_1.ModelTypeConstraintOptional));
exports.ModelTypeConstraintPossibleValues = ModelTypeConstraintPossibleValues;
var ModelTypeConstraintRegex = (function (_super) {
    __extends(ModelTypeConstraintRegex, _super);
    function ModelTypeConstraintRegex(pattern, flags, message) {
        _super.call(this);
        var patternSource = pattern.source || pattern.toString();
        this._pattern = new RegExp(patternSource, flags || '');
        if (null != message) {
            this._message = message;
        }
        else {
            this._message = "value does not match " + this._pattern.toString() + ":";
        }
    }
    ModelTypeConstraintRegex.prototype._id = function () { return "pattern[" + this._pattern + "]"; };
    ModelTypeConstraintRegex.prototype.checkAndAdjustValue = function (val, ctx) {
        var result = val;
        if (!ctx.currentRequired() && (null == val || '' == val)) {
            return val;
        }
        if (!this._pattern.exec(val)) {
            if (this.isWarningOnly) {
                ctx.addWarning(this._message, val);
                result = val;
            }
            else {
                ctx.addError(this._message, val);
                result = null;
            }
        }
        return result;
    };
    return ModelTypeConstraintRegex;
}(model_base_1.ModelTypeConstraintOptional));
exports.ModelTypeConstraintRegex = ModelTypeConstraintRegex;
//# sourceMappingURL=model.string.js.map