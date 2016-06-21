
export interface Predicate<T> {
  (x:T):boolean;
}

export interface IModelObject {
  [key:string]:any;
}

export interface IModelParseMessage {
  path:string;
  msg:string;
  args:any[];
}

export interface IModelParseContext {
  currentValue():any;
  currentRequired():boolean;
  currentKeyPath():string[];
  pushItem(key:string|number, required?:boolean):void;
  popItem():void;

  addWarning(msg:string, ...args:any[]):void;
  addError(msg:string, ...args:any[]):void;

  errors:IModelParseMessage[];
  warnings:IModelParseMessage[];

  allowConversion:boolean;
}

export interface IModelType<T> {
  name:string;
  parse(ctx:IModelParseContext):T;
  validate(ctx:IModelParseContext):void;
  unparse(val:T):any;

  asItemType(): IModelTypeItem<T>;
}

export interface IModelTypeConstrainable<T> extends IModelType<T> {
  withConstraints(...c:IModelTypeConstraint<T>[]):this;
  findConstraints(p:Predicate<IModelTypeConstraint<T>>):IModelTypeConstraint<T>[];
}

export interface IModelTypeConstraint<T> {
  id:string;
  checkAndAdjustValue(val:T, ctx:IModelParseContext):T;
}

export interface IModelTypeItem<T> extends IModelTypeConstrainable<T> {
  fromString(valStr:string):T;
  asString(val:T):string;

  lowerBound():IModelTypeConstraint<T>;
  upperBound():IModelTypeConstraint<T>;
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