import {
  IModelType,
  IModelParseContext,
  IModelTypeComposite,
  IModelTypeEntry
} from "./model.api"

import {
  ModelTypeConstrainable,
  ModelConstraints,
  ModelTypeConstraintOptional
} from "./model.base"

export class ModelTypeArray<T> extends ModelTypeConstrainable<T[]> implements IModelTypeComposite<T[]> {
  constructor(elementType:IModelType<T>, name?: string, constraints?:ModelConstraints<T[]>) {
    super(name || (elementType.name+"[]"), constraints);
    this._elementType = elementType;
  }
  parse(ctx:IModelParseContext):T[] {
    let source = ctx.currentValue();

    if (null != source) {
      let result:T[] = [];
      // TODO: determine minimum length and maximum length from constraints?
      for (let i=0,n=source.length; i<n; ++i) {
        ctx.pushItem(i, false, this._elementType);
        result[i] = this._elementType.parse(ctx);
        ctx.popItem();
      }
      result = this._checkAndAdjustValue(result, ctx);
      return result;
    }
    return source;
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
  create():T[] {
    return [];
  }

  get items():IModelTypeEntry[] {
    return [];
  }

  itemType() {
    return this._elementType;
  }
  slice() {
    return this;
  }

  possibleValuesForContextData(name: string|number, data: any): any[] {
    // TODO
    //return this._elementType.possibleValuesForContextData(data[name]);
    return null;
  }

  protected _kind() { return 'array'; }

  private _elementType: IModelType<T>;
}

export interface IArraySizeConstraintOptions {
  minLength: number;
  maxLength: number;

}

export class ModelTypeArraySizeConstraint<T> extends ModelTypeConstraintOptional<T[]> {
  constructor(options:IArraySizeConstraintOptions) {
    super();
    let { minLength, maxLength } = options;;
    this._settings = {
      minLength: null != minLength ? Math.max(0, minLength) : null,
      maxLength: null != maxLength ? Math.max(0, maxLength) : null,
    };
  }

  _id():string {
    let { minLength, maxLength } = this._settings;

    return `${minLength ? minLength +' <= ' : ''}size${maxLength ? ' <= ' + maxLength  : ''}`;
  }

  checkAndAdjustValue(v:T[], c:IModelParseContext):T[] {
    let length = v && v.length;
    let valid = true;
    if (null != length) {
      let { minLength, maxLength } = this._settings;
      if (null != minLength) {
        valid = valid &&  (length >= minLength);
      }
      if (null != maxLength) {
        valid = valid &&  (length <= maxLength);
      }
    }
    return v;
  }


  private _settings:IArraySizeConstraintOptions;
}

export class ModelTypeArrayUniqueElementsConstraint<T> extends ModelTypeConstraintOptional<T[]> {
  constructor() {
    super();
  }

  _id():string {
    return 'uniqueElements';
  }

  checkAndAdjustValue(v:T[], c:IModelParseContext):T[] {
    var index = 0;
    var dups:number[] = [];
    for (var e of v) {
      let at = v.indexOf(e);
      if (at != index) {
        dups.push(at);
        dups.push(index);
      }
      ++index;
    }

    if (dups.length > 0) {
      c.addMessageEx(!this.isWarningOnly, 'array has duplicates', 'array-unique', { duplicates: dups });
    }
    return v;
  }
}
