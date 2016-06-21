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

  addType(type:IModelType<any>):IModelType<any> {
    this._types[type.name] = type;
    let itemType = this.asItemType(type);
    if (itemType) {
      this._itemTypes[itemType.name] = itemType;
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

  createParseContext(obj:any) {
    return new ModelParseContext(obj);
  }

  private _types:{ [name:string]: IModelType<any>; } = {};
  private _itemTypes:{ [name:string]: IModelTypeItem<any>; } = {};
}

