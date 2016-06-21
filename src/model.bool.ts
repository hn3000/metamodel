import {
  IModelParseContext,
  IModelTypeConstraint
} from "./model.api"

import {
  ModelParseContext
} from "./model.infra"

import {
  ModelConstraints,
  ModelTypeItem
} from "./model.base"

export class ModelTypeBool extends ModelTypeItem<boolean> {
  constructor(c?:ModelConstraints<boolean>) {
    super('boolean', c);
  }

  lowerBound(): IModelTypeConstraint<boolean> { return null; };
  upperBound(): IModelTypeConstraint<boolean> { return null; };

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
