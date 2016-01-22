import {
  IModelObject,
  IModelParseMessage,
  IModelParseContext,
  IModelType,
  IModelTypeItem,
  IModelTypeEntry,
  IModelTypeComposite,
  IModelTypeCompositeBuilder
} from "./model.api"

class ModelParseMessage implements IModelParseMessage {
  private _path:string;
  private _msg:string;
  private _args:any[];

  constructor(path: string, msg:string, ...args:any[]) {
    this._path = path;
    this._msg = msg;
    this._args = args;
  }

  get path():string { return this._path; }
  get msg():string { return this._msg; }
  get args():any[] { return this._args; }
}

export class ModelParseContext implements IModelParseContext {
  constructor(value:any, required?:boolean, allowConversion:boolean=true) {
    this._currentValue = value;
    this._currentRequired = !!required;
    this._allowConversion = allowConversion;
    this._keyPath = [];
    this._valueStack = [];
    this._requiredStack = [];
    this._warnings = [];
    this._errors = [];
  }

  currentValue():any {
    return this._currentValue;
  }
  currentRequired():boolean {
    return this._currentRequired;
  }
  currentKeyPath():string[] {
    return this._keyPath;
  }
  pushItem(key:string, required?:boolean) {
    this._valueStack.push(this._currentValue);
    this._requiredStack.push(this._currentRequired);
    let value = this._currentValue;
    this._currentValue = value ? value[key] : null;
    this._currentRequired = !!required;
    this._keyPath.push(key);
  }
  popItem() {
    if (0 < this._valueStack.length) {
      this._currentValue = this._valueStack.pop();
      this._currentRequired = this._requiredStack.pop();
      this._keyPath.pop();
    }
  }

  addWarning(msg:string, ...args:any[]) {
    this._warnings.push(new ModelParseMessage(
      this.currentKeyPath().join('.'),
      msg, ...args
    ));
  }

  get warnings():IModelParseMessage[] {
    return this._warnings;
  }

  addError(msg:string, ...args:any[]) {
    this._errors.push(new ModelParseMessage(
      this.currentKeyPath().join('.'),
      msg, ...args
    ));
  }

  get errors():IModelParseMessage[] {
    return this._errors;
  }

  get allowConversion():boolean {
    return this._allowConversion;
  }

  private _currentValue:any;
  private _currentRequired:boolean;
  private _allowConversion:boolean;
  private _valueStack: any[];
  private _requiredStack: boolean[];
  private _keyPath: string[];
  private _warnings: IModelParseMessage[];
  private _errors: IModelParseMessage[];
}

export class ModelTypeRegistry {
  add(type:IModelType<any>):IModelType<any> {
    this._types[type.name] = type;
    return type;
  }

  addComposite<C>(name:string, construct:()=>C):IModelTypeCompositeBuilder<C> {
    let result = new ModelTypeComposite<C>(name, construct);
    this.add(result);
    return result;
  }

  type(name:string) : IModelType<any> {
    return this._types[name];
  }

  createParseContext(obj:any) {
    return new ModelParseContext(obj);
  }

  private _types:{ [name:string]: IModelType<any>; } = {};
}

export class ModelTypeComposite<T> implements IModelTypeCompositeBuilder<T> {
  private _name:string;
  private _constructFun: ()=>T;
  private _entries: IModelTypeEntry[];
  private _entriesByName: { [key:string]:IModelTypeEntry };

  constructor(name:string, construct:()=>T) {
    this._name = name;
    this._constructFun = construct;
    this._entries = [];
    this._entriesByName = { };
  }

  get name():string {
    return this._name;
  }

  addItem(key:string, type:IModelType<any>):IModelTypeCompositeBuilder<T> {
    if (null == key) {
      throw new Error(`addItem requires valid key, got ${key} and type ${type}`);
    }
    if (null == type) {
      throw new Error(`addItem requires valid type, got ${type} for key ${key}`);
    }

    if (null == this._entriesByName[key]) {
      let entry = {
        key, type
      };
      this._entries.push(entry);
      this._entriesByName[key] = entry;
    }
    return this;
  }

  extend<X>(type:IModelTypeComposite<X>):IModelTypeCompositeBuilder<T> {
    return this;
  }

  get items():IModelTypeEntry[] {
    return this._entries;
  }

  parse(ctx:IModelParseContext):T {
    let result = this._constructFun ? this._constructFun() : <T><any>{};
    return result;
  }
  validate(ctx:IModelParseContext):void {
    for (let e of this._entries) {
      ctx.pushItem(e.key);
      e.type.validate(ctx);
      ctx.popItem();
    }
  }
  unparse(value:T):any {

  }
}

export class ModelTypeFloat implements IModelType<number> {
  get name():string {
    return 'float';
  }
  parse(ctx:IModelParseContext):number {
    let val = ctx.currentValue();
    let result:number = null;
    if (typeof val === 'number') {
      result = val;
    } else if (typeof val === 'string') {
      result = parseFloat(val);
    }
    if (null == result && ctx.currentRequired()) {
      ctx.addError('can not convert to float', val);
    }
    return result;
  }
  validate(ctx:IModelParseContext):void {
    this.parse(ctx);
  }
  unparse(value:number):any {
    return value;
  }
}

export class ModelTypeInt implements IModelType<number> {
  get name():string {
    return 'int';
  }
  parse(ctx:IModelParseContext):number {
    let val = ctx.currentValue();
    let result:number = null;
    if (typeof val === 'number') {
      result = Math.floor(val);
      if (val !== result) {
        ctx.addWarning('expected int value, ignored fractional part', val, result);
      }
    } else if (typeof val === 'string') {
      result = parseInt(val);
      let check = parseFloat(val);
      if (result != check) {
        ctx.addWarning('ignored non-integer part of value', val, result);
      }
    }
    if (null == result && ctx.currentRequired()) {
      ctx.addError('can not convert to int', val);
    }
    return result;
  }
  validate(ctx:IModelParseContext):void {
    this.parse(ctx);
  }
  unparse(value:number):any {
    return value;
  }
}


export class ModelTypeString implements IModelType<string> {
  get name():string {
    return 'string';
  }
  parse(ctx:IModelParseContext):string {
    let val = ctx.currentValue();
    let result:string = null;
    if (typeof val === 'string') {
      result = val;
    }
    if (null == result && ctx.currentRequired()) {
      ctx.addError('can not convert to string', val);
    }
    return result;
  }
  validate(ctx:IModelParseContext):void {
    this.parse(ctx);
  }
  unparse(value:string):any {
    return value;
  }
}

export var modelTypes = new ModelTypeRegistry();


modelTypes.add(new ModelTypeFloat());
modelTypes.add(new ModelTypeInt());
modelTypes.add(new ModelTypeString());
