
import {
  IModelType,
  IModelTypeComposite,
  IModelParseMessage
} from "./model.api";

import {
  ModelParseContext
} from "./model.infra";

import { Promise } from 'es6-promise';

export type Primitive = string|number|boolean|string[]|number[];

export interface IModelViewField {
  keypath:string[];   // ["a","b","c"]
  pointer:string;     // "/a/b/c"
  key:string;  // "a.b.c"
  type:IModelType<any>;
  validate(val:any):IModelParseMessage[];
}

export interface IModelViewPage {
  alias:string;
  type:IModelTypeComposite<any>;
  fields:string[];
}

/**
 * Provides an immutable facade for a model, adding IModelType 
 * based validation and support for copy-on-write mutation.
 * 
 */
export interface IModelView<T> {
  getModelType():IModelType<T>;
  getModel():T; // might actually be a read-only view of underlying data

  withChangedField(keyPath:string|string[], newValue:Primitive|any[]):IModelView<T>;
  withAddedData(obj:any):IModelView<T>;
  getFieldValue(keyPath:string|string[]):any;
  getField(keyPath:string|string[]):IModelViewField;
  getFields():IModelViewField[];

  getFieldMessages(keyPath:string|string[]):IValidationMessage[];
  isFieldValid(keyPath:string|string[]):boolean;

  getPages():IModelViewPage[];
  getPage(alias:string):IModelViewPage;
  getPageMessages(aliasOrIndex?:string|number):IValidationMessage[];
  isPageValid(alias:string):boolean;

  currentPageIndex:number; // 0 based
  currentPageNo:number;    // 1 based

  withValidationMessages(messages:IValidationMessage[]):IModelView<T>;

  validateDefault():Promise<IModelView<T>>;
  validateVisited():Promise<IModelView<T>>;
  validatePage():Promise<IModelView<T>>;
  changePage(step:number):Promise<IModelView<T>>;
}


export interface IValidationMessage extends IModelParseMessage {
    // nothing added for now
}

export interface IValidationResult {
  messages: IValidationMessage[];
} 

export interface IValidator {
    (oldModel:any, newModel:any):Promise<IValidationResult>;
}


export class  ModelViewField implements IModelViewField {
  constructor(key:string, type:IModelType<any>) {
    this._keyString = key;
    this._keyPath = key.split('.');
    this._type = type;
  }

  get keypath():string[] {   // ["a","b","c"]
    return this._keyPath;
  }
  get key():string {           // "a.b.c"
    return this._keyString;
  } 
  get pointer():string {     // "/a/b/c"
    return '/'+this._keyPath.join('/');
  }

  get type():IModelType<any> {
    return this._type;
  }
  
  validate(val:any):IValidationMessage[] {
    let ctx = new ModelParseContext(val);
    this._type.validate(ctx);
    return [...ctx.errors,...ctx.warnings];
  }

  private _keyString: string;
  private _keyPath:   string[];
  private _type: IModelType<any>;
}

export class ModelViewPage {
  constructor(alias:string, pageType:IModelTypeComposite<any>) {
    this._alias = alias;
    this._type = pageType;
  }

  get alias(): string {
    return this._alias;
  }
  get type():IModelTypeComposite<any> {
    return this._type;
  }
  get fields():string[] {
    return this._type.items.map((x) => x.key);
  }

  private _alias: string;
  private _type: IModelTypeComposite<any>; 
}

export class ModelViewMeta<T> {

  constructor(type:IModelTypeComposite<T>) {
    this._modelType = type;

    let schema = type.propGet('schema');
    if (schema && schema.pages) {
      let pages = schema.pages.map((p:any, index:number) => {
        let alias = p.alias || ''+index;
        let fields = p.fields;
        let model = type.slice(fields);
        return new ModelViewPage(alias, model);
      });
      this._pages = pages;
    }
    //TODO: construct fields
  }

  getPages():ModelViewPage[] {
    return this._pages;
  }

  getModelType():IModelTypeComposite<T> {
    return this._modelType;
  }

