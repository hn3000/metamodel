"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var model_base_1 = require("./model.base");
var ModelTypeArray = (function (_super) {
    __extends(ModelTypeArray, _super);
    function ModelTypeArray(elementType, constraints) {
        _super.call(this, elementType.name + "[]", constraints);
        this._elementType = elementType;
    }
    ModelTypeArray.prototype.parse = function (ctx) {
        var result = [];
        var source = ctx.currentValue();
        // TODO: determine minimum length and maximum length from constraints?
        for (var i = 0, n = source.length; i < n; ++i) {
            ctx.pushItem(i, false);
            result[i] = this._elementType.parse(ctx);
            ctx.popItem();
        }
        result = this._checkAndAdjustValue(result, ctx);
        return result;
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
    ModelTypeArray.prototype._kind = function () { return 'array'; };
    return ModelTypeArray;
}(model_base_1.ModelTypeConstrainable));
exports.ModelTypeArray = ModelTypeArray;
//# sourceMappingURL=model.array.js.map