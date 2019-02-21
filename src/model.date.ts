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
  constructor(name: string = 'date', c?:ModelConstraints<Date>) {
    super(name, c);
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
    let value = ctx.currentValue();
    let result:Date = null;
    var error:any = null;

    if (value instanceof Date) {
      result = value;
    } else if (ctx.allowConversion) {
      try {
        if (typeof value === 'number') {
          // we might not want to allow this in a UI
          result = new Date(value as number);
        } else if (typeof value === 'string') {
          result = new Date(value as string);
        }
      } catch (xx) {
        error = xx;
      }
    }
    if (null == result && (ctx.currentRequired() || (null != value && !ctx.allowConversion))) {
      if (null == value) {
        ctx.addErrorEx('expected to find Date', 'required-empty', { value, error});
      } else {
        ctx.addErrorEx('can not convert to Date', 'value-invalid', { value, error } );
      }
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
      let ctx = new ModelParseContext(result, this);

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
  protected _limit():any { return null; }
  protected _code():string { return 'value-invalid' }

  asDate(val:Date|string) {
    if (val instanceof Date) {
      return val;
    }
    return new Date(val);
  }

  checkAndAdjustValue(val:D, ctx:IModelParseContext):D {
    let result = val;
    let value = val as any;

    if (value != null && value !== '' && !ctx.hasMessagesForCurrentValue()) {
      // only check if it seems to be a valid date
      let limit = this._val();

      let checkVal = this.asDate(value);
      let check = this._compare(checkVal, limit);

      if (!check) {
        let msg = `expected ${val} ${this._op()} ${this._val()}.`;
        ctx.addMessageEx(!this.isWarningOnly, msg, this._code(), { value, limit, op: this._op(), date: checkVal });
        if (!this.isWarningOnly && ctx.allowConversion) {

          // does not make sense without improved date-format handling
          //result = comparisonVal as any;

        }
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
  _limit() { return this._value; }
  private _value: Date;
}

export class ModelTypeConstraintBefore<D> extends ModelTypeConstraintDateFixed<D> {
  constructor(val:Date|string) { super(val); }
  protected _op() { return "<"; }
  protected _compare(a:Date, b:Date):boolean { return a < b; }
  protected _code() { return 'date-large'; }
}

export class ModelTypeConstraintAfter<D> extends ModelTypeConstraintDateFixed<D> {
  constructor(val:Date|string) { super(val); }
  protected _op() { return ">"; }
  protected _compare(a:Date, b:Date):boolean { return a > b; }
  protected _code() { return 'date-small'; }
}

export class TimeSpan {
  constructor(timespan:string) {
    let match = TimeSpan.REGEX.exec(timespan);
    this._amount = parseFloat(match[1]);
    this._unit = match[2];
    switch (this._unit) {
      case "y":
      case "year":
      case "years":
        this._unitNormalized = 'year';
        break;
      case "m":
      case "month":
      case "months":
        this._unitNormalized = 'month';
        break;
      // TODO: other durations?
    }
  }

  toString():string {
    return `${this._amount} ${this._unitNormalized}${this._amount != 1 ? 's':''}`;
  }

  get amount() { return this._amount; }
  get unit()   { return this._unit; }

  moveBack(date:Date) {
    switch (this._unitNormalized) {
      case "year":
        date.setFullYear(date.getFullYear() - this._amount);
        break;
      case "month":
        date.setMonth(date.getMonth() - this._amount);
        break;
      // TODO: other durations?
    }
  }

  _unit:string;
  _unitNormalized:string;
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
  protected _limit() { return this._timespan; }
  protected _val() {
    var date:Date = new Date();
    this._timespan.moveBack(date);
    return date;
  }
  protected _code() { return 'date-minage'; }

  private _timespan: TimeSpan;
}
