
export interface Predicate<T> {
  (x:T):boolean;
}

export interface IModelObject {
  [key:string]:any;
}

export interface IClientProps {
  propExists(key:string):boolean;
  propGet(key:string):any;
  propSet(key:string, val:any):void;
  propKeys():string[];
}

export interface IModelParseMessage {
  path:string;
  msg:string;
  args?:any[];
  isError:boolean;
}

export interface IModelParseContext {
  currentValue():any;
  currentRequired():boolean;
  currentKeyPath():string[];
  pushItem(key:string|number, required?:boolean):void;
  popItem():void;

  addWarning(msg:string, ...args:any[]):void;
  addError(msg:string, ...args:any[]):void;
  addMessage(isError:boolean, msg:string, ...args:any[]):void;

  errors:IModelParseMessage[];
  warnings:IModelParseMessage[];

  allowConversion:boolean;
}

export interface IModelType<T> extends IClientProps {
  name:string;
  kind:string;
  parse(ctx:IModelParseContext):T;
  validate(ctx:IModelParseContext):void;
  unparse(val:T):any;

  create():T;

  asItemType(): IModelTypeItem<T>;
}

export interface IModelTypeConstrainable<T> extends IModelType<T> {
  withConstraints(...c:IModelTypeConstraint<T>[]):this;
  findConstraints(p:Predicate<IModelTypeConstraint<T>>):IModelTypeConstraint<T>[];
}

export interface IModelTypeConstraint<T> {
  id:string;
  checkAndAdjustValue(val:T, ctx:IModelParseContext):T;
  usedFields?():string[];

  appliesTo?(kind:string):boolean;
}

export interface IModelTypeConstraintFactory {
  [kind:string]:(options:any) => IModelTypeConstraint<any>;
}

export interface IModelTypeItem<T> extends IModelTypeConstrainable<T> {
  fromString(valStr:string):T;
  asString(val:T):string;

  lowerBound():IModelTypeConstraint<T>;
  upperBound():IModelTypeConstraint<T>;
  possibleValues():T[]; // null -> no list of allowed values
}

export interface IModelTypeEntry {
  key:string;
  type:IModelType<any>;
  required:boolean;
}

export interface IModelTypeComposite<C> extends IModelType<C> {
  items:IModelTypeEntry[];
  subModel(name:string|number):IModelType<any>;
  slice(name:string[]|number[]):IModelTypeComposite<C>;
}

export interface IModelTypeCompositeBuilder<C> extends IModelTypeComposite<C> {
  extend<X>(type:IModelTypeComposite<X>):IModelTypeCompositeBuilder<C>;
  addItem<T>(key:string, type:IModelType<T>, required?:boolean):IModelTypeCompositeBuilder<C>;
}

export interface IModelTypeRegistry {
  type(name:string) : IModelType<any>;
  itemType(name:string) : IModelTypeItem<any>;
  addType(type:IModelType<any>): void;
  getRegisteredNames():string[];
}
