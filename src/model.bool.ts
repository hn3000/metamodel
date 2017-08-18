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
  constructor(name: string = 'boolean', c?:ModelConstraints<boolean>) {
    super(name, c);
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
      if (val == null) {
        ctx.addErrorEx('required value is missing', 'required-empty', { value: val });
      } else {
        ctx.addErrorEx('can not convert to boolean', 'value-type', { value: val });
      }
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
  create():boolean {
    return false;
  }

  possibleValues() {
    let pv = super.possibleValues();
    return pv || [true, false];
  }


  fromString(val:string):boolean {
    let result = this._parseString(val);
    let ctx = new ModelParseContext(result, this);

    result = this._checkAndAdjustValue(result, ctx);
    return result;
  }
  asString(val:boolean):string {
    return val.toString();
  }

  protected _kind() { return 'bool'; }

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

