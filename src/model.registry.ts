import {
  IModelType,
  IModelTypeItem,
  IModelTypeCompositeBuilder,
  IModelTypeRegistry
} from "./model.api"

import {
  ModelParseContext
} from "./model.infra"

import {
  ModelTypeArray
} from "./model.array"

import {
  ModelTypeObject
} from "./model.object"

export class ModelTypeRegistry {

  asItemType(type:IModelType<any>) {
    let result = <IModelTypeItem<any>>type;
    if (!result.withConstraints) {
      result = null;
    }
    return result;
  }

  removeType(name:string) {
    if (this._types.hasOwnProperty(name)) {
      delete this._types[name];
      delete this._itemTypes[name];
    }
  }
  addType(type:IModelType<any>):IModelType<any> {
    let name = type.name;
    let oldType = this._types[name];
    if (oldType && oldType != type) {
      console.warn(`redefining type ${name}`, type);
    }

    this._types[name] = type;
    let itemType = this.asItemType(type);
    if (itemType) {
      this._itemTypes[name] = itemType;
    }
    return type;
  }

  addObjectType<C>(name:string, construct?:()=>C):IModelTypeCompositeBuilder<C> {
    let result = new ModelTypeObject<C>(name, construct);
    this.addType(result);
    return result;
  }

  addArrayType<E>(type:IModelType<E>) {
    let result = new ModelTypeArray<E>(type);
    this.addType(result);
    return result;
  }

  type(name:string) : IModelType<any> {
    return this._types[name];
  }

  itemType(name:string) : IModelTypeItem<any> {
    return this._itemTypes[name];
  }
  
  getRegisteredNames() {
    return Object.keys(this._types);
  }

  createParseContext(obj:any, type:IModelType<any>, required?:boolean, allowConversion?:boolean) {
    return new ModelParseContext(obj, type, required, allowConversion);
  }

  private _types:{ [name:string]: IModelType<any>; } = {};
  private _itemTypes:{ [name:string]: IModelTypeItem<any>; } = {};
}

