"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var model_base_1 = require("./model.base");
function constructionNotAllowed() {
    throw new Error('can not use subtype for construction');
}
var ModelTypeObject = (function (_super) {
    __extends(ModelTypeObject, _super);
    function ModelTypeObject(name, construct, constraints) {
        _super.call(this, name, constraints);
        this._constructFun = construct || (function () { return ({}); });
        this._entries = [];
        this._entriesByName = {};
    }
    ModelTypeObject.prototype._clone = function (constraints) {
        return new this.constructor(this.name, this._constructFun, constraints);
    };
    ModelTypeObject.prototype.asItemType = function () {
        return null;
    };
    ModelTypeObject.prototype.addItem = function (key, type, required) {
        if (null == key) {
            throw new Error("addItem requires valid key, got " + key + " and type " + type);
        }
        if (null == type) {
            throw new Error("addItem requires valid type, got " + type + " for key " + key);
        }
        if (null == this._entriesByName[key]) {
            var entry = {
                key: key, type: type, required: required
            };
            this._entries.push(entry);
            this._entriesByName[key] = entry;
        }
        return this;
    };
    ModelTypeObject.prototype.subModel = function (name) {
        if (typeof name === 'string' || typeof name === 'number') {
            var entry = this._entriesByName[name];
            return entry && entry.type;
        }
        return null;
    };
    ModelTypeObject.prototype.slice = function (names) {
        if (Array.isArray(names)) {
            var result = new ModelTypeObject(this.name + "[" + names.join(',') + "]", constructionNotAllowed);
            for (var _i = 0, names_1 = names; _i < names_1.length; _i++) {
                var name = names_1[_i];
                var entry = this._entriesByName[name];
                if (entry) {
                    result.addItem('' + name, entry.type, entry.required);
                }
            }
            return result;
        }
        return null;
    };
    ModelTypeObject.prototype.extend = function (type) {
        return this;
    };
    Object.defineProperty(ModelTypeObject.prototype, "items", {
        get: function () {
            return this._entries;
        },
        enumerable: true,
        configurable: true
    });
    ModelTypeObject.prototype.parse = function (ctx) {
        var result = this.create();
        for (var _i = 0, _a = this._entries; _i < _a.length; _i++) {
            var e = _a[_i];
            ctx.pushItem(e.key, e.required);
            result[e.key] = e.type.parse(ctx);
            ctx.popItem();
        }
        return result;
    };
    ModelTypeObject.prototype.validate = function (ctx) {
        for (var _i = 0, _a = this._entries; _i < _a.length; _i++) {
            var e = _a[_i];
            ctx.pushItem(e.key, e.required);
            e.type.validate(ctx);
            ctx.popItem();
        }
    };
    ModelTypeObject.prototype.unparse = function (value) {
        var result = {};
        var val = value;
        for (var _i = 0, _a = this._entries; _i < _a.length; _i++) {
            var e = _a[_i];
            var item = val[e.key];
            if (undefined !== item) {
                result[e.key] = e.type.unparse(item);
            }
        }
        return result;
    };
    ModelTypeObject.prototype.create = function () {
        return this._constructFun ? this._constructFun() : {};
    };
    ModelTypeObject.prototype._kind = function () { return 'object'; };
    return ModelTypeObject;
}(model_base_1.ModelTypeConstrainable));
exports.ModelTypeObject = ModelTypeObject;
//# sourceMappingURL=model.object.js.map