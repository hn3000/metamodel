"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var model_infra_1 = require("./model.infra");
var model_base_1 = require("./model.base");
var ModelTypeDate = (function (_super) {
    __extends(ModelTypeDate, _super);
    function ModelTypeDate(c) {
        _super.call(this, 'number', c);
    }
    ModelTypeDate.prototype.lowerBound = function () {
        var lower = this.findConstraints(function (x) {
            return 0 == x.id.indexOf(">");
        });
        if (lower.length >= 1) {
            lower.sort(function (a, b) { return (a.value.getDate() - b.value.getDate()); });
            return lower[0];
        }
        return null;
    };
    ModelTypeDate.prototype.upperBound = function () {
        var upper = this.findConstraints(function (x) {
            return 0 == x.id.indexOf("<");
        });
        if (upper.length >= 1) {
            upper.sort(function (a, b) { return (b.value.getDate() - a.value.getDate()); });
            return upper[0];
        }
        return null;
    };
    ModelTypeDate.prototype.parse = function (ctx) {
        var val = ctx.currentValue();
        var result = null;
        var error = null;
        try {
            if (typeof val === 'number') {
                // we might not want to allow this in a UI
                result = new Date(val);
            }
            else if (typeof val === 'string') {
                result = new Date(val);
            }
        }
        catch (xx) {
            error = xx;
        }
        if (null == result && ctx.currentRequired()) {
            ctx.addError('can not convert to Date', val, error);
        }
        else {
            result = this._checkAndAdjustValue(result, ctx);
        }
        return result;
    };
    ModelTypeDate.prototype.validate = function (ctx) {
        this.parse(ctx);
    };
    ModelTypeDate.prototype.unparse = function (value) {
        return value.toString();
    };
    ModelTypeDate.prototype.create = function () {
        return new Date();
    };
    ModelTypeDate.prototype.fromString = function (val) {
        try {
            var result = new Date(val);
            var ctx = new model_infra_1.ModelParseContext(result);
            result = this._checkAndAdjustValue(result, ctx);
            return result;
        }
        catch (xx) {
            // at least log the error?
            console.log("can't parse Date", xx);
        }
        return null;
    };
    ModelTypeDate.prototype.asString = function (val) {
        return val.toString();
    };
    ModelTypeDate.prototype._kind = function () { return 'number'; };
    return ModelTypeDate;
}(model_base_1.ModelTypeItem));
exports.ModelTypeDate = ModelTypeDate;
var ModelTypeConstraintDateBase = (function (_super) {
    __extends(ModelTypeConstraintDateBase, _super);
    function ModelTypeConstraintDateBase() {
        _super.call(this);
    }
    Object.defineProperty(ModelTypeConstraintDateBase.prototype, "value", {
        get: function () {
            return this._val();
        },
        enumerable: true,
        configurable: true
    });
    ModelTypeConstraintDateBase.prototype._id = function () {
        return "" + this._op() + this._val;
    };
    ModelTypeConstraintDateBase.prototype._op = function () { return ""; };
    ModelTypeConstraintDateBase.prototype._compare = function (a, b) { return false; };
    ModelTypeConstraintDateBase.prototype._val = function () { return null; };
    ModelTypeConstraintDateBase.prototype.checkAndAdjustValue = function (val, ctx) {
        var comparisonVal = this._val();
        var check = this._compare(val, comparisonVal);
        var result = val;
        if (!check) {
            ctx.addWarning("expected " + val + " " + this._op() + " " + this._val + ".");
            if (!this.isWarningOnly) {
                result = comparisonVal;
            }
        }
        return result;
    };
    return ModelTypeConstraintDateBase;
}(model_base_1.ModelTypeConstraintOptional));
exports.ModelTypeConstraintDateBase = ModelTypeConstraintDateBase;
var ModelTypeConstraintDateFixed = (function (_super) {
    __extends(ModelTypeConstraintDateFixed, _super);
    function ModelTypeConstraintDateFixed(val) {
        _super.call(this);
        if (val instanceof Date) {
            this._value = val;
        }
        else {
            this._value = val._value;
        }
    }
    ModelTypeConstraintDateFixed.prototype._val = function () { return this._value; };
    return ModelTypeConstraintDateFixed;
}(ModelTypeConstraintDateBase));
exports.ModelTypeConstraintDateFixed = ModelTypeConstraintDateFixed;
var ModelTypeConstraintBefore = (function (_super) {
    __extends(ModelTypeConstraintBefore, _super);
    function ModelTypeConstraintBefore(val) {
        _super.call(this, val);
    }
    ModelTypeConstraintBefore.prototype._op = function () { return "<"; };
    ModelTypeConstraintBefore.prototype._compare = function (a, b) { return a < b; };
    return ModelTypeConstraintBefore;
}(ModelTypeConstraintDateFixed));
exports.ModelTypeConstraintBefore = ModelTypeConstraintBefore;
var ModelTypeConstraintAfter = (function (_super) {
    __extends(ModelTypeConstraintAfter, _super);
    function ModelTypeConstraintAfter(val) {
        _super.call(this, val);
    }
    ModelTypeConstraintAfter.prototype._op = function () { return ">"; };
    ModelTypeConstraintAfter.prototype._compare = function (a, b) { return a > b; };
    return ModelTypeConstraintAfter;
}(ModelTypeConstraintDateFixed));
exports.ModelTypeConstraintAfter = ModelTypeConstraintAfter;
var TimeSpan = (function () {
    function TimeSpan(timespan) {
        var match = TimeSpan.REGEX.exec(timespan);
        this._amount = parseFloat(match[1]);
        this._unit = match[2];
    }
    Object.defineProperty(TimeSpan.prototype, "amount", {
        get: function () { return this._amount; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TimeSpan.prototype, "unit", {
        get: function () { return this._unit; },
        enumerable: true,
        configurable: true
    });
    TimeSpan.REGEX = /([0-9]+(?:\.[0.9]+)?)\s*([a-z]+)/;
    return TimeSpan;
}());
exports.TimeSpan = TimeSpan;
var ModelTypeConstraintOlder = (function (_super) {
    __extends(ModelTypeConstraintOlder, _super);
    function ModelTypeConstraintOlder(timespan) {
        _super.call(this);
        this._timespan = new TimeSpan(timespan);
    }
    ModelTypeConstraintOlder.prototype._op = function () { return "<"; };
    ModelTypeConstraintOlder.prototype._compare = function (a, b) { return a < b; };
    ModelTypeConstraintOlder.prototype._val = function () {
        var date = new Date();
        switch (this._timespan.unit) {
            case "y":
            case "year":
            case "years":
                date.setFullYear(date.getFullYear() - this._timespan.amount);
                break;
            case "m":
            case "month":
            case "months":
                date.setMonth(date.getMonth() - this._timespan.amount);
                break;
        }
        return date;
    };
    return ModelTypeConstraintOlder;
}(ModelTypeConstraintDateBase));
exports.ModelTypeConstraintOlder = ModelTypeConstraintOlder;
//# sourceMappingURL=model.date.js.map