"use strict";
var model_api_1 = require("./model.api");
var model_infra_1 = require("./model.infra");
var es6_promise_1 = require("es6-promise");
var ValidationScope;
(function (ValidationScope) {
    ValidationScope[ValidationScope["VISITED"] = 0] = "VISITED";
    ValidationScope[ValidationScope["PAGE"] = 1] = "PAGE";
    ValidationScope[ValidationScope["FULL"] = 2] = "FULL";
})(ValidationScope = exports.ValidationScope || (exports.ValidationScope = {}));
var ModelViewField = (function () {
    function ModelViewField(key, type) {
        this._keyString = key;
        this._keyPath = key.split('.');
        this._type = type;
    }
    Object.defineProperty(ModelViewField.prototype, "keypath", {
        get: function () {
            return this._keyPath;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ModelViewField.prototype, "key", {
        get: function () {
            return this._keyString;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ModelViewField.prototype, "pointer", {
        get: function () {
            return '/' + this._keyPath.join('/');
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ModelViewField.prototype, "type", {
        get: function () {
            return this._type;
        },
        enumerable: true,
        configurable: true
    });
    ModelViewField.prototype.validate = function (val) {
        var ctx = new model_infra_1.ModelParseContext(val, this._type);
        this._type.validate(ctx);
        return ctx.errors.concat(ctx.warnings);
    };
    return ModelViewField;
}());
exports.ModelViewField = ModelViewField;
var ModelViewPage = (function () {
    function ModelViewPage(alias, pageType) {
        this._alias = alias;
        this._type = pageType;
    }
    Object.defineProperty(ModelViewPage.prototype, "alias", {
        get: function () {
            return this._alias;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ModelViewPage.prototype, "type", {
        get: function () {
            return this._type;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ModelViewPage.prototype, "fields", {
        get: function () {
            return this._type.items.map(function (x) { return x.key; });
        },
        enumerable: true,
        configurable: true
    });
    return ModelViewPage;
}());
exports.ModelViewPage = ModelViewPage;
var ModelViewMeta = (function () {
    function ModelViewMeta(type) {
        this._modelType = type;
        var schema = type.propGet('schema');
        if (schema && schema.pages) {
            var pages = schema.pages.map(function (p, index) {
                var alias = p.alias || '' + index;
                var properties = null;
                if (null != p.schema) {
                    properties = Object.keys(p.schema.properties);
                }
                if (null == properties) {
                    properties = p.properties || p.fields;
                }
                if (null == properties) {
                    properties = [];
                }
                var model = type.slice(properties);
                return new ModelViewPage(alias, model);
            });
            this._pages = pages;
        }
        //TODO: construct fields
    }
    ModelViewMeta.prototype.getPages = function () {
        return this._pages;
    };
    ModelViewMeta.prototype.getModelType = function () {
        return this._modelType;
    };
    ModelViewMeta.prototype.getFields = function () {
        var fields = this._fields;
        var keys = Object.keys(fields);
        return keys.map(function (k) { return fields[k]; });
    };
    ModelViewMeta.prototype.getField = function (keyPath) {
        var key = (typeof keyPath === 'string') ? keyPath : keyPath.join('.');
        return this._fields[key];
    };
    ModelViewMeta.prototype._updatedModel = function (model, keyPath, newValue) {
        return this._updatedModelWithType(model, keyPath, newValue, this._modelType);
    };
    ModelViewMeta.prototype._updatedModelWithType = function (model, keyPath, newValue, type) {
        var keys = Object.keys(model);
        var result = (null != type && type.create) ? type.create() : {};
        var name = keyPath[0];
        var value;
        var entryType = type && type.itemType(name);
        if (keyPath.length == 1) {
            value = newValue;
            if (null != entryType) {
                var parseCtx = new model_infra_1.ModelParseContext(newValue, entryType);
                var modelValue = entryType.parse(parseCtx);
                if (0 == parseCtx.errors.length) {
                    value = modelValue;
                }
            }
        }
        else {
            var entry = model[name];
            if (null == entry) {
                // use model to create missing entry
                entry = (null != entryType) ? entryType.create() : {};
            }
            value = this._updatedModelWithType(entry, keyPath.slice(1), newValue, entryType);
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
    return ModelViewMeta;
}());
exports.ModelViewMeta = ModelViewMeta;
/**
 * Provides an immutable facade for a model, adding IModelType
 * based validation and support for copy-on-write mutation.
 *
 */
var ModelView = (function () {
    function ModelView(modelTypeOrSelf, modelData, initialPage) {
        if (initialPage === void 0) { initialPage = 0; }
        if (modelTypeOrSelf instanceof ModelView) {
            var that = modelTypeOrSelf;
            this._viewMeta = that._viewMeta;
            this._model = modelData || that._model;
            this._visitedFields = shallowCopy(that._visitedFields);
            this._readonlyFields = shallowCopy(that._readonlyFields);
            this._currentPage = that._currentPage;
            this._validationScope = that._validationScope;
            this._statusMessages = that._statusMessages;
            this._messages = that._messages;
            this._messagesByField = that._messagesByField;
        }
        else {
            this._viewMeta = new ModelViewMeta(modelTypeOrSelf);
            this._model = modelData || {};
            this._visitedFields = {};
            for (var _i = 0, _a = Object.keys(this._model); _i < _a.length; _i++) {
                var k = _a[_i];
                this._visitedFields[k] = (null != this._model[k]);
            }
            this._readonlyFields = {};
            this._currentPage = initialPage;
            this._validations = {};
            this._statusMessages = [];
            this._messages = [];
            this._messagesByField = {};
        }
        this._inputModel = this._model;
        this._validations = {};
    }
    ModelView.prototype.getModelType = function () {
        return this._viewMeta.getModelType();
    };
    ModelView.prototype.getField = function (keyPath) {
        return this._viewMeta.getField(keyPath);
    };
    ModelView.prototype.getFields = function () {
        return this._viewMeta.getFields();
    };
    ModelView.prototype.getModel = function () {
        // TODO: create a read-only view of underlying data?
        return this._model;
    };
    ModelView.prototype.withValidationMessages = function (messages) {
        var result = new ModelView(this, this._inputModel);
        var byField = {};
        var newMessages = messages.slice();
        var statusMessages = [];
        for (var _i = 0, messages_1 = messages; _i < messages_1.length; _i++) {
            var m = messages_1[_i];
            if (null == m.property || '' === m.property) {
                statusMessages.push(m);
            }
            else {
                var mp = m.property;
                do {
                    if (!byField[mp]) {
                        byField[mp] = [m];
                    }
                    else {
                        byField[mp].push(m);
                    }
                    var dotpos = mp.lastIndexOf('.');
                    mp = mp.substring(0, dotpos);
                } while (mp !== '');
            }
        }
        result._messages = newMessages;
        result._messagesByField = byField;
        result._statusMessages = statusMessages;
        return result;
    };
    ModelView.prototype.withStatusMessages = function (messages) {
        var result = new ModelView(this, this._inputModel);
        result._statusMessages = messages.slice();
        return result;
    };
    ModelView.prototype.withClearedVisitedFlags = function () {
        var result = new ModelView(this, this._inputModel);
        result._visitedFields = {};
        return result;
    };
    ModelView.prototype.withAddedVisitedFlags = function (fields) {
        var result = new ModelView(this, this._inputModel);
        for (var _i = 0, fields_1 = fields; _i < fields_1.length; _i++) {
            var f = fields_1[_i];
            this._visitedFields[f] = true;
        }
        return result;
    };
    ModelView.prototype.validationScope = function () {
        return this._validationScope;
    };
    ModelView.prototype.validateDefault = function () {
        switch (this._validationScope) {
            case ValidationScope.VISITED:
            default:
                return this.validateVisited();
            case ValidationScope.PAGE:
                return this.validatePage();
            case ValidationScope.FULL:
                return this.validateFull();
        }
    };
    ModelView.prototype.validateVisited = function () {
        var fields = Object.keys(this._visitedFields);
        var modelSlice = this._viewMeta.getModelType().slice(fields);
        return this._validateSlice(modelSlice, ValidationScope.VISITED);
    };
    ModelView.prototype.validatePage = function () {
        var modelSlice = this.getPage().type;
        return this._validateSlice(modelSlice, ValidationScope.PAGE);
    };
    ModelView.prototype.validateFull = function () {
        var modelSlice = this._viewMeta.getModelType();
        return this._validateSlice(modelSlice, ValidationScope.FULL);
    };
    ModelView.prototype._validateSlice = function (modelSlice, kind) {
        var _this = this;
        if (!this._validations[kind]) {
            this._validations[kind] = es6_promise_1.Promise.resolve(null).then(function () {
                var ctx = new model_infra_1.ModelParseContext(_this._inputModel, modelSlice);
                modelSlice.validate(ctx);
                var messages = ctx.errors.concat(ctx.warnings);
                var result = _this.withValidationMessages(messages);
                result._validationScope = kind;
                return result;
            });
        }
        return this._validations[kind];
    };
    ModelView.prototype.withFieldEditableFlag = function (keypath, flag) {
        var flags;
        flags = shallowCopy(this._readonlyFields);
        for (var _i = 0, _a = Object.keys(flags); _i < _a.length; _i++) {
            var k = _a[_i];
            flags[k] = !flags[k];
        }
        var key = this._asKeyString(keypath);
        flags[key] = flag;
        return this.withFieldEditableFlags(flags);
    };
    ModelView.prototype.withFieldEditableFlags = function (flags) {
        var result = new ModelView(this);
        for (var _i = 0, _a = Object.keys(flags); _i < _a.length; _i++) {
            var k = _a[_i];
            result._readonlyFields[k] = !flags[k];
        }
        return result;
    };
    ModelView.prototype.isFieldEditable = function (keypath) {
        var k = this._asKeyString(keypath);
        return !this._readonlyFields.hasOwnProperty(k) || !this._readonlyFields[k];
    };
    ModelView.prototype.withChangedField = function (keyPath, newValue) {
        var path;
        var keyString;
        if (Array.isArray(keyPath)) {
            path = keyPath;
            keyString = keyPath.join('.');
        }
        else {
            path = keyPath.split('.');
            keyString = keyPath;
        }
        if (newValue === this.getFieldValue(path)) {
            return this;
        }
        var newModel = this._viewMeta._updatedModel(this._inputModel, path, newValue);
        var result = new ModelView(this, newModel);
        result._visitedFields[keyString] = true;
        return result;
    };
    ModelView.prototype.withAddedData = function (obj) {
        var result = this;
        for (var _i = 0, _a = Object.keys(obj); _i < _a.length; _i++) {
            var k = _a[_i];
            result = result.withChangedField(k, obj[k]);
        }
        return result;
    };
    ModelView.prototype._asKeyArray = function (keyPath) {
        var path;
        if (Array.isArray(keyPath)) {
            path = keyPath;
        }
        else {
            path = keyPath.split('.');
        }
        return path;
    };
    ModelView.prototype._asKeyString = function (keyPath) {
        var path;
        if (Array.isArray(keyPath)) {
            path = keyPath.join('.');
        }
        else {
            path = keyPath;
        }
        return path;
    };
    ModelView.prototype.getFieldValue = function (keyPath) {
        var path = this._asKeyArray(keyPath);
        return path.reduce(function (o, k) { return (o && o[k]); }, this._inputModel);
    };
    ModelView.prototype.getPossibleFieldValues = function (keyPath) {
        var path = this._asKeyArray(keyPath);
        var last = path.splice(path.length - 1, 1)[0];
        var type = this.getFieldType(path);
        var fieldType = type && type.itemType(last).asItemType();
        if (null == fieldType) {
            return null; // no known restrictions
        }
        var value = this.getFieldValue(path);
        if (type.possibleValuesForContextData) {
            return type.possibleValuesForContextData(last, value);
        }
        return fieldType.possibleValues();
    };
    ModelView.prototype.getFieldType = function (keyPath) {
        var path = this._asKeyArray(keyPath);
        return path.reduce(function (o, k) { return (o && o.itemType(k)); }, this._viewMeta.getModelType());
    };
    ModelView.prototype.getFieldMessages = function (keyPath) {
        var path = this._asKeyString(keyPath);
        return this._messagesByField[path] || [];
    };
    ModelView.prototype.isFieldValid = function (keyPath) {
        var m = this._messagesByField[this._asKeyString(keyPath)];
        return null == m || 0 == m.length;
    };
    ModelView.prototype.getPages = function () {
        return this._viewMeta.getPages();
    };
    ModelView.prototype.getPage = function (aliasOrIndex) {
        var page = null;
        if (null == aliasOrIndex) {
            page = this.getPages()[this.currentPageIndex];
        }
        else if (typeof aliasOrIndex == 'string') {
            throw new Error("not implemented, yet -- do we need it?");
        }
        else {
            page = this.getPages()[aliasOrIndex];
        }
        return page;
    };
    ModelView.prototype.getPageMessages = function (aliasOrIndex) {
        var _this = this;
        var page = this.getPage(aliasOrIndex);
        var result = [];
        page.fields.forEach(function (x) { return result.push.apply(result, _this.getFieldMessages(x)); });
        result.push.apply(result, this._statusMessages);
        return result;
    };
    ModelView.prototype.isPageValid = function (aliasOrIndex) {
        var page = this.getPage(aliasOrIndex);
        return null == page || this.areFieldsValid(page.fields) && !this.hasStatusError();
    };
    ModelView.prototype.areVisitedPagesValid = function () {
        return this.areFieldsValid(this._visitedPageFields()) && !this.hasStatusError();
    };
    ModelView.prototype.arePagesUpToCurrentValid = function () {
        var pages = this._viewMeta.getPages().slice(0, this._currentPage);
        var fields = pages.reduce(function (r, p) { return (r.concat.apply(r, p.fields)); }, []);
        return this.areFieldsValid(fields) && !this.hasStatusError();
    };
    ModelView.prototype.isVisitedValid = function () {
        return this.areFieldsValid(Object.keys(this._visitedFields)) && !this.hasStatusError();
    };
    ModelView.prototype.isValid = function () {
        return !this._messages.some(isNonSuccess) && !this._statusMessages.some(isNonSuccess);
    };
    ModelView.prototype.areFieldsValid = function (fields) {
        var _this = this;
        return fields.every(function (x) { return _this.isFieldValid(x); });
    };
    ModelView.prototype.isFieldVisited = function (field) {
        var fieldPath = this._asKeyString(field);
        return null != this._visitedFields[fieldPath];
    };
    ModelView.prototype.isPageVisited = function (aliasOrIndex) {
        var _this = this;
        var page = this.getPage(aliasOrIndex);
        var visited = page.fields.some(function (f) { return _this.isFieldVisited(f); });
        return visited;
    };
    ModelView.prototype.hasStatusError = function () {
        return this._statusMessages.some(function (x) { return (x.severity == model_api_1.MessageSeverity.ERROR); });
    };
    ModelView.prototype.getStatusMessages = function () {
        return this._statusMessages;
    };
    Object.defineProperty(ModelView.prototype, "currentPageIndex", {
        get: function () {
            return this._currentPage;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ModelView.prototype, "currentPageNo", {
        get: function () {
            return this._currentPage + 1;
        },
        enumerable: true,
        configurable: true
    });
    ModelView.prototype.isFinished = function () {
        return this._currentPage > this._viewMeta.getPages().length;
    };
    ModelView.prototype.changePage = function (step) {
        var nextPage = this._currentPage + step;
        if (nextPage < 0 || nextPage > this._viewMeta.getPages().length) {
            return this;
        }
        return this.gotoPage(nextPage, ValidationScope.VISITED);
    };
    ModelView.prototype.gotoPage = function (index, validationScope) {
        if (validationScope === void 0) { validationScope = ValidationScope.VISITED; }
        var result = new ModelView(this, this._inputModel);
        result._currentPage = index;
        result._validationScope = validationScope;
        return result;
    };
    ModelView.prototype._visitedPageFields = function () {
        var _this = this;
        var pages = this._viewMeta.getPages();
        var vpages = pages.filter(function (x) { return x.fields.some(function (f) { return _this._visitedFields[f]; }); });
        var vpagefields = vpages.reduce(function (r, p) { return r.concat(p.fields); }, []);
        return vpagefields;
    };
    return ModelView;
}());
exports.ModelView = ModelView;
function isNonSuccess(x) {
    return x.severity != model_api_1.MessageSeverity.SUCCESS && x.severity != model_api_1.MessageSeverity.NOTE;
}
function shallowCopy(x) {
    var keys = Object.keys(x);
    var result = {};
    for (var _i = 0, keys_2 = keys; _i < keys_2.length; _i++) {
        var k = keys_2[_i];
        result[k] = x[k];
    }
    return result;
}
//# sourceMappingURL=model.view.js.map