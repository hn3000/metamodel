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
        var result = new this.constructor(this.name, this._constructFun, constraints);
        for (var _i = 0, _a = this._entries; _i < _a.length; _i++) {
            var e = _a[_i];
            result.addItem(e.key, e.type, e.required);
        }
        return result;
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
    ModelTypeObject.prototype.itemType = function (name) {
        if (typeof name === 'string' || typeof name === 'number') {
            var entry = this._entriesByName[name];
            return entry && entry.type;
        }
        return null;
    };
    ModelTypeObject.prototype.slice = function (names) {
        if (Array.isArray(names)) {
            var filteredConstraints = this._getConstraints().slice(names);
            var result = new ModelTypeObject(this.name + "[" + names.join(',') + "]", this._constructFun, filteredConstraints); // constructionNotAllowed ?
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
        var constraints = type.findConstraints(function () { return true; });
        var result = this.withConstraints.apply(this, constraints);
        for (var _i = 0, _a = type.items; _i < _a.length; _i++) {
            var item = _a[_i];
            var key = item.key, type_1 = item.type, required = item.required;
            result.addItem(key, type_1, required);
        }
        return result;
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
            ctx.pushItem(e.key, e.required, e.type);
            result[e.key] = e.type.parse(ctx);
            ctx.popItem();
        }
        return result;
    };
    ModelTypeObject.prototype.validate = function (ctx) {
        for (var _i = 0, _a = this._entries; _i < _a.length; _i++) {
            var e = _a[_i];
            ctx.pushItem(e.key, e.required, e.type);
            e.type.validate(ctx);
            ctx.popItem();
        }
        this._checkAndAdjustValue(ctx.currentValue(), ctx);
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
function safeArray(val) {
    return Array.isArray(val) ? val.slice() : null != val ? [val] : null;
}
var ModelTypeConstraintEqualProperties = (function (_super) {
    __extends(ModelTypeConstraintEqualProperties, _super);
    function ModelTypeConstraintEqualProperties(fieldsOrSelf) {
        _super.call(this);
        if (Array.isArray(fieldsOrSelf)) {
            this._fields = fieldsOrSelf.slice();
        }
        else if (fieldsOrSelf && fieldsOrSelf.properties) {
            this._fields = safeArray(fieldsOrSelf.properties);
        }
        else {
            this._fields = fieldsOrSelf._fields.slice();
        }
    }
    ModelTypeConstraintEqualProperties.prototype._isConstraintEqualFields = function () { }; // marker property
    ModelTypeConstraintEqualProperties.prototype._id = function () {
        return "equalFields(" + this._fields.join(',') + ")";
    };
    ModelTypeConstraintEqualProperties.prototype.checkAndAdjustValue = function (val, ctx) {
        var fields = this._fields;
        var values = fields.reduce(function (acc, k) {
            if (-1 == acc.indexOf(val[k])) {
                acc.push(val[k]);
            }
            return acc;
        }, []);
        var result = val;
        if (values.length !== 1) {
            for (var _i = 0, fields_1 = fields; _i < fields_1.length; _i++) {
                var f = fields_1[_i];
                ctx.pushItem(f, !this.warnOnly(), null);
                ctx.addErrorEx("expected fields to be equal: " + fields.join(',') + ".", 'properties-different', { value: val, values: values, fields: fields.join(',') });
                ctx.popItem();
            }
        }
        return result;
    };
    ModelTypeConstraintEqualProperties.prototype.usedItems = function () { return this._fields; };
    return ModelTypeConstraintEqualProperties;
}(model_base_1.ModelTypeConstraintOptional));
exports.ModelTypeConstraintEqualProperties = ModelTypeConstraintEqualProperties;
function createPredicateEquals(property, value, invert) {
    if (Array.isArray(value)) {
        var valueArray_1 = value.slice();
        return function (x) {
            var p = x[property];
            return (p !== undefined) && (-1 != valueArray_1.indexOf(p)) == !invert;
        };
    }
    return function (x) {
        var p = x[property];
        return (p !== undefined) && (value === p) == !invert;
    };
}
function createPredicate(condition) {
    var property = condition.property, value = condition.value, op = condition.op, invert = condition.invert;
    switch (op) {
        case undefined:
        case null:
        case '=': return createPredicateEquals(property, value, invert);
    }
    return function () { return false; };
}
function createValuePredicate(possibleValues) {
    if (null == possibleValues || 0 === possibleValues.length) {
        return function (x) { return x != null; };
    }
    else if (possibleValues.length == 1) {
        var val_1 = possibleValues[0];
        return function (x) { return x == val_1; };
    }
    else {
        var valArray_1 = possibleValues;
        return function (x) { return -1 != valArray_1.indexOf(x); };
    }
}
var ModelTypeConstraintConditionalValue = (function (_super) {
    __extends(ModelTypeConstraintConditionalValue, _super);
    function ModelTypeConstraintConditionalValue(optionsOrSelf) {
        _super.call(this);
        var options = optionsOrSelf;
        if (options.condition && options.properties) {
            var condition = options.condition, properties = options.properties, possibleValue = options.possibleValue;
            var multiple = Array.isArray(properties) && properties.length > 1;
            if (multiple && null != possibleValue && !Array.isArray(possibleValue)) {
                throw new Error("must not combine list of required fields with single possibleValue");
            }
            var props = safeArray(properties);
            var allowed = safeArray(possibleValue);
            var id_p = props.join(',');
            var id_v = allowed ? " == [" + allowed.join(',') + "]" : "";
            var id = "conditionalValue(" + condition.property + " == " + condition.value + " -> " + id_p + id_v + ")";
            this._settings = {
                predicate: createPredicate(condition),
                valueCheck: createValuePredicate(allowed),
                properties: props,
                possibleValues: allowed,
                id: id
            };
        }
        else if (this._isConstraintConditionalValue == optionsOrSelf["_isConstraintConditionalValue"]) {
            this._settings = optionsOrSelf._settings;
        }
        else {
            console.log("invalid constructor argument", optionsOrSelf);
            throw new Error("invalid constructor argument" + optionsOrSelf);
        }
    }
    ModelTypeConstraintConditionalValue.prototype._isConstraintConditionalValue = function () { }; // marker property
    ModelTypeConstraintConditionalValue.prototype._id = function () {
        return this._settings.id;
    };
    ModelTypeConstraintConditionalValue.prototype.checkAndAdjustValue = function (val, ctx) {
        var check = true;
        var s = this._settings;
        if (s.predicate(val)) {
            var isError = !this.isWarningOnly;
            for (var _i = 0, _a = s.properties; _i < _a.length; _i++) {
                var f = _a[_i];
                ctx.pushItem(f, isError, null);
                var thisValue = ctx.currentValue();
                var valid = s.valueCheck(thisValue);
                if (!valid) {
                    if (s.possibleValues) {
                        ctx.addMessageEx(isError, "illegal value.", 'value-illegal', { value: ctx.currentValue(), allowed: s.possibleValues });
                    }
                    else {
                        ctx.addMessage(isError, "required field not filled.", 'required-empty');
                    }
                }
                ctx.popItem();
            }
        }
        return val;
    };
    ModelTypeConstraintConditionalValue.prototype.usedItems = function () { return this._settings.properties; };
    return ModelTypeConstraintConditionalValue;
}(model_base_1.ModelTypeConstraintOptional));
exports.ModelTypeConstraintConditionalValue = ModelTypeConstraintConditionalValue;
/**
 * can be used for validation, only, not for value modification
 */
var ModelTypePropertyConstraint = (function (_super) {
    __extends(ModelTypePropertyConstraint, _super);
    function ModelTypePropertyConstraint(property, constraint) {
        _super.call(this);
        this._property = property;
        this._constraint = constraint;
    }
    ModelTypePropertyConstraint.prototype._id = function () {
        return this._constraint.id + "@" + this._property;
    };
    ModelTypePropertyConstraint.prototype.checkAndAdjustValue = function (val, ctx) {
        ctx.pushItem(this._property, false, null);
        var value = ctx.currentValue();
        try {
            this._constraint.checkAndAdjustValue(value, ctx);
        }
        catch (error) {
            ctx.addMessageEx(!this.isWarningOnly, 'value had unexpected type', 'value-type', { value: value, error: error });
        }
        ctx.popItem();
        return val;
    };
    ModelTypePropertyConstraint.prototype.usedItems = function () { return [this._property]; };
    return ModelTypePropertyConstraint;
}(model_base_1.ModelTypeConstraintOptional));
exports.ModelTypePropertyConstraint = ModelTypePropertyConstraint;
//# sourceMappingURL=model.object.js.map