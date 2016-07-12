"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var ClientProps = (function () {
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
    return ClientProps;
}());
exports.ClientProps = ClientProps;
var ModelConstraints = (function () {
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
            c[_i - 0] = arguments[_i];
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
var ModelTypeConstrainable = (function (_super) {
    __extends(ModelTypeConstrainable, _super);
    function ModelTypeConstrainable(name, constraints) {
        if (constraints === void 0) { constraints = null; }
        _super.call(this);
        this._constraints = constraints || new ModelConstraints([]);
        var cid = this._constraints.id;
        if ('' !== cid) {
            this._name = name + "/" + cid;
        }
        else {
            this._name = name;
        }
    }
    Object.defineProperty(ModelTypeConstrainable.prototype, "name", {
        get: function () { return this._name; },
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
            c[_i - 0] = arguments[_i];
        }
        var result = this._clone((_a = this._constraints).add.apply(_a, c));
        return result;
        var _a;
    };
    ModelTypeConstrainable.prototype.findConstraints = function (p) {
        var result = this._constraints.filter(p);
        return result;
    };
    ModelTypeConstrainable.prototype._setName = function (name) {
        this._name = name;
    };
    ModelTypeConstrainable.prototype._clone = function (constraints) {
        return new this.constructor(constraints);
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
var ModelTypeItem = (function (_super) {
    __extends(ModelTypeItem, _super);
    function ModelTypeItem() {
        _super.apply(this, arguments);
    }
    ModelTypeItem.prototype.asItemType = function () {
        return this;
    };
    ModelTypeItem.prototype.possibleValues = function () {
        var candidates = this.findConstraints(function (x) { return null != x["allowedValues"]; });
        var values = candidates.reduce(function (pv, c) {
            var cc = c;
            return cc.allowedValues.reduce(function (r, v) {
                if (-1 == r.indexOf(v))
                    return r.concat([v]);
                return r;
            }, pv);
        }, []);
        return values;
    };
    return ModelTypeItem;
}(ModelTypeConstrainable));
exports.ModelTypeItem = ModelTypeItem;
var ModelTypeConstraintOptional = (function () {
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