
import {
  IModelType,
  IModelTypeItem,
  IModelTypeCompositeBuilder,
  IModelTypeEntry,
  IModelTypeComposite,
  IModelParseContext,
  IModelTypeConstraint,
  Primitive,
  Comparison,
  Predicate
} from "./model.api"

import {
  ModelTypeConstrainable,
  ModelConstraints,
  ModelTypeConstraintOptional,
  intersectArrays
} from "./model.base"

function constructionNotAllowed<T>():T {
  throw new Error('can not use subtype for construction');
}

export class ModelTypeAny
  extends ModelTypeConstrainable<any>
  implements IModelTypeItem<any>
{
  private _constructFun: ()=>any;

  constructor(name:string, construct?:()=>any, constraints?:ModelConstraints<any>) {
    super(name, constraints);
    this._constructFun = construct || (()=>(<any>{}));
  }

  protected _clone(constraints:ModelConstraints<any>):this {
    let result = new (<any>this.constructor)(this.name, this._constructFun, constraints);
    return result;
  }

  protected _kind() { return 'any' }

  asItemType():IModelTypeItem<any> {
    return this;
  }

  fromString(text: string) {
    return JSON.parse(text);
  }
  asString(obj: any) {
    return JSON.stringify(obj, null, 2);
  }

  lowerBound(): IModelTypeConstraint<any> { return null; }
  upperBound(): IModelTypeConstraint<any> { return null; }
  possibleValues() : any[] { return null; }

  create() {
    return this._constructFun ? this._constructFun() : {};
  }

  parse(ctx:IModelParseContext):any {
    if (ctx.currentRequired() && null == ctx.currentValue()) {
      ctx.addError('required value is missing', 'required-empty');
    }
    return this._checkAndAdjustValue(ctx.currentValue(), ctx);
  }
  validate(ctx:IModelParseContext):void {
    this.parse(ctx);
  }
  unparse(val:any):any {
    return val;
  }


}

