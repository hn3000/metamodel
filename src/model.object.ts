import {
  IModelType,
  IModelTypeItem,
  IModelTypeCompositeBuilder,
  IModelTypeEntry,
  IModelTypeComposite,
  IModelParseContext
} from "./model.api.ts"

function constructionNotAllowed<T>():T {
  throw new Error('can not use subtype for construction');
}

export class ModelTypeObject<T> implements IModelTypeCompositeBuilder<T> {
  private _name:string;
  private _constructFun: ()=>T;
  private _entries: IModelTypeEntry[];
  private _entriesByName: { [key:string]:IModelTypeEntry };

  constructor(name:string, construct?:()=>T) {
    this._name = name;
    this._constructFun = construct || (()=>(<T>{}));
    this._entries = [];
    this._entriesByName = { };
  }

  get name():string {
    return this._name;
  }

  asItemType():IModelTypeItem<T> {
    return null;
  }

  addItem(key:string, type:IModelType<any>, required?:boolean):IModelTypeCompositeBuilder<T> {
    if (null == key) {
      throw new Error(`addItem requires valid key, got ${key} and type ${type}`);
    }
    if (null == type) {
      throw new Error(`addItem requires valid type, got ${type} for key ${key}`);
    }

    if (null == this._entriesByName[key]) {
      let entry = {
        key, type, required
      };
      this._entries.push(entry);
      this._entriesByName[key] = entry;
    }
    return this;
  }

  subModel(name:string|string[]) {
    if (typeof name === 'string') {
      return this._entriesByName[name].type;
    } else if (Array.isArray(name)) {
      var result = new ModelTypeObject<any>(`${this.name}[${name.join(',')}]`, constructionNotAllowed);
      for (var i=0,n=name.length; i<n; ++i) {
        result.addItem(name[i], this._entriesByName[name[i]].type);
      }
      return result;
    }

    return null;
  }

  extend<X>(type:IModelTypeComposite<X>):IModelTypeCompositeBuilder<T> {
    return this;
  }

  get items():IModelTypeEntry[] {
    return this._entries;
  }

  parse(ctx:IModelParseContext):T {
    let result = this._constructFun ? this._constructFun() : <T><any>{};
    for (let e of this._entries) {
      ctx.pushItem(e.key, e.required);
      (<any>result)[e.key] = e.type.parse(ctx);
      ctx.popItem();
    }
    return result;
  }
  validate(ctx:IModelParseContext):void {
    for (let e of this._entries) {
      ctx.pushItem(e.key, e.required);
      e.type.validate(ctx);
      ctx.popItem();
    }
  }
  unparse(value:T):any {
    let result:any = {};
    let val:any = value;
    for (let e of this._entries) {
      let item = val[e.key];
      if (undefined !== item) {
        result[e.key] = e.type.unparse(item);
      }
    }
    return result;
  }
}

