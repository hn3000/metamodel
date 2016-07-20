import {
  Predicate,
  IMessageProps,
  IModelParseMessage,
  IModelParseContext,
  IModelTypeConstraint,
  IModelTypeComposite
} from "./model.api"

export class ModelParseMessage implements IModelParseMessage {
  private _path:string;
  private _msg:string;
  private _code:string;
  private _args:any[];
  private _isError:boolean;

  constructor(isError:boolean, path: string, msg:string, code:string, ...args:any[]) {
    this._path = path;
    this._msg = msg;
    this._code = code;
    this._args = args;
    this._isError = isError;
  }

  get path():string { return this._path; }
  get msg():string { return this._msg; }
  get code():string { return this._code; }
  get args():any[] { return this._args; }
  get isError():boolean { return this._isError; }
}

export class ObjectTraversal {
  constructor(obj:any) {
    this._top = obj;
    this._stack = [];
    this._keyPath = [];
  }

  get top(): any {
    return this._top;
  }

  descend(key:string) {
    const top = this._top;
    this._stack.push(top);
    this._top = top != null ? top[key] : undefined;
    this._keyPath.push(key);
  }
  ascend() {
    if (0 < this._stack.length) {
      this._top = this._stack.pop();
      this._keyPath.pop();
    }
  }

  private _top:any;
  private _stack:any[];
  private _keyPath:string[];
}

export class ParallelTraversal {
  constructor(obj:any[]) {
    this._updateTop(obj || []);
    this._stack = [];
  }

  get top(): any[] { return this._top; }
  get topDefined(): any { return this._topDefined; }
  get topNonNull(): any { return this._topNonNull; }

  descend(key:string) {
    const top = this._top;
    this._stack.push(top);
    this._updateTop(top != null ? top.map((x)=>x[key]) : [ ]);
  }
  ascend() {
    if (0 < this._stack.length) {
      this._updateTop(this._stack.pop());
    }
  }

  prependTop(t:any) {
    this._top.splice(0,0,t);
  }

  appendTop(t:any) {
    this._top.push(t);
  }

  _updateTop(obj:any[]) {
    this._top = obj;
    this._topDefined = obj.filter((x)=>(undefined!==x))[0];
    this._topNonNull = obj.filter((x)=>(null!=x))[0];
  }

  private _top:any[];
  private _topDefined:any;
  private _topNonNull:any;
  private _stack:any[][];
}


export class ModelParseContext implements IModelParseContext {
  constructor(value:any, required?:boolean, allowConversion:boolean=true) {
    this._valueTraversal = new ObjectTraversal(value);
    this._currentRequired = !!required;
    this._allowConversion = allowConversion;
    this._keyPath = [];
    this._requiredStack = [];
    this._warnings = [];
    this._errors = [];
  }

  currentValue():any {
    return this._valueTraversal.top;
  }
  currentRequired():boolean {
    return this._currentRequired;
  }
  currentKeyPath():string[] {
    return this._keyPath;
  }
  pushItem(key:string, required?:boolean) {
    this._valueTraversal.descend(key);
    this._requiredStack.push(this._currentRequired);
    this._currentRequired = !!required;
    this._keyPath.push(key);
  }
  popItem() {
    if (0 < this._requiredStack.length) {
      this._valueTraversal.ascend();
      this._currentRequired = this._requiredStack.pop();
      this._keyPath.pop();
    }
  }

  addMessage(isError:boolean, msg:string, code:string) {
    this.addMessageEx(isError, msg, code, {});
  }
  addWarning(msg:string, code:string) {
    this.addMessage(false, msg, code);
  }
  addError(msg:string, code:string) {
    this.addMessage(true, msg, code);
  }
  addMessageEx(isError:boolean, msg:string, code:string, props:IMessageProps) {
    var message = new ModelParseMessage(
      isError,
      this.currentKeyPath().join('.'),
      msg, code, props
    );
    (isError?this._errors:this._warnings).push(message);
  }
  addWarningEx(msg:string, code:string, props:IMessageProps) {
    this.addMessageEx(false, msg, code, props);
  }
  addErrorEx(msg:string, code:string, props:IMessageProps) {
    this.addMessageEx(true, msg, code, props);
  }


  get warnings():IModelParseMessage[] {
    return this._warnings;
  }

  get errors():IModelParseMessage[] {
    return this._errors;
  }

  get allowConversion():boolean {
    return this._allowConversion;
  }

  private _valueTraversal:ObjectTraversal;
  private _currentRequired:boolean;
  private _allowConversion:boolean;
  private _requiredStack: boolean[];
  private _keyPath: string[];
  private _warnings: IModelParseMessage[];
  private _errors: IModelParseMessage[];
}
