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
        _super.call(this, 'number', c);
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
        var val = ctx.currentValue();
        var result = null;
        if (typeof val === 'number') {
            result = val;
        }
        else if (typeof val === 'string') {
            result = parseFloat(val);
        }
        if (null == result && ctx.currentRequired()) {
            ctx.addError('can not convert to float', val);
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
    ModelTypeNumber.prototype.fromString = function (val) {
        var result = parseFloat(val);
        var ctx = new model_infra_1.ModelParseContext(result);
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
    ModelTypeConstraintInteger.prototype.checkAndAdjustValue = function (val, ctx) {
        var result = Math.floor(val);
        if (val !== result) {
            ctx.addWarning('expected int value, ignored fractional part', val, result);
        }
        return result;
    };
    return ModelTypeConstraintInteger;
}());
exports.ModelTypeConstraintInteger = ModelTypeConstraintInteger;
var ModelTypeConstraintMultipleOf = (function (_super) {
    __extends(ModelTypeConstraintMultipleOf, _super);
    function ModelTypeConstraintMultipleOf(modulus) {
        _super.call(this);
        if (typeof (modulus) === 'number') {
            this._modulus = modulus;
        }
        else {
            this._modulus = modulus._modulus;
        }
    }
    ModelTypeConstraintMultipleOf.prototype._id = function () { return "mult(" + this._modulus + ")"; };
    ModelTypeConstraintMultipleOf.prototype.checkAndAdjustValue = function (val, ctx) {
        var result = Math.floor(val / this._modulus) * this._modulus;
        if (result !== val) {
            ctx.addWarning("expected multiple of " + this._modulus + ", ignoring remainder", val, result);
        }
        return result;
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
        _super.call(this);
        if (typeof val == 'number') {
            this._val = val;
        }
        else {
            this._val = val._val;
        }
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
    ModelTypeConstraintComparison.prototype.checkAndAdjustValue = function (val, ctx) {
        var check = this._compare(val, this._val);
        var result = val;
        if (!check) {
            ctx.addWarning("expected " + val + " " + this._op() + " " + this._val + ".");
            if (!this.isWarningOnly) {
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
        _super.call(this, val);
    }
    ModelTypeConstraintLess.prototype._op = function () { return "<"; };
    ModelTypeConstraintLess.prototype._compare = function (a, b) { return a < b; };
    return ModelTypeConstraintLess;
}(ModelTypeConstraintComparison));
exports.ModelTypeConstraintLess = ModelTypeConstraintLess;
var ModelTypeConstraintLessEqual = (function (_super) {
    __extends(ModelTypeConstraintLessEqual, _super);
    function ModelTypeConstraintLessEqual(val) {
        _super.call(this, val);
    }
    ModelTypeConstraintLessEqual.prototype._op = function () { return "<="; };
    ModelTypeConstraintLessEqual.prototype._compare = function (a, b) { return a <= b; };
    return ModelTypeConstraintLessEqual;
}(ModelTypeConstraintComparison));
exports.ModelTypeConstraintLessEqual = ModelTypeConstraintLessEqual;
var ModelTypeConstraintMore = (function (_super) {
    __extends(ModelTypeConstraintMore, _super);
    function ModelTypeConstraintMore(val) {
        _super.call(this, val);
    }
    ModelTypeConstraintMore.prototype._op = function () { return ">"; };
    ModelTypeConstraintMore.prototype._compare = function (a, b) { return a > b; };
    return ModelTypeConstraintMore;
}(ModelTypeConstraintComparison));
exports.ModelTypeConstraintMore = ModelTypeConstraintMore;
var ModelTypeConstraintMoreEqual = (function (_super) {
    __extends(ModelTypeConstraintMoreEqual, _super);
    function ModelTypeConstraintMoreEqual(val) {
        _super.call(this, val);
    }
    ModelTypeConstraintMoreEqual.prototype._op = function () { return ">="; };
    ModelTypeConstraintMoreEqual.prototype._compare = function (a, b) { return a >= b; };
    return ModelTypeConstraintMoreEqual;
}(ModelTypeConstraintComparison));
exports.ModelTypeConstraintMoreEqual = ModelTypeConstraintMoreEqual;
//# sourceMappingURL=model.number.js.map