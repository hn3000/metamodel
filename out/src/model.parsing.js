"use strict";
var model_registry_1 = require("./model.registry");
var model_base_1 = require("./model.base");
var model_number_1 = require("./model.number");
var model_string_1 = require("./model.string");
var model_date_1 = require("./model.date");
var model_bool_1 = require("./model.bool");
var model_array_1 = require("./model.array");
var model_object_1 = require("./model.object");
var json_ref_1 = require("@hn3000/json-ref");
var fetch = require("isomorphic-fetch");
function shallowMerge(a, b) {
    var result = {};
    var tmp = {};
    Object.keys(a).forEach(function (x) { return tmp[x] = x; });
    Object.keys(b).forEach(function (x) { return tmp[x] = x; });
    var keys = Object.keys(tmp);
    for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
        var k = keys_1[_i];
        result[k] = null != b[k] ? b[k] : a[k];
    }
    return result;
}
function parseAge(o) {
    var result = o.age ? o.age : o.years ? o.years + 'y' : '0y';
    return result;
}
var constraintFactoriesDefault = {
    numbers: {},
    strings: {
        minAge: function (o) { return new model_date_1.ModelTypeConstraintOlder(parseAge(o)); },
        before: function (o) { return new model_date_1.ModelTypeConstraintBefore(o.date); },
        after: function (o) { return new model_date_1.ModelTypeConstraintAfter(o.date); }
    },
    dates: {
        minAge: function (o) { return new model_date_1.ModelTypeConstraintOlder(o.age); },
        before: function (o) { return new model_date_1.ModelTypeConstraintBefore(o.date); },
        after: function (o) { return new model_date_1.ModelTypeConstraintAfter(o.date); }
    },
    booleans: {},
    objects: {
        minAge: function (o) {
            return new model_object_1.ModelTypePropertyConstraint(o.property, new model_date_1.ModelTypeConstraintOlder(parseAge(o)));
        },
        before: function (o) {
            return new model_object_1.ModelTypePropertyConstraint(o.property, new model_date_1.ModelTypeConstraintBefore(o.date));
        },
        after: function (o) {
            return new model_object_1.ModelTypePropertyConstraint(o.property, new model_date_1.ModelTypeConstraintAfter(o.date));
        },
        equalProperties: function (o) { return new model_object_1.ModelTypeConstraintEqualProperties(o); },
        requiredIf: function (o) {
            return new model_object_1.ModelTypeConstraintConditionalValue({
                condition: o.condition,
                properties: o.properties
            });
        },
        valueIf: function (o) {
            return new model_object_1.ModelTypeConstraintConditionalValue({
                condition: o.condition,
                properties: o.valueProperty,
                possibleValue: o.possibleValue
            });
        }
    },
    universal: {
        possibleValue: function (o) { return new model_string_1.ModelTypeConstraintPossibleValues(o); },
        possibleValues: function (o) { return new model_string_1.ModelTypeConstraintPossibleValues(o); },
    }
};
var ModelSchemaParser = (function () {
    function ModelSchemaParser(constraintFactory) {
        this._constraintFactory = constraintFactory || {};
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
                result = this.parseSchemaObjectTypeBool(schemaObject);
                break;
            case 'bool':
                console.log("warning: non-standard type 'bool' found in schema");
                result = this.parseSchemaObjectTypeString(schemaObject);
                break;
            default:
                console.log("don't know how to handle type " + schemaType + " in", schemaObject);
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
        var constraints = this._parseConstraints(schemaObject, [constraintFactoriesDefault.strings, constraintFactoriesDefault.universal]);
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
            constraints = constraints.add(new model_string_1.ModelTypeConstraintRegex(expr, '', msg));
        }
        if (pattern != null) {
            constraints = constraints.add(new model_string_1.ModelTypeConstraintRegex(pattern, ''));
        }
        var enumConstraint = this.parseSchemaConstraintEnum(schemaObject);
        if (null != enumConstraint) {
            constraints = constraints.add(enumConstraint);
        }
        return new model_string_1.ModelTypeString(constraints);
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
        var constraints = this._parseConstraints(schemaObject, [constraintFactoriesDefault.objects, constraintFactoriesDefault.universal]);
        var type;
        type = new model_object_1.ModelTypeObject(id, null, constraints);
        var required = schemaObject['required'] || [];
        var props = schemaObject['properties'];
        if (props) {
            var keys = Object.keys(props);
            for (var _i = 0, keys_2 = keys; _i < keys_2.length; _i++) {
                var key = keys_2[_i];
                var isRequired = (-1 != required.indexOf(key));
                type.addItem(key, this.parseSchemaObject(props[key], key), isRequired);
            }
        }
        var allOf = schemaObject['allOf'];
        if (allOf && Array.isArray(allOf)) {
            var index = 0;
            for (var _a = 0, allOf_1 = allOf; _a < allOf_1.length; _a++) {
                var inner = allOf_1[_a];
                var innerType = this.parseSchemaObjectTypeObject(inner, name + "/allOf[" + index + "]");
                type = type.extend(innerType);
                ++index;
            }
        }
        return type;
    };
    ModelSchemaParser.prototype.parseSchemaObjectTypeArray = function (schemaObject, name) {
        var elementType = null;
        if (Array.isArray(schemaObject.items)) {
            console.log('metamodel unhandled schema construct: array items property is array');
        }
        else {
            elementType = this.parseSchemaObject(schemaObject.items);
        }
        if (null != elementType) {
            elementType = new model_object_1.ModelTypeObject("any");
        }
        var type = new model_array_1.ModelTypeArray(elementType);
        return type;
    };
    ModelSchemaParser.prototype._parseConstraints = function (schemaObject, factories) {
        var constraints = schemaObject.constraints;
        if (constraints && Array.isArray(constraints)) {
            var cc = constraints.map(function (c) {
                var fact = findfirst(factories, c.constraint);
                if (!fact) {
                    console.log("unrecognized constraint", c.constraint, c);
                }
                return fact && fact(c);
            }).filter(function (x) { return x != null; });
            return new model_base_1.ModelConstraints(cc);
        }
        return new model_base_1.ModelConstraints([]);
    };
    ModelSchemaParser.prototype.type = function (name) { return this._registry.type(name); };
    ModelSchemaParser.prototype.itemType = function (name) { return this._registry.itemType(name); };
    ModelSchemaParser.prototype.addType = function (type) { this._registry.addType(type); };
    ModelSchemaParser.prototype.getRegisteredNames = function () { return this._registry.getRegisteredNames(); };
    ModelSchemaParser.prototype._ensureRefProcessor = function () {
        if (!this._refProcessor) {
            this._refProcessor = new json_ref_1.JsonReferenceProcessor(fetchFetcher);
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
function findfirst(tt, name) {
    for (var _i = 0, tt_1 = tt; _i < tt_1.length; _i++) {
        var t = tt_1[_i];
        if (t[name])
            return t[name];
    }
    return null;
}
//# sourceMappingURL=model.parsing.js.map