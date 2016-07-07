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
  ModelConstraints,
  ModelTypeConstraintOptional
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
      var result = new ModelTypeObject<any>(`${this.name}[${names.join(',')}]`, this._constructFun); // constructionNotAllowed ?
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

export class ModelTypeConstraintEqualFields extends ModelTypeConstraintOptional<any> {
  constructor(fieldsOrSelf:string[]|ModelTypeConstraintEqualFields) {
    super();
    if (Array.isArray(fieldsOrSelf)) {
      this._fields = fieldsOrSelf.slice();
    } else {
      this._fields = (<ModelTypeConstraintEqualFields>fieldsOrSelf)._fields.slice();
    }
  }
  private _isConstraintEqualFields() {} // marker property

  protected _id():string {
    return `equalFields(${this._fields.join(',')})`;
  }

  checkAndAdjustValue(val:any, ctx:IModelParseContext):Date {
    let fields = this._fields;
    var check = true;
    fields.reduce((a,b) => { check = check && val[a] == val[b]; return b; });
    let result = val;
    if (!check) {
      for (var f of fields) {
        ctx.pushItem(f, !this.warnOnly());
        ctx.addError(`expected fields to be equal: ${fields.join(',')}.`);
        ctx.popItem();
      }
    }
    return result;
  }

  private _fields:string[];
}

export interface IRequiredIfOptions {
  // fieldname
  ifField: string;   
  // value(s) that trigger the if
  ifValue: string|number|string[]|number[];
  // field(s) to require  
  required: string|string[];
  // if required is a single string, this is allowed:
  possibleValues?: any[];
}

export interface IRequiredIfSettings {
  ifField: string;   
  ifValue: string[]|number[];
  required: string[];
  // if required is a single string, this is allowed:
  possibleValues?: any[];
}

function safeArray<T>(val:T|T[]):T[] {
  return  Array.isArray(val) ? val.slice() : [ val ];
}

export class ModelTypeConstraintRequiredIf extends ModelTypeConstraintOptional<any> {
  constructor(optionsOrSelf:IRequiredIfOptions|ModelTypeConstraintRequiredIf) {
    super();
    let options = optionsOrSelf as IRequiredIfOptions;
    if (options.ifField && options.ifValue && options.required) {

      if (Array.isArray(options.required) && null != options.possibleValues) {
        throw new Error("must not combine list of required fields with possibleValues");
      }

      // so we always have an array:
      let required = safeArray(options.required); 
      let ifValue = <string[]|number[]>safeArray<string|number>(options.ifValue);

      // copy the object so the values can't be switched later:
      this._settings = {
        ifField: options.ifField,
        ifValue: ifValue,
        required: required,
        possibleValues: options.possibleValues
      };
    } else if (this._isConstraintRequiredIf == (<any>optionsOrSelf)["_isConstraintRequiredIf"]) {
      this._settings = (<ModelTypeConstraintRequiredIf>optionsOrSelf)._settings;
    }
  }
  private _isConstraintRequiredIf() {} // marker property

  protected _id():string {
    let o = this._settings;
    let required = Array.isArray(o.required) ? o.required.join(',') : o.required;
    let values = o.possibleValues ? " == ${o.possibleValues}" : ""
    return `requiredIf(${o.ifField} == ${o.ifValue} -> ${required}${values})`;
  }

  _checkValue(val:any, possible:any|any[]) {
    if (Array.isArray(possible)) {
      return (<any[]>possible).some((x) => x == val);
    }
    return val == possible;  
  }

  _checkIf(val:any) {
    let options = this._settings;
    let fieldValue = val[options.ifField];
    return this._checkValue(fieldValue, options.ifValue);
  }

  checkAndAdjustValue(val:any, ctx:IModelParseContext):Date {
    var check = true;
    let s = this._settings;
    if (this._checkIf(val)) {
      let isError = !this.warnOnly;
      for (var f of s.required) {
        ctx.pushItem(f, isError);
        if (s.possibleValues) {
          if (!this._checkValue(ctx.currentValue, s.possibleValues)) {
            ctx.addMessage(isError, `required field has forbidden value.`, ctx.currentValue, s.possibleValues);
          }
        } else {
          if (null == ctx.currentValue) {
            ctx.addMessage(isError, `required field not filled.`);
          }
        }
        ctx.popItem();
      }
    }

    if (!check) {
      for (var f of s.required) {
      }
    }
    return val;
  }

  private _settings:IRequiredIfSettings;
}
