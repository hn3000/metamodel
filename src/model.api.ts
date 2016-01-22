
export interface IModelObject {
  [key:string]:any;
}

export interface IModelParseMessage {
  msg:string;
  args:any[];
}

export interface IModelParseContext {
  currentValue():any;
  currentRequired():boolean;
  currentKeyPath():string[];
  pushItem(key:string, required?:boolean):void;
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
}

export interface IModelTypeItem<T> extends IModelType<T> {
  fromString(valStr:string):T;
  asString(val:T):string;
}

export interface IModelTypeEntry {
  key:string;
  type:IModelType<any>;
}

export interface IModelTypeComposite<C> extends IModelType<C> {
  items:IModelTypeEntry[];
}

export interface IModelTypeCompositeBuilder<C> extends IModelTypeComposite<C> {
  extend<X>(type:IModelTypeComposite<X>):IModelTypeCompositeBuilder<C>;
  addItem<T>(key:string, type:IModelType<T>):IModelTypeCompositeBuilder<C>;
}
