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
var model_base_1 = require("./model.base");
var ModelTypeArray = /** @class */ (function (_super) {
    __extends(ModelTypeArray, _super);
    function ModelTypeArray(elementType, name, constraints) {
        var _this = _super.call(this, name || (elementType.name + "[]"), constraints) || this;
        _this._elementType = elementType;
        return _this;
    }
    ModelTypeArray.prototype.parse = function (ctx) {
        var source = ctx.currentValue();
        if (null != source) {
            var result = [];
            // TODO: determine minimum length and maximum length from constraints?
            for (var i = 0, n = source.length; i < n; ++i) {
                ctx.pushItem(i, false, this._elementType);
                result[i] = this._elementType.parse(ctx);
                ctx.popItem();
            }
            result = this._checkAndAdjustValue(result, ctx);
            return result;
        }
        return source;
    };
    ModelTypeArray.prototype.validate = function (ctx) {
        this.parse(ctx);
    };
    ModelTypeArray.prototype.unparse = function (val) {
        var result = [];
        for (var i = 0, n = val.length; i < n; ++i) {
            result[i] = this._elementType.unparse(val[i]);
        }
        return result;
    };
    ModelTypeArray.prototype.create = function () {
        return [];
    };
    Object.defineProperty(ModelTypeArray.prototype, "items", {
        get: function () {
            return [];
        },
        enumerable: true,
        configurable: true
    });
    ModelTypeArray.prototype.itemType = function () {
        return this._elementType;
    };
    ModelTypeArray.prototype.slice = function () {
        return this;
    };
    ModelTypeArray.prototype.possibleValuesForContextData = function (name, data) {
        // TODO
        //return this._elementType.possibleValuesForContextData(data[name]);
        return null;
    };
    ModelTypeArray.prototype._kind = function () { return 'array'; };
    return ModelTypeArray;
}(model_base_1.ModelTypeConstrainable));
exports.ModelTypeArray = ModelTypeArray;
var ModelTypeArraySizeConstraint = /** @class */ (function (_super) {
    __extends(ModelTypeArraySizeConstraint, _super);
    function ModelTypeArraySizeConstraint(options) {
        var _this = _super.call(this) || this;
        var minLength = options.minLength, maxLength = options.maxLength;
        ;
        _this._settings = {
            minLength: null != minLength ? Math.max(0, minLength) : null,
            maxLength: null != maxLength ? Math.max(0, maxLength) : null,
        };
        return _this;
    }
    ModelTypeArraySizeConstraint.prototype._id = function () {
        var _a = this._settings, minLength = _a.minLength, maxLength = _a.maxLength;
        return (minLength ? minLength + ' <= ' : '') + "size" + (maxLength ? ' <= ' + maxLength : '');
    };
    ModelTypeArraySizeConstraint.prototype.checkAndAdjustValue = function (v, c) {
        var length = v && v.length;
        var valid = true;
        if (null != length) {
            var _a = this._settings, minLength = _a.minLength, maxLength = _a.maxLength;
            if (null != minLength) {
                valid = valid && (length >= minLength);
            }
            if (null != maxLength) {
                valid = valid && (length <= maxLength);
            }
        }
        return v;
    };
    return ModelTypeArraySizeConstraint;
}(model_base_1.ModelTypeConstraintOptional));
exports.ModelTypeArraySizeConstraint = ModelTypeArraySizeConstraint;
var ModelTypeArrayUniqueElementsConstraint = /** @class */ (function (_super) {
    __extends(ModelTypeArrayUniqueElementsConstraint, _super);
    function ModelTypeArrayUniqueElementsConstraint() {
        return _super.call(this) || this;
    }
    ModelTypeArrayUniqueElementsConstraint.prototype._id = function () {
        return 'uniqueElements';
    };
    ModelTypeArrayUniqueElementsConstraint.prototype.checkAndAdjustValue = function (v, c) {
        var index = 0;
        var dups = [];
        for (var _i = 0, v_1 = v; _i < v_1.length; _i++) {
            var e = v_1[_i];
            var at = v.indexOf(e);
            if (at != index) {
                dups.push(at);
                dups.push(index);
            }
            ++index;
        }
        if (dups.length > 0) {
            c.addMessageEx(!this.isWarningOnly, 'array has duplicates', 'array-unique', { duplicates: dups });
        }
        return v;
    };
    return ModelTypeArrayUniqueElementsConstraint;
}(model_base_1.ModelTypeConstraintOptional));
exports.ModelTypeArrayUniqueElementsConstraint = ModelTypeArrayUniqueElementsConstraint;
//# sourceMappingURL=model.array.js.map