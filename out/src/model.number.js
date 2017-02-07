"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var model_infra_1 = require("./model.infra");
var model_base_1 = require("./model.base");
var ModelTypeNumber = (function (_super) {
    __extends(ModelTypeNumber, _super);
    function ModelTypeNumber(c) {
        return _super.call(this, 'number', c) || this;
    }
    ModelTypeNumber.prototype.lowerBound = function () {
        var lower = this.findConstraints(function (x) {
            return 0 == x.id.indexOf(">");
        });
        if (lower.length >= 1) {
            lower.sort(function (a, b) { return (a.value - b.value); });
            return lower[0];
        }
        return null;
    };
    ModelTypeNumber.prototype.upperBound = function () {
        var upper = this.findConstraints(function (x) {
            return 0 == x.id.indexOf("<");
        });
        if (upper.length >= 1) {
            upper.sort(function (a, b) { return (b.value - a.value); });
            return upper[0];
        }
        return null;
    };
    ModelTypeNumber.prototype.parse = function (ctx) {
        var value = ctx.currentValue();
        var result = null;
        if (typeof value === 'number') {
            result = value;
        }
        else if (typeof value === 'string' && ctx.allowConversion) {
            result = Number(value);
            if (isNaN(result)) {
                result = null;
            }
        }
        if (null == result && (ctx.currentRequired() || (value != null))) {
            if (null == value) {
                ctx.addError('required value is missing', 'required-empty');
            }
            else {
                ctx.addErrorEx('can not convert to float', 'value-invalid', { value: value });
            }
        }
        else {
            result = this._checkAndAdjustValue(result, ctx);
        }
        return result;
    };
    ModelTypeNumber.prototype.validate = function (ctx) {
        this.parse(ctx);
    };
    ModelTypeNumber.prototype.unparse = function (value) {
        return value;
    };
    ModelTypeNumber.prototype.create = function () {
        return 0;
    };
    ModelTypeNumber.prototype.fromString = function (val) {
        var result = parseFloat(val);
        var ctx = new model_infra_1.ModelParseContext(result, this);
        result = this._checkAndAdjustValue(result, ctx);
        return result;
    };
    ModelTypeNumber.prototype.asString = function (val) {
        return val.toString(10);
    };
    ModelTypeNumber.prototype._kind = function () { return 'number'; };
    return ModelTypeNumber;
}(model_base_1.ModelTypeItem));
exports.ModelTypeNumber = ModelTypeNumber;
var ModelTypeConstraintInteger = (function () {
    function ModelTypeConstraintInteger() {
    }
    Object.defineProperty(ModelTypeConstraintInteger.prototype, "id", {
        get: function () { return 'int'; },
        enumerable: true,
        configurable: true
    });
    ModelTypeConstraintInteger.prototype.checkAndAdjustValue = function (value, ctx) {
        if (null != value) {
            var adjusted = Math.floor(value);
            if (value !== adjusted) {
                ctx.addWarningEx('expected int value, ignored fractional part', 'value-adjusted', { value: value, adjusted: adjusted });
            }
            return adjusted;
        }
        return value;
    };
    return ModelTypeConstraintInteger;
}());
exports.ModelTypeConstraintInteger = ModelTypeConstraintInteger;
var ModelTypeConstraintMultipleOf = (function (_super) {
    __extends(ModelTypeConstraintMultipleOf, _super);
    function ModelTypeConstraintMultipleOf(modulus) {
        var _this = _super.call(this) || this;
        if (typeof (modulus) === 'number') {
            _this._modulus = modulus;
        }
        else {
            _this._modulus = modulus._modulus;
        }
        return _this;
    }
    ModelTypeConstraintMultipleOf.prototype._id = function () { return "mult(" + this._modulus + ")"; };
    ModelTypeConstraintMultipleOf.prototype.checkAndAdjustValue = function (value, ctx) {
        var adjusted = Math.floor(value / this._modulus) * this._modulus;
        if (adjusted !== value) {
            var warn = this.isWarningOnly && ctx.allowConversion;
            var adjust = ctx.allowConversion;
            var msg = "expected multiple of " + this._modulus + " but got " + value + (adjust ? ', ignoring remainder' : '');
            ctx.addMessageEx(!warn, msg, 'value-adjusted', { value: value, adjusted: adjusted });
            if (adjust) {
                return adjusted;
            }
        }
        return value;
    };
    Object.defineProperty(ModelTypeConstraintMultipleOf.prototype, "modulus", {
        get: function () {
            return this._modulus;
        },
        enumerable: true,
        configurable: true
    });
    return ModelTypeConstraintMultipleOf;
}(model_base_1.ModelTypeConstraintOptional));
exports.ModelTypeConstraintMultipleOf = ModelTypeConstraintMultipleOf;
var ModelTypeConstraintComparison = (function (_super) {
    __extends(ModelTypeConstraintComparison, _super);
    function ModelTypeConstraintComparison(val) {
        var _this = _super.call(this) || this;
        if (typeof val == 'number') {
            _this._val = val;
        }
        else {
            _this._val = val._val;
        }
        return _this;
    }
    Object.defineProperty(ModelTypeConstraintComparison.prototype, "value", {
        get: function () {
            return this._val;
        },
        enumerable: true,
        configurable: true
    });
    ModelTypeConstraintComparison.prototype.warnOnly = function () {
        var result = new this.constructor(this._val);
        result._onlyWarn = true;
        return result;
    };
    ModelTypeConstraintComparison.prototype._id = function () {
        return "" + this._op() + this._val;
    };
    ModelTypeConstraintComparison.prototype._op = function () { return ""; };
    ModelTypeConstraintComparison.prototype._compare = function (a, b) { return false; };
    ModelTypeConstraintComparison.prototype._code = function () { return 'value-invalid'; };
    ModelTypeConstraintComparison.prototype.checkAndAdjustValue = function (value, ctx) {
        var limit = this._val;
        var check = this._compare(value, limit);
        var result = value;
        if (!check) {
            var warning = this.isWarningOnly;
            var error = !warning && !ctx.allowConversion;
            var op = this._op();
            ctx.addMessageEx(error, "expected " + value + " " + this._op() + " " + this._val + ".", this._code(), { value: value, limit: limit, op: op });
            if (!this.isWarningOnly && ctx.allowConversion) {
                result = this._val;
            }
        }
        return result;
    };
    return ModelTypeConstraintComparison;
}(model_base_1.ModelTypeConstraintOptional));
exports.ModelTypeConstraintComparison = ModelTypeConstraintComparison;
var ModelTypeConstraintLess = (function (_super) {
    __extends(ModelTypeConstraintLess, _super);
    function ModelTypeConstraintLess(val) {
        return _super.call(this, val) || this;
    }
    ModelTypeConstraintLess.prototype._op = function () { return "<"; };
    ModelTypeConstraintLess.prototype._compare = function (a, b) { return a < b; };
    ModelTypeConstraintLess.prototype._code = function () { return 'value-less'; };
    return ModelTypeConstraintLess;
}(ModelTypeConstraintComparison));
exports.ModelTypeConstraintLess = ModelTypeConstraintLess;
var ModelTypeConstraintLessEqual = (function (_super) {
    __extends(ModelTypeConstraintLessEqual, _super);
    function ModelTypeConstraintLessEqual(val) {
        return _super.call(this, val) || this;
    }
    ModelTypeConstraintLessEqual.prototype._op = function () { return "<="; };
    ModelTypeConstraintLessEqual.prototype._compare = function (a, b) { return a <= b; };
    ModelTypeConstraintLessEqual.prototype._code = function () { return 'value-less-or-equal'; };
    return ModelTypeConstraintLessEqual;
}(ModelTypeConstraintComparison));
exports.ModelTypeConstraintLessEqual = ModelTypeConstraintLessEqual;
var ModelTypeConstraintMore = (function (_super) {
    __extends(ModelTypeConstraintMore, _super);
    function ModelTypeConstraintMore(val) {
        return _super.call(this, val) || this;
    }
    ModelTypeConstraintMore.prototype._op = function () { return ">"; };
    ModelTypeConstraintMore.prototype._compare = function (a, b) { return a > b; };
    ModelTypeConstraintMore.prototype._code = function () { return 'value-more'; };
    return ModelTypeConstraintMore;
}(ModelTypeConstraintComparison));
exports.ModelTypeConstraintMore = ModelTypeConstraintMore;
var ModelTypeConstraintMoreEqual = (function (_super) {
    __extends(ModelTypeConstraintMoreEqual, _super);
    function ModelTypeConstraintMoreEqual(val) {
        return _super.call(this, val) || this;
    }
    ModelTypeConstraintMoreEqual.prototype._op = function () { return ">="; };
    ModelTypeConstraintMoreEqual.prototype._compare = function (a, b) { return a >= b; };
    ModelTypeConstraintMoreEqual.prototype._code = function () { return 'value-more-or-equal'; };
    return ModelTypeConstraintMoreEqual;
}(ModelTypeConstraintComparison));
exports.ModelTypeConstraintMoreEqual = ModelTypeConstraintMoreEqual;
//# sourceMappingURL=model.number.js.map