export class ModelTypeObject<T>
  extends ModelTypeConstrainable<T>
  implements IModelTypeCompositeBuilder<T>
{
  private _constructFun: ()=>T;
  private _entries: IModelTypeEntry[];
  private _entriesByName: { [key:string]:IModelTypeEntry };
  private _allowAdditional = true;

  constructor(name:string, construct?:()=>T, constraints?:ModelConstraints<T>) {
    super(name, constraints);
    this._constructFun = construct || (()=>(<T>{}));
    this._entries = [];
    this._entriesByName = { };
  }

  protected _clone(constraints:ModelConstraints<T>):this {
    let result = new (<any>this.constructor)(this.name, this._constructFun, constraints);
    for (var e of this._entries) {
      result.addItem(e.key, e.type, e.required);
    }
    result._allowAdditional = this._allowAdditional;
    return result;
  }

  addItem(key:string, type:IModelType<any>, required?:boolean):IModelTypeCompositeBuilder<T> {
    if (null == key) {
      throw new Error(`addItem requires valid key, got ${key} and type ${type}`);
    }
    if (null == type) {
      throw new Error(`addItem requires valid type, got ${type} for key ${key}`);
    }

    if (null == this._entriesByName[key]) {
      let entry = {
        key, type, required
      };
      this._entries.push(entry);
      this._entriesByName[key] = entry;
    }
    return this;
  }

  findItem(key:string) {
    return this._entriesByName[key]; 
  }

  extend<X>(type:IModelTypeComposite<X>):IModelTypeCompositeBuilder<T> {
    let constraints:IModelTypeConstraint<any>[] = type.findConstraints(()=>true);
    let result = this.withConstraints(...constraints);
    for (var item of type.items) {
      let { key, type, required } = item;
      result.addItem(key, type, required)
    }
    return result;
  }

  asItemType():IModelTypeItem<T> {
    return null;
  }

  itemType(name:string|number) {
    if (typeof name === 'string' || typeof name === 'number') {
      let entry = this._entriesByName[name];
      return entry && entry.type;
    }

    return null;
  }

  slice(names:string[]|number[]):IModelTypeComposite<T> {
    if (Array.isArray(names)) {
      let filteredConstraints = this._getConstraints().slice(names);

      var result = new ModelTypeObject<any>(`${this.name}[${names.join(',')}]`, this._constructFun, filteredConstraints); // constructionNotAllowed ?
      for (var name of names) {
        let entry = this._entriesByName[name];
        if (entry) {
          result.addItem(''+name, entry.type, entry.required);
        }
      }
      return result;
    }
    return null;
  }

  get items():IModelTypeEntry[] {
    return this._entries;
  }

  parse(ctx:IModelParseContext):T {
    let result = this.create();

    let val = ctx.currentValue();
    let keys: string[] = [];
    if (this._allowAdditional && val) {
      keys = Object.keys(val);
    }
    for (let e of this._entries) {
      ctx.pushItem(e.key, e.required, e.type);
      (<any>result)[e.key] = e.type.parse(ctx);
      let kp = keys.indexOf(e.key);
      if (-1 != kp) {
        keys.splice(kp, 1);
      }
      ctx.popItem();
    }

    if (keys.length) {
      for (var k of keys) {
        (result as any)[k] = val[k];
      }
    }

    result = this._checkAndAdjustValue(result, ctx);

    return result;
  }
  validate(ctx:IModelParseContext):void {
    for (let e of this._entries) {
      ctx.pushItem(e.key, e.required, e.type);
      e.type.validate(ctx);
      ctx.popItem();
    }

    this._checkAndAdjustValue(ctx.currentValue(), ctx);
  }
  unparse(value:T):any {
    let result:any = {};
    let val:any = value;
    for (let e of this._entries) {
      let item = val[e.key];
      if (undefined !== item) {
        result[e.key] = e.type.unparse(item);
      }
    }
    return result;
  }
  create():T {
    return this._constructFun ? this._constructFun() : <T><any>{};
  }

  // null -> no list of allowed values (no known restrictions)
  // empty array -> no values possible
  possibleValuesForContextData(name:string|number, data:any):any[] {
    let result: any[] = null;

    let fieldType = this.itemType(name).asItemType();
    if (fieldType) {
      result = fieldType.possibleValues();
    }

    let cx = this.findConstraints((c) => null != c.possibleValuesForContextData);

    result = cx.reduce(
      (r, c) => intersectArrays(r, c.possibleValuesForContextData(name, data)),
      result
    );

    return result;
  }

  protected _kind() { return 'object'; }

}

function safeArray<T>(val:T|T[]):T[] {
  return  Array.isArray(val) ? val.slice() : null != val ? [ val ] : null;
}

export type ComparisonOp = "=" | "==" | "<" | "<=" | ">" | ">=" | "!=";

const ComparisonOp_Names : { [op:string]: string; } = {
  "=":  "equal",
  "==": "equal",
  "<":  "less",
  "<=": "less-equal",
  ">":  "greater",
  ">=": "greater-equal",
  "!=": "different"
};

function comparisonEquals(a: Primitive, b: Primitive) {
  if (a === b) {
    return true;
  }
  if ((null == a) != (null == b)) {
    return false;
  }

  let isArrA = Array.isArray(a);
  let isArrB = Array.isArray(b);
  if (isArrA != isArrB) {
    return false;
  }

  if (isArrA) {
    let aa = a as Array<any>;
    let ab = b as Array<any>;
    if (aa.length != ab.length) {
      return false;
    }
    for (let i = 0, n = aa.length; i < n; ++i) {
      if (aa[i] != ab[i]) {
        return false;
      }
    }
    return true;
  }
  // simple case was handled first, this means a !== b here
  return false;
}

function comparisonLess(a: Primitive, b: Primitive) {
  if ((null == a) != (null == b)) {
    return false;
  }
  if ((null == a) && (null == b)) {
    return false;
  }

  let isArrA = Array.isArray(a);
  let isArrB = Array.isArray(b);
  if (isArrA || isArrB) {
    return false;
  }

  return (a < b);
}

function comparisonGreater(a: Primitive, b: Primitive) {
  return comparisonLess(b,a);
}

function inverse(comp: Comparison<Primitive>) {
  return (a: Primitive,b: Primitive) => !comp(a,b);
}

