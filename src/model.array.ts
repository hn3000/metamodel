import {
  IModelType,
  IModelParseContext
} from "./model.api"

import {
  ModelTypeConstrainable,
  ModelConstraints
} from "./model.base"

export class ModelTypeArray<T> extends ModelTypeConstrainable<T[]> {
  constructor(elementType:IModelType<T>, constraints?:ModelConstraints<T[]>) {
    super(elementType.name+"[]", constraints);
    this._elementType = elementType;
  }
  parse(ctx:IModelParseContext):T[] {
    let result:T[] = [];
    let source = ctx.currentValue();

    // TODO: determine minimum length and maximum length from constraints?
    for (let i=0,n=source.length; i<n; ++i) {
      ctx.pushItem(i, false);
      result[i] = this._elementType.parse(ctx);
      ctx.popItem();
    }
    result = this._checkAndAdjustValue(result, ctx);
    return result;
  }
  validate(ctx:IModelParseContext):void {
    this.parse(ctx);
  }
  unparse(val:T[]):any {
    var result:any[] = [];
    for (var i=0, n=val.length; i<n; ++i) {
      result[i] = this._elementType.unparse(val[i]);
    }
    return <any>result;
  }

  private _elementType: IModelType<T>;
}

