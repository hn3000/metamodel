"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var model_infra_1 = require("./model.infra");
var model_base_1 = require("./model.base");
var ModelTypeBool = (function (_super) {
    __extends(ModelTypeBool, _super);
    function ModelTypeBool(c) {
        _super.call(this, 'boolean', c);
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
            ctx.addError('can not convert to boolean', val);
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
    ModelTypeBool.prototype.fromString = function (val) {
        var result = this._parseString(val);
        var ctx = new model_infra_1.ModelParseContext(result);
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