const ComparisonOp_Comparator : { [op:string]: Comparison<Primitive>; } = {
  "=":  comparisonEquals,
  "==": comparisonEquals,
  "<":  comparisonLess,
  "<=": inverse(comparisonGreater),
  ">":  comparisonGreater,
  ">=": inverse(comparisonLess),
  "!=": inverse(comparisonEquals)
};

export interface IComparePropertiesConstraintOptions {
  properties: string|string[];
  op: ComparisonOp;
}

export class ModelTypeConstraintCompareProperties extends ModelTypeConstraintOptional<any> {
  constructor(fieldsOrSelf:string[]|IComparePropertiesConstraintOptions|ModelTypeConstraintCompareProperties, op?: ComparisonOp) {
    super();

    if (Array.isArray(fieldsOrSelf) && null != op) {
      this._fields = safeArray(fieldsOrSelf);
      this._op = op;
      this._comparator = ComparisonOp_Comparator[op];
    } else {
      let props = (fieldsOrSelf as IComparePropertiesConstraintOptions);
      if (props && props.properties) {
      this._fields = safeArray(props.properties);
      this._op = props.op;
      this._comparator = ComparisonOp_Comparator[props.op] || comparisonEquals;
      } else {
        let that = (<ModelTypeConstraintCompareProperties>fieldsOrSelf);
        this._fields = that._fields.slice();
        this._op = that._op;
        this._comparator = that._comparator;
      }
    }
  }
  //private _isConstraintEqualFields() {} // marker property

  protected _id():string {
    return `compareFields(${this._fields.join(',')}, ${this._op})`;
  }

  checkAndAdjustValue(val:any, ctx:IModelParseContext):any {
    let fields = this._fields;
    let values = fields.reduce((acc,k) => {
      acc.push(val[k]);
      return acc;
    }, []);

    let valid = true;
    let comp = this._comparator;

    for (let i = 1, n = values.length; i < n; ++i) {
      if (!comp(values[i-1], values[i])) {
        valid = false;
        break;
      }
    }

    let result = val;
    if (!valid) {
      for (var f of fields) {
        ctx.pushItem(f, !this.warnOnly(), null);
        switch (this._op) {
          case '=':
          case '==':
            ctx.addErrorEx(
              `expected fields to be equal: ${fields.join(',')}.`,
              'properties-different',
              { value: val, values: values, fields: fields.join(',') }
            );
            break;
          case '!=':
            ctx.addErrorEx(
              `expected fields to be different: ${fields.join(',')}.`,
              'properties-equal',
              { value: val, values: values, fields: fields.join(',') }
            );
            break;
          default:
            ctx.addErrorEx(
              `expected fields to be ordered (${this._op}): ${fields.join(',')}.`,
              'properties-wrong-order-' + (ComparisonOp_Names[this._op] || this._op),
              { value: val, values: values, fields: fields.join(',') }
            );
            break;
        }
        ctx.popItem();
      }
    }
    return result;
  }

  usedItems():string[] { return this._fields; }

  private _fields: string[];
  private _op: ComparisonOp;
  private _comparator: Comparison<Primitive>;
}

export interface IEqualPropertiesConstraintOptions {
  properties: string|string[];
}

export class ModelTypeConstraintEqualProperties extends ModelTypeConstraintOptional<any> {
  constructor(fieldsOrSelf:string[]|IEqualPropertiesConstraintOptions|ModelTypeConstraintEqualProperties) {
    super();
    if (Array.isArray(fieldsOrSelf)) {
      this._fields = fieldsOrSelf.slice();
    } else if (fieldsOrSelf && (fieldsOrSelf as IEqualPropertiesConstraintOptions).properties) {
      this._fields = safeArray((fieldsOrSelf as IEqualPropertiesConstraintOptions).properties);
    } else {
      this._fields = (<ModelTypeConstraintEqualProperties>fieldsOrSelf)._fields.slice();
    }
  }
  private _isConstraintEqualFields() {} // marker property

  protected _id():string {
    return `equalFields(${this._fields.join(',')})`;
  }

