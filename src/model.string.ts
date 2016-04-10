import {
  IModelType,
  IModelTypeItem,
  IModelParseContext,
  IModelTypeConstraint
} from "./model.api.ts"

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

export class ModelTypeConstraintPossibleValues<T> extends ModelTypeConstraintOptional<T> {
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

