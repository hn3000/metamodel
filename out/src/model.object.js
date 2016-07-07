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
            var result = new ModelTypeObject(this.name + "[" + names.join(',') + "]", this._constructFun); // constructionNotAllowed ?
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
var ModelTypeConstraintEqualFields = (function (_super) {
    __extends(ModelTypeConstraintEqualFields, _super);
    function ModelTypeConstraintEqualFields(fieldsOrSelf) {
        _super.call(this);
        if (Array.isArray(fieldsOrSelf)) {
            this._fields = fieldsOrSelf.slice();
        }
        else {
            this._fields = fieldsOrSelf._fields.slice();
        }
    }
    ModelTypeConstraintEqualFields.prototype._isConstraintEqualFields = function () { }; // marker property
    ModelTypeConstraintEqualFields.prototype._id = function () {
        return "equalFields(" + this._fields.join(',') + ")";
    };
    ModelTypeConstraintEqualFields.prototype.checkAndAdjustValue = function (val, ctx) {
        var fields = this._fields;
        var check = true;
        fields.reduce(function (a, b) { check = check && val[a] == val[b]; return b; });
        var result = val;
        if (!check) {
            for (var _i = 0, fields_1 = fields; _i < fields_1.length; _i++) {
                var f = fields_1[_i];
                ctx.pushItem(f, !this.warnOnly());
                ctx.addError("expected fields to be equal: " + fields.join(',') + ".");
                ctx.popItem();
            }
        }
        return result;
    };
    return ModelTypeConstraintEqualFields;
}(model_base_1.ModelTypeConstraintOptional));
exports.ModelTypeConstraintEqualFields = ModelTypeConstraintEqualFields;
function safeArray(val) {
    return Array.isArray(val) ? val.slice() : [val];
}
var ModelTypeConstraintRequiredIf = (function (_super) {
    __extends(ModelTypeConstraintRequiredIf, _super);
    function ModelTypeConstraintRequiredIf(optionsOrSelf) {
        _super.call(this);
        var options = optionsOrSelf;
        if (options.ifField && options.ifValue && options.required) {
            if (Array.isArray(options.required) && null != options.possibleValues) {
                throw new Error("must not combine list of required fields with possibleValues");
            }
            // so we always have an array:
            var required = safeArray(options.required);
            var ifValue = safeArray(options.ifValue);
            // copy the object so the values can't be switched later:
            this._settings = {
                ifField: options.ifField,
                ifValue: ifValue,
                required: required,
                possibleValues: options.possibleValues
            };
        }
        else if (this._isConstraintRequiredIf == optionsOrSelf["_isConstraintRequiredIf"]) {
            this._settings = optionsOrSelf._settings;
        }
    }
    ModelTypeConstraintRequiredIf.prototype._isConstraintRequiredIf = function () { }; // marker property
    ModelTypeConstraintRequiredIf.prototype._id = function () {
        var o = this._settings;
        var required = Array.isArray(o.required) ? o.required.join(',') : o.required;
        var values = o.possibleValues ? " == ${o.possibleValues}" : "";
        return "requiredIf(" + o.ifField + " == " + o.ifValue + " -> " + required + values + ")";
    };
    ModelTypeConstraintRequiredIf.prototype._checkValue = function (val, possible) {
        if (Array.isArray(possible)) {
            return possible.some(function (x) { return x == val; });
        }
        return val == possible;
    };
    ModelTypeConstraintRequiredIf.prototype._checkIf = function (val) {
        var options = this._settings;
        var fieldValue = val[options.ifField];
        return this._checkValue(fieldValue, options.ifValue);
    };
    ModelTypeConstraintRequiredIf.prototype.checkAndAdjustValue = function (val, ctx) {
        var check = true;
        var s = this._settings;
        if (this._checkIf(val)) {
            var isError = !this.warnOnly;
            for (var _i = 0, _a = s.required; _i < _a.length; _i++) {
                var f = _a[_i];
                ctx.pushItem(f, isError);
                if (s.possibleValues) {
                    if (!this._checkValue(ctx.currentValue, s.possibleValues)) {
                        ctx.addMessage(isError, "required field has forbidden value.", ctx.currentValue, s.possibleValues);
                    }
                }
                else {
                    if (null == ctx.currentValue) {
                        ctx.addMessage(isError, "required field not filled.");
                    }
                }
                ctx.popItem();
            }
        }
        if (!check) {
            for (var _b = 0, _c = s.required; _b < _c.length; _b++) {
                var f = _c[_b];
            }
        }
        return val;
    };
    return ModelTypeConstraintRequiredIf;
}(model_base_1.ModelTypeConstraintOptional));
exports.ModelTypeConstraintRequiredIf = ModelTypeConstraintRequiredIf;
//# sourceMappingURL=model.object.js.map