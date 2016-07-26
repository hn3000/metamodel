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
        var value = ctx.currentValue();
        var result = null;
        if (typeof value === 'string') {
            result = value;
        }
        if (null == result && ctx.currentRequired()) {
            if (value == null) {
                ctx.addErrorEx('required value is missing', 'required-empty', { value: value });
            }
            else {
                ctx.addErrorEx('value is wrong type', 'value-type', { value: value });
            }
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
    ModelTypeConstraintPossibleValues.prototype.checkAndAdjustValue = function (value, ctx) {
        var result = value;
        var allowed = this._allowedValues;
        if (-1 === allowed.indexOf(value)) {
            if (this.isWarningOnly) {
                ctx.addWarningEx('not a recommended value', 'value-warning', { value: value, allowed: allowed });
                result = value;
            }
            else {
                ctx.addErrorEx('not a valid value', 'value-invalid', { value: value, allowed: allowed });
                result = null;
            }
        }
        return result;
    };
    return ModelTypeConstraintPossibleValues;
}(model_base_1.ModelTypeConstraintOptional));
exports.ModelTypeConstraintPossibleValues = ModelTypeConstraintPossibleValues;
var ModelTypeConstraintLength = (function (_super) {
    __extends(ModelTypeConstraintLength, _super);
    function ModelTypeConstraintLength(minLen, maxLen, message) {
        _super.call(this);
        this._minLength = minLen;
        this._maxLength = maxLen;
        if (null != message) {
            this._message = message;
        }
        else {
            var msg;
            if (minLen == null || minLen == 0) {
                msg = "length must be at most " + maxLen + ":";
            }
            else if (maxLen == null) {
                msg = "length must be at least " + (minLen || 0) + ":";
            }
            else {
                msg = "length must be between " + (minLen || 0) + " and " + maxLen + ":";
            }
            this._message = msg;
        }
    }
    ModelTypeConstraintLength.prototype._id = function () {
        var from = this._minLength != null ? this._minLength + " <= " : '';
        var to = this._maxLength != null ? "<= " + this._maxLength : '';
        return from + "length" + to;
    };
    ModelTypeConstraintLength.prototype.checkAndAdjustValue = function (value, ctx) {
        var result = value;
        if (!ctx.currentRequired() && (null == value || '' == value)) {
            return value;
        }
        if (null != value) {
            var length_1 = value.length;
            var minLength = this._minLength;
            var maxLength = this._maxLength;
            if (null != minLength && length_1 < minLength) {
                ctx.addMessageEx(!this.isWarningOnly, this._message, 'value-short', { value: value, minLength: minLength, maxLength: maxLength });
                if (!this.isWarningOnly && ctx.allowConversion) {
                    result = null;
                }
            }
            if (null != this._maxLength && length_1 > this._maxLength) {
                ctx.addMessageEx(!this.isWarningOnly, this._message, 'value-long', { value: value, minLength: minLength, maxLength: maxLength });
                if (!this.isWarningOnly && ctx.allowConversion) {
                    result = null;
                }
            }
        }
        return result;
    };
    Object.defineProperty(ModelTypeConstraintLength.prototype, "minLength", {
        get: function () {
            return this._minLength || 0;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ModelTypeConstraintLength.prototype, "maxLength", {
        get: function () {
            return this._maxLength;
        },
        enumerable: true,
        configurable: true
    });
    return ModelTypeConstraintLength;
}(model_base_1.ModelTypeConstraintOptional));
exports.ModelTypeConstraintLength = ModelTypeConstraintLength;
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
    ModelTypeConstraintRegex.prototype.checkAndAdjustValue = function (value, ctx) {
        var result = value;
        if (!ctx.currentRequired() && (null == value || '' == value)) {
            return value;
        }
        var pattern = this._pattern;
        if (!pattern.exec(value)) {
            if (this.isWarningOnly) {
                ctx.addWarningEx(this._message, 'value-warning', { value: value, pattern: pattern });
                result = value;
            }
            else {
                ctx.addErrorEx(this._message, 'value-invalid', { value: value, pattern: pattern });
                result = null;
            }
        }
        return result;
    };
    return ModelTypeConstraintRegex;
}(model_base_1.ModelTypeConstraintOptional));
exports.ModelTypeConstraintRegex = ModelTypeConstraintRegex;
//# sourceMappingURL=model.string.js.map