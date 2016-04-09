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

class ObjectTraversal {
  constructor(obj:any) {
    this._top = obj;
    this._stack = [];
  }

  get top(): any {
    return this._top;
  }

  descend(key:string) {
    const top = this._top;
    this._stack.push(top);
    this._top = top != null ? top[key] : undefined;
  }
  ascend() {
    if (0 < this._stack.length) {
      this._top = this._stack.pop();
    }
  }

  private _top:any;
  private _stack:any[];
}

class ParallelTraversal {
  constructor(obj:any[]) {
    this._updateTop(obj || []);
    this._stack = [];
  }

  get top(): any[] { return this._top; }
  get topDefined(): any { return this._topDefined; }
  get topNonNull(): any { return this._topNonNull; }

  descend(key:string) {
    const top = this._top;
    this._stack.push(top);
    this._updateTop(top != null ? top.map((x)=>x[key]) : [ ]);
  }
  ascend() {
    if (0 < this._stack.length) {
      this._updateTop(this._stack.pop());
    }
  }

  prependTop(t:any) {
    this._top.splice(0,0,t);
  }

  appendTop(t:any) {
    this._top.push(t);
  }

  _updateTop(obj:any[]) {
    this._top = obj;
    this._topDefined = obj.filter((x)=>(undefined!==x))[0];
    this._topNonNull = obj.filter((x)=>(null!=x))[0];
  }

  private _top:any[];
  private _topDefined:any;
  private _topNonNull:any;
  private _stack:any[][];
}


export class ModelParseContext implements IModelParseContext {
  constructor(value:any, required?:boolean, allowConversion:boolean=true) {
    this._valueTraversal = new ObjectTraversal(value);
    this._currentRequired = !!required;
    this._allowConversion = allowConversion;
    this._keyPath = [];
    this._requiredStack = [];
    this._warnings = [];
    this._errors = [];
  }

