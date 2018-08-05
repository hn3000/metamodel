"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var ClientProps = /** @class */ (function () {
    function ClientProps() {
        this._data = {};
    }
    ClientProps.prototype.propExists = function (key) {
        return this._data.hasOwnProperty(key);
    };
    ClientProps.prototype.propGet = function (key) {
        return this._data[key];
    };
    ClientProps.prototype.propSet = function (key, val) {
        this._data[key] = val;
    };
    ClientProps.prototype.propKeys = function () {
        return Object.keys(this._data);
    };
    ClientProps.prototype.propsCopyFrom = function (that) {
        for (var _i = 0, _a = that.propKeys(); _i < _a.length; _i++) {
            var k = _a[_i];
            this.propSet(k, that.propGet(k));
        }
    };
    return ClientProps;
}());
exports.ClientProps = ClientProps;
var ModelConstraints = /** @class */ (function () {
    function ModelConstraints(constraints) {
        if (Array.isArray(constraints)) {
            this._constraints = constraints.slice();
        }
    }
    Object.defineProperty(ModelConstraints.prototype, "id", {
        get: function () {
            return this._constraints.map(function (x) { return x.id; }).join('+');
        },
        enumerable: true,
        configurable: true
    });
    ModelConstraints.prototype.checkAndAdjustValue = function (val, ctx) {
        var result = val;
        for (var _i = 0, _a = this._constraints; _i < _a.length; _i++) {
            var c = _a[_i];
            result = c.checkAndAdjustValue(result, ctx);
        }
        return result;
    };
    ModelConstraints.prototype.add = function () {
        var c = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            c[_i] = arguments[_i];
        }
        return new ModelConstraints(this._constraints.concat(c));
    };
    ModelConstraints.prototype.filter = function (p) {
        return this._constraints.filter(p);
    };
    ModelConstraints.prototype.slice = function (names) {
        var nn = names;
        var innames = function (n) { return -1 != nn.indexOf(n); };
        var predicate = function (x) {
            return x && (!x.usedItems || !x.usedItems() || x.usedItems().every(innames));
        };
        return new ModelConstraints(this.filter(predicate));
    };
    ModelConstraints.prototype.toString = function () {
        return this._constraints.map(function (x) { return x.id; }).join(",");
    };
    return ModelConstraints;
}());
exports.ModelConstraints = ModelConstraints;
var ModelTypeConstrainable = /** @class */ (function (_super) {
    __extends(ModelTypeConstrainable, _super);
    function ModelTypeConstrainable(name, constraints) {
        if (constraints === void 0) { constraints = null; }
        var _this = _super.call(this) || this;
        _this._name = name;
        _this._constraints = constraints || new ModelConstraints([]);
        var cid = _this._constraints.id;
        _this._qualifiers = [
            "type-" + _this._name,
            //`kind-${this.kind}`,
            "constraints-" + cid
        ];
        return _this;
    }
    ModelTypeConstrainable.prototype.propSet = function (key, value) {
        _super.prototype.propSet.call(this, key, value);
        if (key === 'schema') {
            this._setQualifier('format', value && value.format);
            this._setQualifier('schemaid', value && value.id);
        }
    };
    Object.defineProperty(ModelTypeConstrainable.prototype, "name", {
        get: function () { return this._name; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ModelTypeConstrainable.prototype, "qualifiers", {
        get: function () { return this._qualifiers; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ModelTypeConstrainable.prototype, "kind", {
        get: function () { return this._kind(); },
        enumerable: true,
        configurable: true
    });
    ModelTypeConstrainable.prototype.asItemType = function () { return null; };
    ModelTypeConstrainable.prototype.withConstraints = function () {
        var c = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            c[_i] = arguments[_i];
        }
        var _a;
        var result = this._clone((_a = this._constraints).add.apply(_a, c));
        if (this.kind != 'object') {
            result._setName(this.name + '/' + result._constraints.id);
        }
        return result;
    };
    ModelTypeConstrainable.prototype.findConstraints = function (p) {
        var result = this._constraints.filter(p);
        return result;
    };
    ModelTypeConstrainable.prototype._setName = function (name) {
        this._name = name;
    };
    ModelTypeConstrainable.prototype._setQualifier = function (scope, value) {
        var prefix = scope + '-';
        this._qualifiers.filter(function (x) { return -1 === x.indexOf(prefix); });
        if (null != value) {
            this._qualifiers.push(scope + "-" + value);
        }
    };
    ModelTypeConstrainable.prototype._clone = function (constraints) {
        return new this.constructor(null, constraints);
    };
    ModelTypeConstrainable.prototype._checkAndAdjustValue = function (val, ctx) {
        return this._constraints.checkAndAdjustValue(val, ctx);
    };
    ModelTypeConstrainable.prototype._getConstraints = function () {
        return this._constraints;
    };
    return ModelTypeConstrainable;
}(ClientProps));
exports.ModelTypeConstrainable = ModelTypeConstrainable;
var ModelTypeItem = /** @class */ (function (_super) {
    __extends(ModelTypeItem, _super);
    function ModelTypeItem() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ModelTypeItem.prototype.asItemType = function () {
        return this;
    };
    ModelTypeItem.prototype.possibleValues = function () {
        var candidates = this.findConstraints(function (x) { return null != x["allowedValues"]; });
        var values = candidates.reduce(function (pv, c) {
            var cc = c;
            return intersectArrays(pv, cc.allowedValues);
        }, null);
        return values;
    };
    return ModelTypeItem;
}(ModelTypeConstrainable));
exports.ModelTypeItem = ModelTypeItem;
function intersectArrays(a, b) {
    if (null == a)
        return b;
    if (null == b)
        return a;
    var result = [];
    for (var _i = 0, a_1 = a; _i < a_1.length; _i++) {
        var t = a_1[_i];
        if (-1 != b.indexOf(t)) {
            result.push(t);
        }
    }
    return result;
}
exports.intersectArrays = intersectArrays;
var ModelTypeConstraintOptional = /** @class */ (function () {
    function ModelTypeConstraintOptional() {
        this._onlyWarn = false;
    }
    ModelTypeConstraintOptional.prototype.warnOnly = function () {
        var result = new this.constructor(this);
        result._onlyWarn = true;
        return result;
    };
    Object.defineProperty(ModelTypeConstraintOptional.prototype, "isWarningOnly", {
        get: function () { return this._onlyWarn; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ModelTypeConstraintOptional.prototype, "id", {
        get: function () {
            var result;
            if (this._onlyWarn) {
                result = "(" + this._id() + ")";
            }
            else {
                result = "" + this._id();
            }
            return result;
        },
        enumerable: true,
        configurable: true
    });
    return ModelTypeConstraintOptional;
}());
exports.ModelTypeConstraintOptional = ModelTypeConstraintOptional;
//# sourceMappingURL=model.base.js.map