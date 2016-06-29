"use strict";
var model_infra_1 = require("./model.infra");
var ModelViewField = (function () {
    function ModelViewField() {
    }
    ModelViewField.prototype.validate = function (val) {
        var ctx = new model_infra_1.ModelParseContext(val);
        this.type.validate(ctx);
        return ctx.errors.concat(ctx.warnings);
    };
    return ModelViewField;
}());
exports.ModelViewField = ModelViewField;
/**
 * Provides an immutable facade for a model, adding IModelType
 * based validation and support for copy-on-write mutation.
 *
 */
var ModelView = (function () {
    function ModelView(modelType) {
        this._modelType = modelType;
    }
    ModelView.prototype.getModelType = function () {
        return this._modelType;
    };
    ModelView.prototype.getModel = function () {
        // TODO: create a read-only view of underlying data
        return this._model;
    };
    ModelView.prototype.changeField = function (keyPath, newValue) {
        return null;
    };
    ModelView.prototype.getFieldValue = function (keyPath) {
        var path;
        if (Array.isArray(keyPath)) {
            path = keyPath;
        }
        else {
            path = keyPath.split('.');
        }
        return path.reduce(function (o, k) { return (o && o[k]); }, this._model);
    };
    ModelView.prototype.getField = function (keyPath) {
        var key = (typeof keyPath === 'string') ? keyPath : keyPath.join('.');
        return this._fields[key];
    };
    return ModelView;
}());
exports.ModelView = ModelView;
//# sourceMappingURL=model.view.js.map