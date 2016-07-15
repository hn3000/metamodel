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

export class ModelTypeString extends ModelTypeItem<string> {

  constructor(c?:ModelConstraints<string>) {
    super('string', c);
  }

  lowerBound(): IModelTypeConstraint<string> { return null; };
  upperBound(): IModelTypeConstraint<string> { return null; };

  parse(ctx:IModelParseContext):string {
    let val = ctx.currentValue();
    let result:string = null;
    if (typeof val === 'string') {
      result = val;
    }
    if (null == result && ctx.currentRequired()) {
      if (val == null) {
        ctx.addError('required value is missing', 'required-empty', val);
      } else {
        ctx.addError('value is wrong type', 'value-type', val);
      }
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
  create():string { return ""; }

  protected _kind() { return 'string'; }

}

export class ModelTypeConstraintPossibleValues<T> extends ModelTypeConstraintOptional<T> {
  constructor(values:T[]) {
    super();
    this._allowedValues = values || [];
  }

  public get allowedValues():T[] {
    return this._allowedValues; // might wanna return a copy
  }

  protected _id():string { return `oneof[${this._allowedValues.join(',')}]`; }

  checkAndAdjustValue(val:T, ctx:IModelParseContext):T {
    var result = val;
    if (-1 === this._allowedValues.indexOf(val)) {
      if (this.isWarningOnly) {
        ctx.addWarning('not a recommended value', 'value-warning', val);
        result = val;
      } else {
        ctx.addError('not a valid value', 'value-invalid', val);
        result = null;
      }
    }
    return result;
  }


  private _allowedValues:T[];
}

export class ModelTypeConstraintRegex extends ModelTypeConstraintOptional<string> {
  constructor(pattern:string|RegExp, flags?:string, message?:string) {
    super();
    
    var patternSource = (<RegExp>pattern).source || pattern.toString();
    this._pattern = new RegExp(patternSource, flags||'');
    if (null != message) {
      this._message = message;
    } else {
      this._message = `value does not match ${this._pattern.toString()}:`;
    }
  }

  protected _id():string { return `pattern[${this._pattern}]`; }

  checkAndAdjustValue(val:string, ctx:IModelParseContext):string {
    var result = val;

    if (!ctx.currentRequired() && (null == val || '' == val)) {
      return val;
    }

    if (! this._pattern.exec(val)) {
      if (this.isWarningOnly) {
        ctx.addWarning(this._message, 'value-warning', val, this._pattern.toString());
        result = val;
      } else {
        ctx.addError(this._message, 'value-invalid', val, this._pattern.toString());
        result = null;
      }
    }
    return result;
  }

  private _pattern:RegExp;
  private _message:string;
}

