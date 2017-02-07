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
        compareProperties: function (o) { return new model_object_1.ModelTypeConstraintCompareProperties(o); },
        requiredIf: function (o) {
            return new model_object_1.ModelTypeConstraintConditionalValue({
                condition: o.condition,
                clearOtherwise: o.clearOtherwise,
                properties: o.properties
            });
        },
        valueIf: function (o) {
            return new model_object_1.ModelTypeConstraintConditionalValue({
                condition: o.condition,
                clearOtherwise: false,
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
var SimpleReRE = /^\^\[([^\]\[]+)\][+*]\$$/;
var ModelSchemaParser = (function () {
    function ModelSchemaParser(constraintFactory, defaultValues) {
        this._constraintFactory = constraintFactory || {};
        this._registry = new model_registry_1.ModelTypeRegistry();
        this._defaults = defaultValues || {};
    }
    ModelSchemaParser.prototype.addSchemaFromURL = function (url) {
        var _this = this;
        this._ensureRefProcessor();
        var p = this._refProcessor.expandRef(url);
        return p.then(function (schema) {
            return _this.addSchemaObject(url, schema);
        });
    };
    ModelSchemaParser.prototype.addSchemaObject = function (name, schemaObject, defaults) {
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
                result = this.parseSchemaObjectUntyped(schemaObject);
                //console.log(`don't know how to handle type ${schemaType} in`, schemaObject);
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
        if (this._defaults.strings) {
            if (minLen === undefined) {
                minLen = this._defaults.strings.minLength;
            }
            if (maxLen === undefined) {
                maxLen = this._defaults.strings.maxLength;
            }
            if (pattern === undefined) {
                pattern = this._defaults.strings.pattern;
            }
        }
        var constraints = this._parseConstraints(schemaObject, [constraintFactoriesDefault.strings, constraintFactoriesDefault.universal]);
        if (minLen != null || maxLen != null) {
            constraints = constraints.add(new model_string_1.ModelTypeConstraintLength(minLen, maxLen));
        }
        if (pattern != null) {
            var simpleReMatch = SimpleReRE.exec(pattern);
            if (simpleReMatch) {
                var chars = simpleReMatch[1];
                if (chars.charAt(0) == '^') {
                    chars = chars.substring(1);
                }
                else {
                    chars = '^' + chars;
                }
                constraints = constraints.add(new model_string_1.ModelTypeConstraintInvalidRegex("([" + chars + "])"));
            }
            else {
                constraints = constraints.add(new model_string_1.ModelTypeConstraintRegex(pattern, ''));
            }
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
        if (null != this._defaults.numbers) {
            if (min === undefined) {
                min = this._defaults.numbers.minimum;
            }
            if (minOut === undefined) {
                minOut = this._defaults.numbers.minimumExclusive;
            }
            if (max === undefined) {
                max = this._defaults.numbers.maximum;
            }
            if (maxOut === undefined) {
                maxOut = this._defaults.numbers.maximumExclusive;
            }
            if (multipleOf === undefined) {
                multipleOf = this._defaults.numbers.multipleOf;
            }
        }
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
        var constraints = null;
        var enumConstraint = this.parseSchemaConstraintEnum(schemaObject);
        if (null != enumConstraint) {
            constraints = new model_base_1.ModelConstraints([enumConstraint]);
        }
        return new model_bool_1.ModelTypeBool(constraints);
    };
    ModelSchemaParser.prototype.parseSchemaObjectTypeObject = function (schemaObject, name) {
        var id = name || schemaObject.id || anonymousId();
        var constraints = this._parseConstraints(schemaObject, [constraintFactoriesDefault.objects, constraintFactoriesDefault.universal]);
        var type;
        var props = schemaObject['properties'];
        var keys = props && Object.keys(props);
        var dependencies = schemaObject['dependencies'];
        if (null != dependencies) {
            var deps = Object.keys(dependencies);
            for (var _i = 0, deps_1 = deps; _i < deps_1.length; _i++) {
                var d = deps_1[_i];
                if (Array.isArray(dependencies[d])) {
                    var dependentProperties = dependencies[d];
                    constraints = constraints.add(new model_object_1.ModelTypeConstraintConditionalValue({
                        condition: {
                            property: d,
                            invert: true,
                            value: null
                        },
                        properties: dependentProperties,
                        clearOtherwise: false
                    }));
                }
            }
        }
        type = new model_object_1.ModelTypeObject(id, null, constraints);
        var required = schemaObject['required'] || [];
        if (props) {
            for (var _a = 0, keys_2 = keys; _a < keys_2.length; _a++) {
                var key = keys_2[_a];
                var isRequired = (-1 != required.indexOf(key));
                type.addItem(key, this.parseSchemaObject(props[key], key), isRequired);
            }
        }
        var allOf = schemaObject['allOf'];
        if (allOf && Array.isArray(allOf)) {
            var index = 0;
            for (var _b = 0, allOf_1 = allOf; _b < allOf_1.length; _b++) {
                var inner = allOf_1[_b];
                var innerType = this.parseSchemaObjectTypeObject(inner, name + "/allOf[" + index + "]");
                if (innerType.items) {
                    type = type.extend(innerType);
                }
                ++index;
            }
        }
        if (0 == type.items.length) {
            return new model_object_1.ModelTypeAny(id, null, constraints);
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
        if (null == elementType) {
            elementType = new model_object_1.ModelTypeAny("any");
        }
        var type = new model_array_1.ModelTypeArray(elementType);
        return type;
    };
    ModelSchemaParser.prototype.parseSchemaObjectUntyped = function (schemaObject, name) {
        if (schemaObject.properties || schemaObject.allOf) {
            return this.parseSchemaObjectTypeObject(schemaObject, name);
        }
        console.log("no implementation for schema type " + schemaObject.type + " in " + JSON.stringify(schemaObject));
        return new model_object_1.ModelTypeAny(name);
    };
    ModelSchemaParser.prototype._parseConstraints = function (schemaObject, factories) {
        var _this = this;
        var constraints = schemaObject.constraints;
        if (constraints && Array.isArray(constraints)) {
            var cc = constraints.map(function (c) {
                var factory;
                factory = _this._constraintFactory[c.constraint];
                if (!factory) {
                    factory = findfirst(factories, c.constraint);
                }
                if (!factory) {
                    console.log("unrecognized constraint", c.constraint, c);
                }
                return factory && factory(c);
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
//# sourceMappingURL=model.schema.js.map