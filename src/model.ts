import {
  IModelObject,
  IModelParseMessage,
  IModelParseContext,
  IModelType,
  IModelTypeItem,
  IModelTypeEntry,
  IModelTypeComposite,
  IModelTypeCompositeBuilder,
  IModelItemConstraint
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

  asItemType(type:IModelType<any>) {
    let result = <IModelTypeItem<any>>type;
    if (!result.withConstraint) {
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

  addObjectType<C>(name:string, construct:()=>C):IModelTypeCompositeBuilder<C> {
    let result = new ModelTypeObject<C>(name, construct);
    this.addType(result);
    return result;
  }

  type(name:string) : IModelType<any> {
    return this._types[name];
  }

  itemType(name:string) : IModelTypeItem<any> {
    return this._itemTypes[name];
  }

  createParseContext(obj:any) {
    return new ModelParseContext(obj);
  }

  private _types:{ [name:string]: IModelType<any>; } = {};
  private _itemTypes:{ [name:string]: IModelTypeItem<any>; } = {};
}

export class ModelTypeObject<T> implements IModelTypeCompositeBuilder<T> {
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

/* ****** Model Items ******************************************************* */

// Model Item constraints
class ModelConstraints<T> implements IModelItemConstraint<T> {
  constructor(constraints:ModelConstraints<T>|IModelItemConstraint<T>[]) {
    if (Array.isArray(constraints)) {
      this._constraints = constraints.slice();
    }
  }
  get id():string {
    return this._constraints.map((x)=>x.id).join('+');
  }
  checkAndAdjustValue(val:T, ctx:IModelParseContext):T {
    let result = val;
    for (let c of this._constraints) {
      result = c.checkAndAdjustValue(result, ctx);
    }
    return result;
  }
  add(c:IModelItemConstraint<T>) {
    return new ModelConstraints<T>([...this._constraints, c]);
  }

  private _constraints: IModelItemConstraint<T>[];
}

export abstract class ModelTypeItem<T> implements IModelTypeItem<T> {
  constructor(name:string, constraints:ModelConstraints<T> = null) {
    this._constraints = constraints || new ModelConstraints<T>([]);
    let cid = this._constraints.id;
    if ('' !== cid) {
      this._name = `${name}/${cid}`;
    } else {
      this._name = name;
    }
  }

  withConstraint(c:IModelItemConstraint<T>):this {
    let result = this._clone(this._constraints.add(c));
    return result;
  }

  get name():string { return this._name; }
  protected _setName(name:string) {
    this._name = name;
  }
  protected _checkAndAdjustValue(val:T, ctx:IModelParseContext):T {
    return this._constraints.checkAndAdjustValue(val, ctx);
  }

  abstract parse(ctx:IModelParseContext):T;
  abstract validate(ctx:IModelParseContext):void;
  abstract unparse(val:T):any;

  abstract fromString(val:string):T;
  abstract asString(val:T):string;

  protected abstract _clone(constraints:ModelConstraints<T>):this;

  private _name:string;
  private _constraints:ModelConstraints<T>;
}

export class ModelTypeNumber extends ModelTypeItem<number> {
  protected _clone(c:ModelConstraints<number>):this {
    return <this>new ModelTypeNumber(c);
  }

  constructor(c?:ModelConstraints<number>) {
    super('number', c);
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
    } else {
      result = this._checkAndAdjustValue(result, ctx);
    }
    return result;
  }
  validate(ctx:IModelParseContext):void {
    this.parse(ctx);
  }
  unparse(value:number):any {
    return value;
  }

  fromString(val:string):number {
    let result = parseFloat(val);
    let ctx = new ModelParseContext(result);

    result = this._checkAndAdjustValue(result, ctx);
    return result;
  }
  asString(val:number):string {
    return val.toString(10);
  }

}

export class ModelItemConstraintInteger implements IModelItemConstraint<number> {
  get id():string { return 'int'; }
  checkAndAdjustValue(val:number, ctx:IModelParseContext) {
    let result = Math.floor(val);
    if (val !== result) {
      ctx.addWarning('expected int value, ignored fractional part', val, result);
    }
    return result;
  }
}

export class ModelTypeString extends ModelTypeItem<string> {

  constructor(c?:ModelConstraints<string>) {
    super('string', c);
  }

  protected _clone(c?:ModelConstraints<string>):this {
    return <this>new ModelTypeString(c);
  }

  parse(ctx:IModelParseContext):string {
    let val = ctx.currentValue();
    let result:string = null;
    if (typeof val === 'string') {
      result = val;
    }
    if (null == result && ctx.currentRequired()) {
      ctx.addError('can not convert to string', val);
    } else {
      this._checkAndAdjustValue(result, ctx);
    }
    return result;
  }
  validate(ctx:IModelParseContext):void {
    this.parse(ctx);
  }
  unparse(value:string):any {
    return value;
  }

  asString(val:string):string { return val; }
  fromString(val:string):string { return val; }
}


export var modelTypes = new ModelTypeRegistry();


modelTypes.addType(new ModelTypeNumber());
modelTypes.addType(modelTypes.itemType('number').withConstraint(new ModelItemConstraintInteger()));
modelTypes.addType(new ModelTypeString());
