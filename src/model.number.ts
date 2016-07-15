import {
  IModelType,
  IModelTypeItem,
  IModelParseContext,
  IModelTypeConstraint
} from "./model.api"

import {
  ModelParseContext
} from "./model.infra"

import {
  ModelConstraints,
  ModelTypeConstraintOptional,
  ModelTypeItem
} from "./model.base"

export class ModelTypeNumber extends ModelTypeItem<number> {
  constructor(c?:ModelConstraints<number>) {
    super('number', c);
  }

  lowerBound():IModelTypeConstraint<number> {
      let lower:ModelTypeConstraintComparison[] = <any>this.findConstraints((x)=>{
          return 0 == x.id.indexOf(">");
        });
      if (lower.length >= 1) {
          lower.sort((a,b)=>(a.value - b.value));
          return lower[0];
      }
      return null;
  }

  upperBound():IModelTypeConstraint<number> {
      let upper:ModelTypeConstraintComparison[] = <any>this.findConstraints((x)=>{
          return 0 == x.id.indexOf("<");
        });
      if (upper.length >= 1) {
          upper.sort((a,b)=>(b.value - a.value));
          return upper[0];
      }
      return null;
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
      if (null == val) {
        ctx.addError('required value is missing', 'required-empty');
      } else {
        ctx.addError('can not convert to float', 'value-invalid', val);
      }
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
  create():number {
    return 0;
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

  protected _kind() { return 'number'; }

}

export class ModelTypeConstraintInteger implements IModelTypeConstraint<number> {
  get id():string { return 'int'; }
  checkAndAdjustValue(val:number, ctx:IModelParseContext) {
    let result = Math.floor(val);
    if (val !== result) {
      ctx.addWarning('expected int value, ignored fractional part', 'value-adjusted', val, result);
    }
    return result;
  }
}

export class ModelTypeConstraintMultipleOf extends ModelTypeConstraintOptional<number> {
  constructor(modulus:number|ModelTypeConstraintMultipleOf) {
    super();
    if (typeof(modulus) === 'number') {
      this._modulus = <number>modulus;
    } else {
      this._modulus = (<this>modulus)._modulus;
    }
  }
  _id():string { return `mult(${this._modulus})`; }
  checkAndAdjustValue(val:number, ctx:IModelParseContext) {
    let result = Math.floor(val / this._modulus) * this._modulus;
    if (result !== val) {
      ctx.addWarning(`expected multiple of ${this._modulus}, ignoring remainder`, 'value-adjusted', val, result);
    }
    return result;
  }
  
  get modulus():number {
    return this._modulus;
  }
  
  private _modulus:number;
}

export abstract class ModelTypeConstraintComparison extends ModelTypeConstraintOptional<number> {
  constructor(val:number|ModelTypeConstraintComparison) {
    super();
    if (typeof val == 'number') {
      this._val = <number>val;
    } else {
      this._val = (<ModelTypeConstraintComparison>val)._val;
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
  protected _code():string { return 'value-invalid' }

  checkAndAdjustValue(val:number, ctx:IModelParseContext):number {
    let check = this._compare(val, this._val);
    let result = val;
    if (!check) {
      let warning = this.isWarningOnly;
      let error = !warning && !ctx.allowConversion;
      ctx.addMessage(error, `expected ${val} ${this._op()} ${this._val}.`, this._code());
      if (!this.isWarningOnly && ctx.allowConversion) {
        result = this._val;
      }
    }
    return result;
  }
  private _val:number;
}

export class ModelTypeConstraintLess extends ModelTypeConstraintComparison {
  constructor(val:number) { super(val); }
  protected _op() { return "<"; }
  protected _compare(a:number, b:number):boolean { return a < b; }
  protected _code():string { return 'value-less'; }
}

export class ModelTypeConstraintLessEqual extends ModelTypeConstraintComparison {
  constructor(val:number) { super(val); }
  protected _op() { return "<="; }
  protected _compare(a:number, b:number):boolean { return a <= b; }
  protected _code():string { return 'value-less-or-equal'; }
}

export class ModelTypeConstraintMore extends ModelTypeConstraintComparison {
  constructor(val:number) { super(val); }
  protected _op() { return ">"; }
  protected _compare(a:number, b:number):boolean { return a > b; }
  protected _code():string { return 'value-more'; }
}

export class ModelTypeConstraintMoreEqual extends ModelTypeConstraintComparison {
  constructor(val:number) { super(val); }
  protected _op() { return ">="; }
  protected _compare(a:number, b:number):boolean { return a >= b; }
  protected _code():string { return 'value-more-or-equal'; }
}