  currentValue():any {
    return this._valueTraversal.top;
  }
  currentRequired():boolean {
    return this._currentRequired;
  }
  currentKeyPath():string[] {
    return this._keyPath;
  }
  pushItem(key:string, required?:boolean) {
    this._valueTraversal.descend(key);
    this._requiredStack.push(this._currentRequired);
    this._currentRequired = !!required;
    this._keyPath.push(key);
  }
  popItem() {
    if (0 < this._requiredStack.length) {
      this._valueTraversal.ascend();
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

  private _valueTraversal:ObjectTraversal;
  private _currentRequired:boolean;
  private _allowConversion:boolean;
  private _requiredStack: boolean[];
  private _keyPath: string[];
  private _warnings: IModelParseMessage[];
  private _errors: IModelParseMessage[];
}

function constructionNotAllowed<T>():T {
  throw new Error('can not use subtype for construction');
}

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
  add(...c:IModelItemConstraint<T>[]) {
    return new ModelConstraints<T>([...this._constraints, ...c]);
  }
  
  toString() {
      return this._constraints.map(x=>x.id).join(",");
  }

  lowerBound():ModelItemConstraintComparison {
      let lower:ModelItemConstraintComparison[] = <any>this._constraints.filter((x)=>{
          return 0 == x.id.indexOf(">");
        });
      if (lower.length >= 1) {
          lower.sort((a,b)=>(a.value - b.value));
          return lower[0];
      }
      return null;
  }

  upperBound():ModelItemConstraintComparison {
      let upper:ModelItemConstraintComparison[] = <any>this._constraints.filter((x)=>{
          return 0 == x.id.indexOf("<");
        });
      if (upper.length >= 1) {
          upper.sort((a,b)=>(b.value - a.value));
          return upper[0];
      }
      return null;
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

  withConstraints(...c:IModelItemConstraint<T>[]):this {
    let result = this._clone(this._constraints.add(...c));
    return result;
  }
  
  asItemType() : IModelTypeItem<T> {
      return this;
  }

  get name():string { return this._name; }
  protected _setName(name:string) {
    this._name = name;
  }
  protected _checkAndAdjustValue(val:T, ctx:IModelParseContext):T {
    return this._constraints.checkAndAdjustValue(val, ctx);
  }
  protected _getConstraints(): ModelConstraints<T> { 
    return this._constraints; 
  } 

  abstract lowerBound(): IModelItemConstraint<T>;
  abstract upperBound(): IModelItemConstraint<T>;

  abstract parse(ctx:IModelParseContext):T;
  abstract validate(ctx:IModelParseContext):void;
  abstract unparse(val:T):any;

  abstract fromString(val:string):T;
  abstract asString(val:T):string;

  protected _clone(constraints:ModelConstraints<T>):this {
      return new (<any>this.constructor)(constraints);
  }

  private _name:string;
  private _constraints:ModelConstraints<T>;
}

export class ModelTypeNumber extends ModelTypeItem<number> {
  constructor(c?:ModelConstraints<number>) {
    super('number', c);
  }

  lowerBound() { return this._getConstraints().lowerBound(); }
  upperBound() { return this._getConstraints().upperBound(); }

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

export abstract class ModelItemConstraintOptional<T> implements IModelItemConstraint<T> {
  constructor() {
    this._onlyWarn = false;
  }
  warnOnly():this {
      var result = new (<any>this.constructor)(this);
      result._onlyWarn = true;
      return result;
  }
  abstract checkAndAdjustValue(v:T, c:ModelParseContext):T;

  get isWarningOnly() { return this._onlyWarn; }
  get id():string {
    var result:string;
    if (this._onlyWarn) {
      result = `(${this._id()})`;
    } else {
      result = `${this._id()}`;
    } 
    return result;
  }
  
  protected abstract _id():string;
  
  private _onlyWarn: boolean;
}

export abstract class ModelItemConstraintComparison extends ModelItemConstraintOptional<number> {
  constructor(val:number|ModelItemConstraintComparison) {
    super();
    if (typeof val == 'number') {
      this._val = <number>val;
    } else {
      this._val = (<ModelItemConstraintComparison>val)._val;
    }
  }
  
  get value():number {
      return this._val;
  }
  
  warnOnly():this {
      var result = new (<any>this.constructor)(this._val);
      result._onlyWarn = true;
      return result;
  }
  
  protected _id():string {
    return `${this._op()}${this._val}`;
  }

  protected _op():string { return ""; }
  protected _compare(a:number, b:number):boolean { return false; }
  
  checkAndAdjustValue(val:number, ctx:IModelParseContext):number {
    let check = this._compare(val, this._val);
    let result = val;
    if (!check) {
      ctx.addWarning(`expected ${val} ${this._op()} ${this._val}.`);
      if (!this.isWarningOnly) {
        result = this._val;
      }
    }
    return result;
  }
  private _val:number;
}

export class ModelItemConstraintLess extends ModelItemConstraintComparison {
  constructor(val:number) { super(val); }
  protected _op() { return "<"; }
  protected _compare(a:number, b:number):boolean { return a < b; }
}

export class ModelItemConstraintLessEqual extends ModelItemConstraintComparison {
  constructor(val:number) { super(val); }
  protected _op() { return "<="; }
  protected _compare(a:number, b:number):boolean { return a <= b; }
}

export class ModelItemConstraintMore extends ModelItemConstraintComparison {
  constructor(val:number) { super(val); }
  protected _op() { return ">"; }
  protected _compare(a:number, b:number):boolean { return a > b; }
}

export class ModelItemConstraintMoreEqual extends ModelItemConstraintComparison {
  constructor(val:number) { super(val); }
  protected _op() { return ">="; }
  protected _compare(a:number, b:number):boolean { return a >= b; }
}

export class ModelTypeString extends ModelTypeItem<string> {

  constructor(c?:ModelConstraints<string>) {
    super('string', c);
  }

  lowerBound(): IModelItemConstraint<string> { return null; };
  upperBound(): IModelItemConstraint<string> { return null; };

  parse(ctx:IModelParseContext):string {
    let val = ctx.currentValue();
    let result:string = null;
    if (typeof val === 'string') {
      result = val;
    }
    if (null == result && ctx.currentRequired()) {
      ctx.addError('can not convert to string', val);
    } else {
      result = this._checkAndAdjustValue(result, ctx);
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

export class ModelItemConstraintPossibleValues<T> extends ModelItemConstraintOptional<T> {
  constructor(values:T[]) {
    super();
    this._allowedValues = values || [];
  }

  protected _id():string { return `oneof[${this._allowedValues.join(',')}]`; }

  checkAndAdjustValue(val:T, ctx:IModelParseContext):T {
    var result = val;
    if (-1 === this._allowedValues.indexOf(val)) {
      if (this.isWarningOnly) {
        ctx.addWarning('not a recommended value', val);
        result = val;
      } else {
        ctx.addError('not a valid value', val);
        result = null;
      }
    }
    return result;
  }
      

  private _allowedValues:T[];
}

export class ModelTypeBool extends ModelTypeItem<boolean> {
  constructor(c?:ModelConstraints<boolean>) {
    super('boolean', c);
  }

  lowerBound(): IModelItemConstraint<boolean> { return null; };
  upperBound(): IModelItemConstraint<boolean> { return null; };

  parse(ctx:IModelParseContext):boolean {
    let val = ctx.currentValue();
    let result:boolean = null;
    if (typeof val === 'boolean') {
      result = val;
    } else if (typeof val === 'string') {
      result = this._parseString(val);
    }
    if (null == result && ctx.currentRequired()) {
      ctx.addError('can not convert to boolean', val);
    } else {
      result = this._checkAndAdjustValue(result, ctx);
    }
    return result;
  }
  validate(ctx:IModelParseContext):void {
    this.parse(ctx);
  }
  unparse(value:boolean):any {
    return value;
  }

  fromString(val:string):boolean {
    let result = this._parseString(val);
    let ctx = new ModelParseContext(result);

    result = this._checkAndAdjustValue(result, ctx);
    return result;
  }
  asString(val:boolean):string {
    return val.toString();
  }
  
  private _parseString(val:string):boolean {
    let result:boolean = null;
    switch(val) {
      case 'true':
      case 'yes':
      case 'checked':
        result = true;
        break;
      case 'false':
      case 'no':
        result = false;
        break;
    }
    return result;
  }

}

export class ModelTypeArray<T> extends ModelTypeItem<T[]> {
}


export class ModelItemConstraints {
  static less(v:number)      { return new ModelItemConstraintLess(v); }
  static lessEqual(v:number) { return new ModelItemConstraintLessEqual(v); }
  static more(v:number)      { return new ModelItemConstraintMore(v); }
  static moreEqual(v:number) { return new ModelItemConstraintMoreEqual(v); }
  static possibleValues(v:string[]) { return new ModelItemConstraintPossibleValues(v); }
  static recommendedValues(v:string[]) { return new ModelItemConstraintPossibleValues(v).warnOnly(); }
}

export var modelTypes = new ModelTypeRegistry();


modelTypes.addType(new ModelTypeBool());
modelTypes.addType(new ModelTypeNumber());
modelTypes.addType(modelTypes.itemType('number').withConstraints(new ModelItemConstraintInteger()));
modelTypes.addType(new ModelTypeString());