  getFields():IModelViewField[] {
    let fields = this._fields;
    let keys = Object.keys(fields);
    return keys.map((k) => fields[k]);
  }

  getField(keyPath:string|string[]):IModelViewField {
    let key = (typeof keyPath === 'string') ? keyPath : keyPath.join('.');
    return this._fields[key];
  }

  _updatedModel(model:any, keyPath:string[], newValue:Primitive|any[]) {
    return this._updatedModelWithType(model, keyPath, newValue, this._modelType);
  }

  _updatedModelWithType(model:any, keyPath:string[], newValue:Primitive|any[], type:IModelType<any>) {
    var keys = Object.keys(model);
    var result:any = {};

    var name = keyPath[0];
    var value:any;

    if (keyPath.length == 1) {
      value = newValue;
    } else {
      let entry = model[name];
      if (null == entry) {
        // use model to create missing entry
        let entryType = (type as IModelTypeComposite<any>).subModel(name);
        entry = entryType.create();
      }
      value = this._updatedModel(entry, keyPath.slice(1), newValue);
    }
    for (var k of keys) {
      result[k] = (k == name) ? value : (model as any)[k];
    }
    if (!result.hasOwnProperty(name)) {
      result[name] = value;
    }
    return result;
  }


  private _modelType:IModelTypeComposite<T>;
  private _fields:{[keypath:string]:ModelViewField};
  private _pages:ModelViewPage[];
}

/**
 * Provides an immutable facade for a model, adding IModelType 
 * based validation and support for copy-on-write mutation.
 * 
 */
export class ModelView<T> implements IModelView<T> {
  constructor(modelTypeOrSelf:IModelTypeComposite<T> | ModelView<T>, modelData?:any) {
    if (modelTypeOrSelf instanceof ModelView) {
      let that = <ModelView<T>>modelTypeOrSelf;
      this._viewMeta = that._viewMeta;
      this._model = modelData || {};
      this._visitedFields = shallowCopy(that._visitedFields);
      this._currentPage = that._currentPage;
      this._validationScope = that._validationScope;
    } else {
      this._viewMeta = new ModelViewMeta(modelTypeOrSelf);
      this._model = modelData || {};
      this._visitedFields = {};
      for (var k of Object.keys(this._model)) {
        this._visitedFields[k] = (null != (<any>this._model)[k]);
      }
      this._currentPage = 0;
    }
    this._inputModel = this._model;
    this._validations = {};
    this._messages = [];
    this._messagesByField = {};
  }

  getModelType():IModelType<T> {
    return this._viewMeta.getModelType();
  }
  getField(keyPath:string|string[]):IModelViewField {
    return this._viewMeta.getField(keyPath);
  }
  getFields():IModelViewField[] {
    return this._viewMeta.getFields();
  }
  getModel():T {
    // TODO: create a read-only view of underlying data?
    return this._model;
  } 

  withValidationMessages(messages:IValidationMessage[]):ModelView<T> {
    let result = new ModelView(this, this._inputModel);
    let byField: { [keypath:string]:IValidationMessage[]; } = {};

    let newMessages = messages.slice();
    for (var m of messages) {
      if (!byField[m.path]) {
        byField[m.path] = [ m ];
      } else {
        byField[m.path].push(m);
      }
    }
    result._messages = newMessages;
    result._messagesByField = byField

    return result;
  }

  validateDefault():Promise<IModelView<T>> {
    switch (this._validationScope) {
      case 'visited':
      default:            return this.validateVisited();

      case 'currentPage': return this.validatePage();
    }
  }

  validateVisited():Promise<IModelView<T>> {
    let fields = Object.keys(this._visitedFields);
    let modelSlice = this._viewMeta.getModelType().slice(fields);
    return this._validateSlice(modelSlice, "visited");
  }

  validatePage():Promise<IModelView<T>> {
    let modelSlice = this.getPage().type;
    return this._validateSlice(modelSlice, "currentPage");
  }

