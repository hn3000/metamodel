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
      let lower:ModelTypeConstraintAfter<Date>[] = <any>this.findConstraints((x)=>{
          return 0 == x.id.indexOf(">");
        });
      if (lower.length >= 1) {
          lower.sort((a,b)=>(a.value.getDate() - b.value.getDate()));
          return lower[0];
      }
      return null;
  }

  upperBound():IModelTypeConstraint<Date> {
      let upper:ModelTypeConstraintBefore<Date>[] = <any>this.findConstraints((x)=>{
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
    var error:any = null;
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
    return value.toString();
  }
  create():Date {
    return new Date();
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


export abstract class ModelTypeConstraintDateBase<D> extends ModelTypeConstraintOptional<D> {
  constructor() {
    super();
  }

  get value():Date {
      return this._val();
  }

  protected _id():string {
    return `${this._op()}${this._val()}`;
  }

  protected _op():string { return ""; }
  protected _compare(a:Date, b:Date):boolean { return false; }
  protected _val():Date { return null; }

  asDate(val:Date|string) {
    if (val instanceof Date) {
      return val;
    }
    return new Date(val);
  }

  checkAndAdjustValue(val:D, ctx:IModelParseContext):D {
    let comparisonVal = this._val();
    let checkVal = this.asDate(val as any);
    let check = this._compare(checkVal, comparisonVal);
    let result = val;
    if (!check) {
      ctx.addMessage(!this.isWarningOnly, `expected ${val} ${this._op()} ${this._val()}.`);
      if (!this.isWarningOnly && ctx.allowConversion) {
        
        // does not make sense without improved date-format handling
        //result = comparisonVal as any;

      }
    }
    return result;
  }
}

export abstract class ModelTypeConstraintDateFixed<D> extends ModelTypeConstraintDateBase<D> {
  constructor(val:Date|string|ModelTypeConstraintDateFixed<D>) {
    super();
    if (val instanceof Date || typeof val === 'string') {
      this._value = this.asDate(val);
    } else {
      this._value = (<ModelTypeConstraintDateFixed<D>>val)._value;
    }
  }
  _val() { return this._value; }
  private _value: Date;
} 

export class ModelTypeConstraintBefore<D> extends ModelTypeConstraintDateFixed<D> {
  constructor(val:Date|string) { super(val); }
  protected _op() { return "<"; }
  protected _compare(a:Date, b:Date):boolean { return a < b; }
}

export class ModelTypeConstraintAfter<D> extends ModelTypeConstraintDateFixed<D> {
  constructor(val:Date|string) { super(val); }
  protected _op() { return ">"; }
  protected _compare(a:Date, b:Date):boolean { return a > b; }
}

export class TimeSpan {
  constructor(timespan:string) {
    let match = TimeSpan.REGEX.exec(timespan);
    this._amount = parseFloat(match[1]);
    this._unit = match[2];
  }
  get amount() { return this._amount; }
  get unit()   { return this._unit; }

  _unit:string;
  _amount:number;
  private static REGEX:RegExp = /([0-9]+(?:\.[0.9]+)?)\s*([a-z]+)/;
}

export class ModelTypeConstraintOlder<D> extends ModelTypeConstraintDateBase<D> {
  constructor(timespan:string) { 
    super(); 
    this._timespan = new TimeSpan(timespan);
  }
  protected _op() { return "<"; }
  protected _compare(a:Date, b:Date):boolean { return a < b; }
  protected _val() { 
    var date:Date = new Date();
    switch (this._timespan.unit) {
      case "y":
      case "year":
      case "years":
        date.setFullYear(date.getFullYear() - this._timespan.amount);
        break;
      case "m":
      case "month":
      case "months":
        date.setMonth(date.getMonth() - this._timespan.amount);
        break;
      // TODO: other durations?
    }
    return date;
  }

  private _timespan: TimeSpan;
}