  checkAndAdjustValue(val:any, ctx:IModelParseContext):any {
    let fields = this._fields;
    let values = fields.reduce((acc,k) => {
      if (-1 == acc.indexOf(val[k])) {
        acc.push(val[k]);
      }
      return acc;
    }, []);

    let result = val;
    if (values.length !== 1) {
      for (var f of fields) {
        ctx.pushItem(f, !this.warnOnly(), null);
        ctx.addErrorEx(
          `expected fields to be equal: ${fields.join(',')}.`,
          'properties-different',
          { value: val, values: values, fields: fields.join(',') }
        );
        ctx.popItem();
      }
    }
    return result;
  }

  usedItems():string[] { return this._fields; }

  private _fields:string[];
}

export interface IConditionOptions {
  property: string;
  value: string|string[]|number|number[];
  op?: ComparisonOp;
  invert?: boolean;
}

function createPredicateEquals(property:string, value:any, invert:boolean): Predicate<any> {
  if (Array.isArray(value)) {
    let valueArray = value.slice() as any[];

    return (x:any) => {
      let p = x[property];
      if (Array.isArray(p)) {
        return p.some(x => (-1 != valueArray.indexOf(x)) == !invert);
      }
      return (p !== undefined) && (-1 != valueArray.indexOf(p)) == !invert;
    }
  }
  return function(x:any): boolean {
    let p = x[property];
    if (Array.isArray(p)) {
      return ((-1 != p.indexOf(value)) == !invert);
    }
    return (p !== undefined) && (value === p) == !invert;
  }
}

/**
 * Creates a predicate for a conjunction of conditions.
 */
export function createPredicateAnd(condition: IConditionOptions|IConditionOptions[]): Predicate<any> {
  if (Array.isArray(condition)) {
    let predicates = condition.map(c => createSinglePredicate(c));
    return (x: any) => predicates.every(t => t(x));
  } else {
    return createSinglePredicate(condition);
  }
}

/**
 * Creates a predicate for a condition in disjunctive normal form.
 */
export function createPredicateOrOfAnd(condition: IConditionOptions|IConditionOptions[]): Predicate<any> {
  if (Array.isArray(condition)) {
    let predicates = condition.map(c => createSinglePredicate(c));
    return (x: any) => predicates.some(t => t(x));
  } else {
    return createPredicateAnd(condition);
  }
}

export function createSinglePredicate(condition: IConditionOptions): Predicate<any> {
  let { property, value, op, invert } = condition;

  switch (op) {
    case undefined:
    case null:
    case '==':
    case '=': return createPredicateEquals(property, value, invert);

    case '<':
    case '<=':
    case '>':
    case '>=':
      if (invert) {
        return (o:any) => inverse(ComparisonOp_Comparator[op])(o[property], value);
      }
      return (o:any) => ComparisonOp_Comparator[op](o[property], value);
  }

  console.warn(`unsupported condition: ${op}`, condition);
  return () => false;
}

function createValuePredicate(possibleValues:string[]|number[]): (x:string|number) => boolean {
  if (null == possibleValues || 0 === possibleValues.length) {
    return (x:string|number) => x != null;
  } else if (possibleValues.length == 1) {
    let val = possibleValues[0];
    return (x:string|number) => null == x || x == val;
  } else {
    let valArray = possibleValues as any[];
    return (x:string|number) => null == x || -1 != valArray.indexOf(x as any);
  }
}

export interface IConditionalValueConstraintOptions {
  condition: IConditionOptions|IConditionOptions[];

  // properties to require (may be just single item)
  properties: string|string[];
  // if properties is a single string, this is allowed:
  possibleValue?: string|number|string[]|number[];

  clearOtherwise: boolean;
}

export interface IConditionalValueConstraintSettings {
  id:string;
  predicate: (x:any) => boolean;
  valueCheck: (x:any) => boolean;
  properties: string[];
  possibleValues: any[];
  clearOtherwise: boolean;
  condition: IConditionOptions|IConditionOptions[];
}

