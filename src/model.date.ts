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

export class ModelTypeDate extends ModelTypeItem<Date> {
  constructor(c?:ModelConstraints<Date>) {
    super('number', c);
  }

  lowerBound():IModelTypeConstraint<Date> {
      let lower:ModelTypeConstraintDateBound[] = <any>this.findConstraints((x)=>{
          return 0 == x.id.indexOf(">");
        });
      if (lower.length >= 1) {
          lower.sort((a,b)=>(a.value.getDate() - b.value.getDate()));
          return lower[0];
      }
      return null;
  }

  upperBound():IModelTypeConstraint<Date> {
      let upper:ModelTypeConstraintDateBound[] = <any>this.findConstraints((x)=>{
          return 0 == x.id.indexOf("<");
        });
      if (upper.length >= 1) {
          upper.sort((a,b)=>(b.value.getDate() - a.value.getDate()));
          return upper[0];
      }
      return null;
  }
  parse(ctx:IModelParseContext):Date {
    let val = ctx.currentValue();
    let result:Date = null;
    var error = null;
    try {
      if (typeof val === 'number') {
        // we might not want to allow this in a UI
        result = new Date(val as number);
      } else if (typeof val === 'string') {
        result = new Date(val as string);
      }
    } catch (xx) {
      error = xx;
    }
    if (null == result && ctx.currentRequired()) {
      ctx.addError('can not convert to Date', val, error);
    } else {
      result = this._checkAndAdjustValue(result, ctx);
    }
    return result;
  }
  validate(ctx:IModelParseContext):void {
    this.parse(ctx);
  }
  unparse(value:Date):any {
    return value;
  }

  fromString(val:string):Date {
    try {
      let result = new Date(val);
      let ctx = new ModelParseContext(result);

      result = this._checkAndAdjustValue(result, ctx);
      return result;
    } catch (xx) {
      // at least log the error?
      console.log("can't parse Date", xx);
    }
    return null;
  }
  asString(val:Date):string {
    return val.toString();
  }

  protected _kind() { return 'number'; }

}


export abstract class ModelTypeConstraintDateBound extends ModelTypeConstraintOptional<Date> {
  constructor(val:Date|ModelTypeConstraintDateBound) {
    super();
    if (typeof val == 'object' && val instanceof Date) {
      this._val = <Date>val;
    } else {
      this._val = (<ModelTypeConstraintDateBound>val)._val;
    }
  }

  get value():Date {
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
  protected _compare(a:Date, b:Date):boolean { return false; }

  checkAndAdjustValue(val:Date, ctx:IModelParseContext):Date {
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
  private _val:Date;
}

export class ModelTypeConstraintBefore extends ModelTypeConstraintDateBound {
  constructor(val:Date) { super(val); }
  protected _op() { return "<"; }
  protected _compare(a:Date, b:Date):boolean { return a < b; }
}

export class ModelTypeConstraintMore extends ModelTypeConstraintDateBound {
  constructor(val:Date) { super(val); }
  protected _op() { return ">"; }
  protected _compare(a:Date, b:Date):boolean { return a > b; }
}
