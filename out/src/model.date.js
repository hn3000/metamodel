"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var model_infra_1 = require("./model.infra");
var model_base_1 = require("./model.base");
var ModelTypeDate = /** @class */ (function (_super) {
    __extends(ModelTypeDate, _super);
    function ModelTypeDate(name, c) {
        if (name === void 0) { name = 'date'; }
        return _super.call(this, name, c) || this;
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
        var value = ctx.currentValue();
        var result = null;
        var error = null;
        try {
            if (typeof value === 'number') {
                // we might not want to allow this in a UI
                result = new Date(value);
            }
            else if (typeof value === 'string') {
                result = new Date(value);
            }
        }
        catch (xx) {
            error = xx;
        }
        if (null == result && ctx.currentRequired()) {
            if (null == value) {
                ctx.addErrorEx('can not convert to Date', 'required-empty', { value: value, error: error });
            }
            else {
                ctx.addErrorEx('can not convert to Date', 'value-type', { value: value, error: error });
            }
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
            var ctx = new model_infra_1.ModelParseContext(result, this);
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
var ModelTypeConstraintDateBase = /** @class */ (function (_super) {
    __extends(ModelTypeConstraintDateBase, _super);
    function ModelTypeConstraintDateBase() {
        return _super.call(this) || this;
    }
    Object.defineProperty(ModelTypeConstraintDateBase.prototype, "value", {
        get: function () {
            return this._val();
        },
        enumerable: true,
        configurable: true
    });
    ModelTypeConstraintDateBase.prototype._id = function () {
        return "" + this._op() + this._val();
    };
    ModelTypeConstraintDateBase.prototype._op = function () { return ""; };
    ModelTypeConstraintDateBase.prototype._compare = function (a, b) { return false; };
    ModelTypeConstraintDateBase.prototype._val = function () { return null; };
    ModelTypeConstraintDateBase.prototype._limit = function () { return null; };
    ModelTypeConstraintDateBase.prototype._code = function () { return 'value-invalid'; };
    ModelTypeConstraintDateBase.prototype.asDate = function (val) {
        if (val instanceof Date) {
            return val;
        }
        return new Date(val);
    };
    ModelTypeConstraintDateBase.prototype.checkAndAdjustValue = function (val, ctx) {
        var result = val;
        var value = val;
        if (value != null && value !== '' && !ctx.hasMessagesForCurrentValue()) {
            // only check if it seems to be a valid date
            var limit = this._val();
            var checkVal = this.asDate(value);
            var check = this._compare(checkVal, limit);
            if (!check) {
                var msg = "expected " + val + " " + this._op() + " " + this._val() + ".";
                ctx.addMessageEx(!this.isWarningOnly, msg, this._code(), { value: value, limit: limit, op: this._op(), date: checkVal });
                if (!this.isWarningOnly && ctx.allowConversion) {
                    // does not make sense without improved date-format handling
                    //result = comparisonVal as any;
                }
            }
        }
        return result;
    };
    return ModelTypeConstraintDateBase;
}(model_base_1.ModelTypeConstraintOptional));
exports.ModelTypeConstraintDateBase = ModelTypeConstraintDateBase;
var ModelTypeConstraintDateFixed = /** @class */ (function (_super) {
    __extends(ModelTypeConstraintDateFixed, _super);
    function ModelTypeConstraintDateFixed(val) {
        var _this = _super.call(this) || this;
        if (val instanceof Date || typeof val === 'string') {
            _this._value = _this.asDate(val);
        }
        else {
            _this._value = val._value;
        }
        return _this;
    }
    ModelTypeConstraintDateFixed.prototype._val = function () { return this._value; };
    ModelTypeConstraintDateFixed.prototype._limit = function () { return this._value; };
    return ModelTypeConstraintDateFixed;
}(ModelTypeConstraintDateBase));
exports.ModelTypeConstraintDateFixed = ModelTypeConstraintDateFixed;
var ModelTypeConstraintBefore = /** @class */ (function (_super) {
    __extends(ModelTypeConstraintBefore, _super);
    function ModelTypeConstraintBefore(val) {
        return _super.call(this, val) || this;
    }
    ModelTypeConstraintBefore.prototype._op = function () { return "<"; };
    ModelTypeConstraintBefore.prototype._compare = function (a, b) { return a < b; };
    ModelTypeConstraintBefore.prototype._code = function () { return 'date-large'; };
    return ModelTypeConstraintBefore;
}(ModelTypeConstraintDateFixed));
exports.ModelTypeConstraintBefore = ModelTypeConstraintBefore;
var ModelTypeConstraintAfter = /** @class */ (function (_super) {
    __extends(ModelTypeConstraintAfter, _super);
    function ModelTypeConstraintAfter(val) {
        return _super.call(this, val) || this;
    }
    ModelTypeConstraintAfter.prototype._op = function () { return ">"; };
    ModelTypeConstraintAfter.prototype._compare = function (a, b) { return a > b; };
    ModelTypeConstraintAfter.prototype._code = function () { return 'date-small'; };
    return ModelTypeConstraintAfter;
}(ModelTypeConstraintDateFixed));
exports.ModelTypeConstraintAfter = ModelTypeConstraintAfter;
var TimeSpan = /** @class */ (function () {
    function TimeSpan(timespan) {
        var match = TimeSpan.REGEX.exec(timespan);
        this._amount = parseFloat(match[1]);
        this._unit = match[2];
        switch (this._unit) {
            case "y":
            case "year":
            case "years":
                this._unitNormalized = 'year';
                break;
            case "m":
            case "month":
            case "months":
                this._unitNormalized = 'month';
                break;
        }
    }
    TimeSpan.prototype.toString = function () {
        return this._amount + " " + this._unitNormalized + (this._amount != 1 ? 's' : '');
    };
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
    TimeSpan.prototype.moveBack = function (date) {
        switch (this._unitNormalized) {
            case "year":
                date.setFullYear(date.getFullYear() - this._amount);
                break;
            case "month":
                date.setMonth(date.getMonth() - this._amount);
                break;
        }
    };
    TimeSpan.REGEX = /([0-9]+(?:\.[0.9]+)?)\s*([a-z]+)/;
    return TimeSpan;
}());
exports.TimeSpan = TimeSpan;
var ModelTypeConstraintOlder = /** @class */ (function (_super) {
    __extends(ModelTypeConstraintOlder, _super);
    function ModelTypeConstraintOlder(timespan) {
        var _this = _super.call(this) || this;
        _this._timespan = new TimeSpan(timespan);
        return _this;
    }
    ModelTypeConstraintOlder.prototype._op = function () { return "<"; };
    ModelTypeConstraintOlder.prototype._compare = function (a, b) { return a < b; };
    ModelTypeConstraintOlder.prototype._limit = function () { return this._timespan; };
    ModelTypeConstraintOlder.prototype._val = function () {
        var date = new Date();
        this._timespan.moveBack(date);
        return date;
    };
    ModelTypeConstraintOlder.prototype._code = function () { return 'date-minage'; };
    return ModelTypeConstraintOlder;
}(ModelTypeConstraintDateBase));
exports.ModelTypeConstraintOlder = ModelTypeConstraintOlder;
//# sourceMappingURL=model.date.js.map