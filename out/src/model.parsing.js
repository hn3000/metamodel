"use strict";
var model_registry_1 = require("./model.registry");
var model_base_1 = require("./model.base");
var model_number_1 = require("./model.number");
var model_string_1 = require("./model.string");
var model_bool_1 = require("./model.bool");
var model_array_1 = require("./model.array");
var model_object_1 = require("./model.object");
var json_ptr_1 = require("./json-ptr");
var fetch = require("isomorphic-fetch");
var ModelSchemaParser = (function () {
    function ModelSchemaParser() {
        this._registry = new model_registry_1.ModelTypeRegistry();
    }
    ModelSchemaParser.prototype.addSchemaFromURL = function (url) {
        var _this = this;
        this._ensureRefProcessor();
        var p = this._refProcessor.expandRef(url);
        return p.then(function (schema) {
            return _this.addSchemaObject(url, schema);
        });
    };
    ModelSchemaParser.prototype.addSchemaObject = function (name, schemaObject) {
        var type = this.parseSchemaObject(schemaObject, name);
        type && this._registry.addType(type);
        return type;
    };
    ModelSchemaParser.prototype.parseSchemaObject = function (schemaObject, name) {
        var schemaType = schemaObject['type'];
        var result = null;
        switch (schemaType) {
            case 'object':
                result = this.parseSchemaObjectTypeObject(schemaObject, name);
                break;
            case 'array':
                result = this.parseSchemaObjectTypeArray(schemaObject);
                break;
            case 'string':
                result = this.parseSchemaObjectTypeString(schemaObject);
                break;
            case 'number':
                result = this.parseSchemaObjectTypeNumber(schemaObject);
                break;
            case 'integer':
                result = this.parseSchemaObjectTypeNumber(schemaObject, new model_number_1.ModelTypeConstraintInteger());
                break;
            case 'boolean':
                result = this.parseSchemaObjectTypeString(schemaObject);
                break;
            case 'bool':
                console.log("warning: non-standard type 'bool' found in schema");
                result = this.parseSchemaObjectTypeString(schemaObject);
                break;
            default:
                console.log("don't know how to handle " + schemaObject + " / " + schemaType);
                break;
        }
        if (result != null) {
            result.propSet("schema", schemaObject);
        }
        return result;
    };
    ModelSchemaParser.prototype.parseSchemaConstraintEnum = function (schemaObject) {
        var e = schemaObject['enum'];
        if (Array.isArray(e)) {
            return new model_string_1.ModelTypeConstraintPossibleValues(e);
        }
        return null;
    };
    ModelSchemaParser.prototype.parseSchemaObjectTypeString = function (schemaObject) {
        var minLen = schemaObject['minLength'];
        var maxLen = schemaObject['maxLength'];
        var pattern = schemaObject['pattern'];
        var constraints = [];
        if (minLen != null || maxLen != null) {
            var msg;
            if (minLen == null || minLen == 0) {
                msg = "length must be at most " + maxLen + ":";
            }
            else if (maxLen == null) {
                msg = "length must be at least " + (minLen || 0) + ":";
            }
            else {
                msg = "length must be between " + (minLen || 0) + " and " + maxLen + ":";
            }
            var expr = "^.{" + (minLen || 0) + "," + (maxLen || '') + "}$";
            constraints.push(new model_string_1.ModelTypeConstraintRegex(expr, '', msg));
        }
        if (pattern != null) {
            constraints.push(new model_string_1.ModelTypeConstraintRegex(pattern, ''));
        }
        var enumConstraint = this.parseSchemaConstraintEnum(schemaObject);
        if (null != enumConstraint) {
            constraints.push(enumConstraint);
        }
        return new model_string_1.ModelTypeString(new model_base_1.ModelConstraints(constraints));
    };
    ModelSchemaParser.prototype.parseSchemaObjectTypeNumber = function (schemaObject) {
        var constraints = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            constraints[_i - 1] = arguments[_i];
        }
        var min = schemaObject['minimum'];
        var max = schemaObject['maximum'];
        var minOut = schemaObject['minimumExclusive'];
        var maxOut = schemaObject['maximumExclusive'];
        var multipleOf = schemaObject['multipleOf'];
        if (typeof (min) === "number") {
            if (minOut) {
                constraints.push(new model_number_1.ModelTypeConstraintMore(min));
            }
            else {
                constraints.push(new model_number_1.ModelTypeConstraintMoreEqual(min));
            }
        }
        if (typeof (max) === "number") {
            if (maxOut) {
                constraints.push(new model_number_1.ModelTypeConstraintLess(max));
            }
            else {
                constraints.push(new model_number_1.ModelTypeConstraintLessEqual(max));
            }
        }
        if (typeof (multipleOf) === "number") {
            constraints.push(new model_number_1.ModelTypeConstraintMultipleOf(multipleOf));
        }
        var enumConstraint = this.parseSchemaConstraintEnum(schemaObject);
        if (null != enumConstraint) {
            constraints.push(enumConstraint);
        }
        return new model_number_1.ModelTypeNumber(new model_base_1.ModelConstraints(constraints));
    };
    ModelSchemaParser.prototype.parseSchemaObjectTypeBool = function (schemaObject) {
        return new model_bool_1.ModelTypeBool();
    };
    ModelSchemaParser.prototype.parseSchemaObjectTypeObject = function (schemaObject, name) {
        var id = name || schemaObject.id || anonymousId();
        var type = new model_object_1.ModelTypeObject(id);
        var props = schemaObject['properties'];
        if (props) {
            var keys = Object.keys(props);
            for (var i = 0, n = keys.length; i < n; ++i) {
                var key = keys[i];
                type.addItem(key, this.parseSchemaObject(props[key], key));
            }
        }
        return type;
    };
    ModelSchemaParser.prototype.parseSchemaObjectTypeArray = function (schemaObject, name) {
        var elementType = this.parseSchemaObject(schemaObject.items);
        var type = new model_array_1.ModelTypeArray(elementType);
        return type;
    };
    ModelSchemaParser.prototype.type = function (name) { return this._registry.type(name); };
    ModelSchemaParser.prototype.itemType = function (name) { return this._registry.itemType(name); };
    ModelSchemaParser.prototype.addType = function (type) { this._registry.addType(type); };
    ModelSchemaParser.prototype.getRegisteredNames = function () { return this._registry.getRegisteredNames(); };
    ModelSchemaParser.prototype._ensureRefProcessor = function () {
        if (!this._refProcessor) {
            this._refProcessor = new json_ptr_1.JsonReferenceProcessor(fetchFetcher);
        }
    };
    return ModelSchemaParser;
}());
exports.ModelSchemaParser = ModelSchemaParser;
function anonymousId(prefix) {
    var suffix = (Math.floor(Math.random() * 10e6) + (Date.now() * 10e6)).toString(36);
    return (prefix || 'anon') + suffix;
}
function fetchFetcher(url) {
    var p = fetch(url);
    return p.then(function (r) {
        if (r.status < 300) {
            var x = r.text();
            return x;
        }
        return null;
    });
}
//# sourceMappingURL=model.parsing.js.map