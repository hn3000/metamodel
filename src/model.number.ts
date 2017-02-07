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
    let value = ctx.currentValue();
    let result:number = null;
    if (typeof value === 'number') {
      result = value;
    } else if (typeof value === 'string' && ctx.allowConversion) {
      result = Number(value);
      if (isNaN(result)) {
        result = null;
      }
    }

    if (
      null == result && (ctx.currentRequired() || (value != null))
    ) {
      if (null == value) {
        ctx.addError('required value is missing', 'required-empty');
      } else {
        ctx.addErrorEx('can not convert to float', 'value-invalid', { value });
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
    let ctx = new ModelParseContext(result, this);

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
  checkAndAdjustValue(value:number, ctx:IModelParseContext) {
    if (null != value) {
      let adjusted = Math.floor(value);
      if (value !== adjusted) {
        ctx.addWarningEx('expected int value, ignored fractional part', 'value-adjusted', { value, adjusted });
      }
      return adjusted;
    }
    return value;
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
  checkAndAdjustValue(value:number, ctx:IModelParseContext) {
    let adjusted = Math.floor(value / this._modulus) * this._modulus;
    if (adjusted !== value) {
      let warn = this.isWarningOnly && ctx.allowConversion;
      let adjust = ctx.allowConversion;
      let msg = `expected multiple of ${this._modulus} but got ${value}${adjust?', ignoring remainder':''}`
      ctx.addMessageEx(!warn, msg, 'value-adjusted', { value, adjusted });
      if (adjust) {
        return adjusted;
      }
    }
    return value;
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

  checkAndAdjustValue(value:number, ctx:IModelParseContext):number {
    let limit = this._val;
    let check = this._compare(value, limit);
    let result = value;
    if (!check) {
      let warning = this.isWarningOnly;
      let error = !warning && !ctx.allowConversion;
      let op = this._op();
      ctx.addMessageEx(error, `expected ${value} ${this._op()} ${this._val}.`, this._code(), { value, limit, op });
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

