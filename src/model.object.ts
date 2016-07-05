import {
  IModelType,
  IModelTypeItem,
  IModelTypeCompositeBuilder,
  IModelTypeEntry,
  IModelTypeComposite,
  IModelParseContext,
  IModelTypeConstraint
} from "./model.api"

import {
  ModelTypeConstrainable,
  ModelConstraints
} from "./model.base"

function constructionNotAllowed<T>():T {
  throw new Error('can not use subtype for construction');
}

export class ModelTypeObject<T> 
  extends ModelTypeConstrainable<T>
  implements IModelTypeCompositeBuilder<T>
{
  private _constructFun: ()=>T;
  private _entries: IModelTypeEntry[];
  private _entriesByName: { [key:string]:IModelTypeEntry };

  constructor(name:string, construct?:()=>T, constraints?:ModelConstraints<T>) {
    super(name, constraints);
    this._constructFun = construct || (()=>(<T>{}));
    this._entries = [];
    this._entriesByName = { };
  }

  protected _clone(constraints:ModelConstraints<T>):this {
    return new (<any>this.constructor)(this.name, this._constructFun, constraints);
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

  subModel(name:string|number) {
    if (typeof name === 'string' || typeof name === 'number') {
      let entry = this._entriesByName[name]; 
      return entry && entry.type;
    }

    return null;
  }

  slice(names:string[]|number[]):IModelTypeComposite<T> {
    if (Array.isArray(names)) {
      var result = new ModelTypeObject<any>(`${this.name}[${names.join(',')}]`, constructionNotAllowed);
      for (var name of names) {
        let entry = this._entriesByName[name];
        if (entry) {
          result.addItem(''+name, entry.type, entry.required);
        }
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
    let result = this.create();
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
  create():T {
    return this._constructFun ? this._constructFun() : <T><any>{};
  }

  protected _kind() { return 'object'; }

}

