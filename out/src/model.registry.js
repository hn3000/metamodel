"use strict";
var model_infra_1 = require("./model.infra");
var model_array_1 = require("./model.array");
var model_object_1 = require("./model.object");
var ModelTypeRegistry = (function () {
    function ModelTypeRegistry() {
        this._types = {};
        this._itemTypes = {};
    }
    ModelTypeRegistry.prototype.asItemType = function (type) {
        var result = type;
        if (!result.withConstraints) {
            result = null;
        }
        return result;
    };
    ModelTypeRegistry.prototype.removeType = function (name) {
        if (this._types.hasOwnProperty(name)) {
            delete this._types[name];
            delete this._itemTypes[name];
        }
    };
    ModelTypeRegistry.prototype.addType = function (type) {
        var name = type.name;
        var oldType = this._types[name];
        if (oldType && oldType != type) {
            console.warn("redefining type " + name, type);
        }
        this._types[name] = type;
        var itemType = this.asItemType(type);
        if (itemType) {
            this._itemTypes[name] = itemType;
        }
        return type;
    };
    ModelTypeRegistry.prototype.addObjectType = function (name, construct) {
        var result = new model_object_1.ModelTypeObject(name, construct);
        this.addType(result);
        return result;
    };
    ModelTypeRegistry.prototype.addArrayType = function (type) {
        var result = new model_array_1.ModelTypeArray(type);
        this.addType(result);
        return result;
    };
    ModelTypeRegistry.prototype.type = function (name) {
        return this._types[name];
    };
    ModelTypeRegistry.prototype.itemType = function (name) {
        return this._itemTypes[name];
    };
    ModelTypeRegistry.prototype.getRegisteredNames = function () {
        return Object.keys(this._types);
    };
    ModelTypeRegistry.prototype.createParseContext = function (obj, type) {
        return new model_infra_1.ModelParseContext(obj, type);
    };
    return ModelTypeRegistry;
}());
exports.ModelTypeRegistry = ModelTypeRegistry;
//# sourceMappingURL=model.registry.js.map