export class ModelTypeConstraintConditionalValue extends ModelTypeConstraintOptional<any> {
  constructor(optionsOrSelf:IConditionalValueConstraintOptions|ModelTypeConstraintConditionalValue) {
    super();
    let options = optionsOrSelf as IConditionalValueConstraintOptions;

    if (options.condition && options.properties) {
      let { condition, properties, possibleValue } = options;
      let multiple = Array.isArray(properties) && properties.length > 1;
      if (multiple && null != possibleValue && !Array.isArray(possibleValue)) {
        throw new Error("must not combine list of required fields with single possibleValue");
      }

      let props = safeArray(properties);
      let allowed = safeArray<any>(possibleValue);

      let id_p = props.join(',');
      let id_v = allowed ? ` == [${allowed.join(',')}]` : ""
      //let id = `conditionalValue(${condition.property} ${condition.invert?'!=':'=='} ${condition.value} -> ${id_p}${id_v})`;
      let id = `conditionalValue()`;

      this._settings = {
        condition,
        predicate: createPredicateAnd(condition),
        valueCheck: createValuePredicate(allowed),
        properties: props,
        possibleValues: allowed,
        clearOtherwise: !!options.clearOtherwise,
        id: id
      };

    } else if (this._isConstraintConditionalValue == (<any>optionsOrSelf)["_isConstraintConditionalValue"]) {
      this._settings = (<ModelTypeConstraintConditionalValue>optionsOrSelf)._settings;
    } else {
      console.log("invalid constructor argument", optionsOrSelf);
      throw new Error("invalid constructor argument" + optionsOrSelf);
    }
  }
  private _isConstraintConditionalValue() {} // marker property

  protected _id():string {
    return this._settings.id;
  }

  checkAndAdjustValue(val:any, ctx:IModelParseContext):Date {
    var check = true;
    let s = this._settings;
    if (s.predicate(val)) {
      let isError = !this.isWarningOnly;
      for (var f of s.properties) {
        ctx.pushItem(f, isError, null);
        let thisValue = ctx.currentValue();
        let valid = s.valueCheck(thisValue);
        if (!valid) {
          if (s.possibleValues) {
            ctx.addMessageEx(isError, `illegal value.`, 'value-illegal', { value: ctx.currentValue(), allowed: s.possibleValues });
          } else {
            ctx.addMessage(isError, `required field not filled.`, 'required-empty');
          }
        }
        ctx.popItem();
      }
    } else if (s.clearOtherwise) {
      for (var f of s.properties) {
        delete val[f];
      }
      ctx._removeMessages((m) => -1 != s.properties.indexOf(m.property));
    }

    return val;
  }

  possibleValuesForContextData?(name:string|number, data:any):any[] {
    let s = this._settings;
    if (null != name && s.predicate(data) && -1 != s.properties.indexOf(name.toString())) {
      return s.possibleValues;
    }
    return null;
  }

  usedItems():string[] { return this._settings.properties; }

  slice(fields: string[]|number[]) {
    let fany = fields as any[];
    let slicedProperties = this._settings.properties.filter(x => -1 != fany.indexOf(x));
    if (0 == slicedProperties.length) {
      return null;
    }

    let { clearOtherwise, possibleValues, condition } = this._settings;
    return new ModelTypeConstraintConditionalValue({
      properties: slicedProperties,
      clearOtherwise,
      condition,
      possibleValue: possibleValues
    });
  }

  private _settings:IConditionalValueConstraintSettings;
}

/**
 * can be used for validation, only, not for value modification
 */
export class ModelTypePropertyConstraint extends ModelTypeConstraintOptional<any> {
  constructor(property:string, constraint: IModelTypeConstraint<any>) {
    super();
    this._property = property;
    this._constraint = constraint;
  }

  _id():string {
    return `${this._constraint.id}@${this._property}`;
  }

  checkAndAdjustValue(val:any, ctx:IModelParseContext):any {
    ctx.pushItem(this._property, false, null);
    let value = ctx.currentValue();
    try {
      this._constraint.checkAndAdjustValue(value, ctx);
    } catch (error) {
      ctx.addMessageEx(!this.isWarningOnly, 'value had unexpected type', 'value-type', { value, error });
    }
    ctx.popItem();
    return val;
  }

  usedItems():string[] { return [ this._property ]; }

  private _property:string;
  private _constraint:IModelTypeConstraint<any>
}