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
    function ModelView(modelType, modelData) {
        this._modelType = modelType;
        this._model = modelData || {};
        this._inputModel = this._model;
    }
    ModelView.prototype.getModelType = function () {
        return this._modelType;
    };
    ModelView.prototype.getModel = function () {
        // TODO: create a read-only view of underlying data
        return this._model;
    };
    ModelView.prototype.withChangedField = function (keyPath, newValue) {
        var path;
        if (Array.isArray(keyPath)) {
            path = keyPath;
        }
        else {
            path = keyPath.split('.');
        }
        var newModel = this._updatedModel(this._inputModel, path, newValue);
        return new ModelView(this._modelType, newModel);
    };
    ModelView.prototype._updatedModel = function (model, keyPath, newValue) {
        var keys = Object.keys(model);
        var result = {};
        var name = keyPath[0];
        var value;
        if (keyPath.length == 1) {
            value = newValue;
        }
        else {
            value = this._updatedModel(model[name] || {}, keyPath.slice(1), newValue);
        }
        for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
            var k = keys_1[_i];
            result[k] = (k == name) ? value : model[k];
        }
        if (!result.hasOwnProperty(name)) {
            result[name] = value;
        }
        return result;
    };
    ModelView.prototype.getFieldValue = function (keyPath) {
        var path;
        if (Array.isArray(keyPath)) {
            path = keyPath;
        }
        else {
            path = keyPath.split('.');
        }
        return path.reduce(function (o, k) { return (o && o[k]); }, this._inputModel);
    };
    ModelView.prototype.getField = function (keyPath) {
        var key = (typeof keyPath === 'string') ? keyPath : keyPath.join('.');
        return this._fields[key];
    };
    return ModelView;
}());
exports.ModelView = ModelView;
//# sourceMappingURL=model.view.js.map