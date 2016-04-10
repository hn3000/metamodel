import {
  IModelParseContext,
  IModelTypeConstraint,
  IModelTypeConstrainable,
  Predicate,
  IModelTypeItem
} from "./model.api.ts"

export class ModelConstraints<T> implements IModelTypeConstraint<T> {
  constructor(constraints:ModelConstraints<T>|IModelTypeConstraint<T>[]) {
    if (Array.isArray(constraints)) {
      this._constraints = constraints.slice();
    }
  }
  get id():string {
    return this._constraints.map((x)=>x.id).join('+');
  }
  checkAndAdjustValue(val:T, ctx:IModelParseContext):T {
    let result = val;
    for (let c of this._constraints) {
      result = c.checkAndAdjustValue(result, ctx);
    }
    return result;
  }
  add(...c:IModelTypeConstraint<T>[]) {
    return new ModelConstraints<T>([...this._constraints, ...c]);
  }

  filter(p:Predicate<IModelTypeConstraint<T>>):IModelTypeConstraint<T>[] {
    return this._constraints.filter(p);
  }

  toString() {
      return this._constraints.map(x=>x.id).join(",");
  }

  private _constraints: IModelTypeConstraint<T>[];
}

export abstract class ModelTypeConstrainable<T> implements IModelTypeConstrainable<T> {
  constructor(name:string, constraints:ModelConstraints<T> = null) {
    this._constraints = constraints || new ModelConstraints<T>([]);
    let cid = this._constraints.id;
    if ('' !== cid) {
      this._name = `${name}/${cid}`;
    } else {
      this._name = name;
    }
  }

  get name():string { return this._name; }
  asItemType() : IModelTypeItem<T> { return null; }

  withConstraints(...c:IModelTypeConstraint<T>[]):this {
    let result = this._clone(this._constraints.add(...c));
    return result;
  }
  findConstraints(p:(x:IModelTypeConstraint<T>)=>boolean):IModelTypeConstraint<T>[] {
    var result = this._constraints.filter(p);
    return result;
  }

  abstract parse(ctx:IModelParseContext):T;
  abstract validate(ctx:IModelParseContext):void;
  abstract unparse(val:T):any;

  protected _setName(name:string) {
    this._name = name;
  }
  protected _clone(constraints:ModelConstraints<T>):this {
      return new (<any>this.constructor)(constraints);
  }
  protected _checkAndAdjustValue(val:T, ctx:IModelParseContext):T {
    return this._constraints.checkAndAdjustValue(val, ctx);
  }
  protected _getConstraints(): ModelConstraints<T> {
    return this._constraints;
  }

  private _name:string;
  private _constraints:ModelConstraints<T>;
}

export abstract class ModelTypeItem<T>
    extends ModelTypeConstrainable<T>
    implements IModelTypeItem<T>
{
  asItemType() : IModelTypeItem<T> {
      return this;
  }

  abstract lowerBound(): IModelTypeConstraint<T>;
  abstract upperBound(): IModelTypeConstraint<T>;

  abstract parse(ctx:IModelParseContext):T;
  abstract validate(ctx:IModelParseContext):void;
  abstract unparse(val:T):any;

  abstract fromString(val:string):T;
  abstract asString(val:T):string;

}

export abstract class ModelTypeConstraintOptional<T> implements IModelTypeConstraint<T> {
  constructor() {
    this._onlyWarn = false;
  }
  warnOnly():this {
      var result = new (<any>this.constructor)(this);
      result._onlyWarn = true;
      return result;
  }
  abstract checkAndAdjustValue(v:T, c:IModelParseContext):T;

  get isWarningOnly() { return this._onlyWarn; }
  get id():string {
    var result:string;
    if (this._onlyWarn) {
      result = `(${this._id()})`;
    } else {
      result = `${this._id()}`;
    }
    return result;
  }

  protected abstract _id():string;

  private _onlyWarn: boolean;
}