  private _validateSlice(modelSlice:IModelTypeComposite<T>, kind:string):Promise<IModelView<T>> {
    if (!this._validations[kind]) {
      this._validations[kind] = Promise.resolve(null).then(
        () => {
          let ctx = new ModelParseContext(this._inputModel);
          modelSlice.validate(ctx);

          let messages = [ ...ctx.errors, ...ctx.warnings];
          var result = this.withValidationMessages(messages);
          result._validationScope = kind;
          return result;
        }
      );
    }
    return this._validations[kind];
  }

  withChangedField(keyPath:string|string[], newValue:Primitive|any[]):IModelView<T> {
    var path: string[];
    var keyString:string;
    if (Array.isArray(keyPath)) {
      path = keyPath;
      keyString = keyPath.join('.');
    } else {
      path = keyPath.split('.');
      keyString = keyPath;
    }
    
    var newModel = this._viewMeta._updatedModel(this._inputModel, path, newValue) as T; 
    let result = new ModelView<T>(this, newModel);

    result._visitedFields[keyString] = true;

    return result;
  }

  withAddedData(obj:any):IModelView<T> {
    var result:IModelView<T> = this;
    for (var k of Object.keys(obj)) {
      result = result.withChangedField(k, obj[k]);
    }
    return result;
  }

  _asKeyArray(keyPath:string|string[]) {
    var path: string[];
    if (Array.isArray(keyPath)) {
      path = keyPath;
    } else {
      path = keyPath.split('.');
    }
    return path;
  }

  _asKeyString(keyPath:string|string[]) {
    var path: string;
    if (Array.isArray(keyPath)) {
      path = keyPath.join('.');
    } else {
      path = keyPath;
    }
    return path;
  }

  getFieldValue(keyPath:string|string[]):any {
    let path = this._asKeyArray(keyPath);
    return path.reduce((o:any,k:string):any => (o && o[k]), this._inputModel);
  }

  getFieldMessages(keyPath:string|string[]):IValidationMessage[] {
    let path = this._asKeyString(keyPath);
    return this._messagesByField[path] || [];
  }

  isFieldValid(keyPath:string|string[]):boolean {
    let m = this._messagesByField[this._asKeyString(keyPath)];
    return null == m || 0 == m.length;
  }

  getPages() {
    return this._viewMeta.getPages();
  }

  getPage(aliasOrIndex?:string|number):IModelViewPage {
    var page:IModelViewPage = null;
    if (null == aliasOrIndex) {
      page = this.getPages()[this.currentPageIndex];
    } else if (typeof aliasOrIndex == 'string') {
      throw new Error("not implemented, yet -- do we need it?");
    } else {
      page = this.getPages()[aliasOrIndex as number];
    }
    return page;
  }

  getPageMessages(aliasOrIndex?:string|number):IValidationMessage[] {
    let page = this.getPage(aliasOrIndex);
    let result:IValidationMessage[] = [];
    page.fields.forEach((x) => result.push(...this.getFieldMessages(x)));
    return result;    
  }

  isPageValid(aliasOrIndex?:string|number) {
    let page = this.getPage(aliasOrIndex);
    return page.fields.every((x) => this.isFieldValid(x));
  }

  get currentPageIndex():number {
    return this._currentPage;
  }
  get currentPageNo():number {
    return this._currentPage+1;
  }

  changePage(step:number):Promise<IModelView<T>> {
    let nextPage = this._currentPage + step;

    if (nextPage < 0 || nextPage >= this._viewMeta.getPages().length) {
      return Promise.resolve(this);
    }

    let result = new ModelView(this, this._inputModel);
    result._currentPage = nextPage;
    return Promise.resolve(result);
  }

  private _viewMeta:ModelViewMeta<T>;
  private _inputModel:any;
  private _model:T;
  private _visitedFields: {[keypath:string]:boolean};

  private _currentPage:number;

  private _validationScope:string;
  private _validations:{[kind:string]:Promise<ModelView<T>>};
  private _messages:IModelParseMessage[];
  private _messagesByField:{ [keypath:string]:IModelParseMessage[]; };

}

function shallowCopy(x:any) {
  let keys = Object.keys(x);
  let result:any = {};
  for (var k of keys) {
    result[k] = x[k];
  }
  return result;
}
