
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
  constructor(modelType:IModelType<T>) {
    this._modelType = modelType;
  }

  getModelType():IModelType<T> {
    return this._modelType;
  }
  getModel():T {
    // TODO: create a read-only view of underlying data

    return this._model;
  } 
  changeField(keyPath:string|string[], newValue:Primitive|any[]):IModelView<T> {
    return null;
  }
  getFieldValue(keyPath:string|string[]):any {
    var path: string[];
    if (Array.isArray(keyPath)) {
      path = keyPath;
    } else {
      path = keyPath.split('.');
    }

    return path.reduce((o:any,k:string):any => (o && o[k]), this._model);
  }
  getField(keyPath:string|string[]):IModelViewField {
    let key = (typeof keyPath === 'string') ? keyPath : keyPath.join('.');
    return this._fields[key];
  }

  private _modelType:IModelType<T>;
  private _fields:{[keypath:string]:ModelViewField};
  private _inputModel:any;
  private _model:T;
}
