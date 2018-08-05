"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var model_infra_1 = require("./model.infra");
var model_base_1 = require("./model.base");
var ModelTypeBool = /** @class */ (function (_super) {
    __extends(ModelTypeBool, _super);
    function ModelTypeBool(name, c) {
        if (name === void 0) { name = 'boolean'; }
        return _super.call(this, name, c) || this;
    }
    ModelTypeBool.prototype.lowerBound = function () { return null; };
    ;
    ModelTypeBool.prototype.upperBound = function () { return null; };
    ;
    ModelTypeBool.prototype.parse = function (ctx) {
        var val = ctx.currentValue();
        var result = null;
        if (typeof val === 'boolean') {
            result = val;
        }
        else if (typeof val === 'string') {
            result = this._parseString(val);
        }
        if (null == result && ctx.currentRequired()) {
            if (val == null) {
                ctx.addErrorEx('required value is missing', 'required-empty', { value: val });
            }
            else {
                ctx.addErrorEx('can not convert to boolean', 'value-type', { value: val });
            }
        }
        else {
            result = this._checkAndAdjustValue(result, ctx);
        }
        return result;
    };
    ModelTypeBool.prototype.validate = function (ctx) {
        this.parse(ctx);
    };
    ModelTypeBool.prototype.unparse = function (value) {
        return value;
    };
    ModelTypeBool.prototype.create = function () {
        return false;
    };
    ModelTypeBool.prototype.possibleValues = function () {
        var pv = _super.prototype.possibleValues.call(this);
        return pv || [true, false];
    };
    ModelTypeBool.prototype.fromString = function (val) {
        var result = this._parseString(val);
        var ctx = new model_infra_1.ModelParseContext(result, this);
        result = this._checkAndAdjustValue(result, ctx);
        return result;
    };
    ModelTypeBool.prototype.asString = function (val) {
        return val.toString();
    };
    ModelTypeBool.prototype._kind = function () { return 'bool'; };
    ModelTypeBool.prototype._parseString = function (val) {
        var result = null;
        switch (val) {
            case 'true':
            case 'yes':
            case 'checked':
                result = true;
                break;
            case 'false':
            case 'no':
                result = false;
                break;
        }
        return result;
    };
    return ModelTypeBool;
}(model_base_1.ModelTypeItem));
exports.ModelTypeBool = ModelTypeBool;
//# sourceMappingURL=model.bool.js.map