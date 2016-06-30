
import {
  IModelType,
  IModelParseMessage,
  Primitive,
  IModelViewField,
  IModelView
} from "./model.api";

import {
  ModelParseContext
} from "./model.infra";

export class  ModelViewField implements IModelViewField {
  keypath:string[];   // ["a","b","c"]
  pointer:string;     // "a/b/c"
  accesspath:string;  // "a.b.c"
  type:IModelType<any>;
  validate(val:any):IModelParseMessage[] {
    let ctx = new ModelParseContext(val);
    this.type.validate(ctx);
    return [...ctx.errors,...ctx.warnings];
  }
}

/**
 * Provides an immutable facade for a model, adding IModelType 
 * based validation and support for copy-on-write mutation.
 * 
 */
export class ModelView<T> implements IModelView<T> {
  constructor(modelType:IModelType<T>, modelData?:any) {
    this._modelType = modelType;
    this._model = modelData || {};
    this._inputModel = this._model;
  }

  getModelType():IModelType<T> {
    return this._modelType;
  }
  getModel():T {
    // TODO: create a read-only view of underlying data

    return this._model;
  } 
  withChangedField(keyPath:string|string[], newValue:Primitive|any[]):IModelView<T> {
    var path: string[];
    if (Array.isArray(keyPath)) {
      path = keyPath;
    } else {
      path = keyPath.split('.');
    }
    
    var newModel = this._updatedModel(this._inputModel, path, newValue) as T; 
    return new ModelView<T>(this._modelType, newModel);
  }

  _updatedModel(model:any, keyPath:string[], newValue:Primitive|any[]) {
    var keys = Object.keys(model);
    var result:any = {};

    var name = keyPath[0];
    var value:any;

    if (keyPath.length == 1) {
      value = newValue;
    } else {
      value = this._updatedModel(model[name] || {}, keyPath.slice(1), newValue);
    }
    for (var k of keys) {
      result[k] = (k == name) ? value : (model as any)[k];
    }
    if (!result.hasOwnProperty(name)) {
      result[name] = value;
    }
    return result;
  }

  getFieldValue(keyPath:string|string[]):any {
    var path: string[];
    if (Array.isArray(keyPath)) {
      path = keyPath;
    } else {
      path = keyPath.split('.');
    }

    return path.reduce((o:any,k:string):any => (o && o[k]), this._inputModel);
  }
  getField(keyPath:string|string[]):IModelViewField {
    let key = (typeof keyPath === 'string') ? keyPath : keyPath.join('.');
    return this._fields[key];
  }

  private _modelType:IModelType<T>;
  private _fields:{[keypath:string]:ModelViewField};
  private _inputModel:any;
  private _model:T;
  private _visitedFlags: {[keypath:string]:boolean};
}
