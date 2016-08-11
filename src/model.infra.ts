import {
  Predicate,
  MessageSeverity,
  IMessageProps,
  IPropertyStatusMessage,
  IModelParseContext,
  IModelType,
  IModelTypeConstraint,
  IModelTypeComposite
} from "./model.api"

export class ModelParseMessage implements IPropertyStatusMessage {
  private _property:string;
  private _msg:string;
  private _code:string;
  private _qualifiers:string[];
  private _props:any;
  private _severity: MessageSeverity;

  constructor(severity:MessageSeverity, property: string, msg:string, code:string, props:IMessageProps, qualifiers?:string[]) {
    this._severity = severity;
    this._property = property;
    this._msg = msg;
    this._code = code;
    this._qualifiers = qualifiers || [];
    this._props = props;
  }

  get property():string          { return this._property; }
  get msg():string               { return this._msg; }
  get code():string              { return this._code; }
  get qualifiers():string[]      { return this._qualifiers; }
  get props():any[]              { return this._props; }
  get severity():MessageSeverity { return this._severity; }
  get isError():boolean { return this._severity == MessageSeverity.ERROR; }
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
  constructor(value:any, type: IModelType<any>, required?:boolean, allowConversion:boolean=true) {
    this._valueTraversal = new ObjectTraversal(value);
    this._currentType = type;
    this._currentRequired = !!required;
    this._allowConversion = allowConversion;
    this._keyPath = [];
    this._typeStack = [];
    this._requiredStack = [];
    this._messages = [];
  }

  currentValue():any {
    return this._valueTraversal.top;
  }
  currentType():IModelType<any> {
    return this._currentType;
  }
  currentRequired():boolean {
    return this._currentRequired;
  }
  currentKeyPath():string[] {
    return this._keyPath;
  }
  pushItem(key:string, required?:boolean, type?:IModelType<any>) {
    this._valueTraversal.descend(key);
    this._typeStack.push(this._currentType);
    this._requiredStack.push(this._currentRequired);

    let nextType = type;
    if (!nextType) {
      let currentType = this._currentType as IModelTypeComposite<any>;
      if (currentType.itemType) {
        nextType = currentType.itemType(key);
      }
      if (!nextType) {
        nextType = type;
      }
    }
    this._currentType = nextType;
    this._currentRequired = !!required;
    this._keyPath.push(key);
  }
  popItem() {
    if (0 < this._requiredStack.length) {
      this._valueTraversal.ascend();
      this._currentType = this._typeStack.pop();
      this._currentRequired = this._requiredStack.pop();
      this._keyPath.pop();
    }
  }

  hasMessagesForCurrentValue():boolean {
    let keyPath = this.currentKeyPath().join('.');
    return this._messages.some(x => x.property == keyPath);
  }

  addWarning(msg:string, code:string) {
    this.addMessage(MessageSeverity.WARNING, msg, code);
  }
  addError(msg:string, code:string) {
    this.addMessage(MessageSeverity.ERROR, msg, code);
  }
  addWarningEx(msg:string, code:string, props:IMessageProps) {
    this.addMessageEx(MessageSeverity.WARNING, msg, code, props);
  }
  addErrorEx(msg:string, code:string, props:IMessageProps) {
    this.addMessageEx(MessageSeverity.ERROR, msg, code, props);
  }
  addMessage(severity:MessageSeverity|boolean, msg:string, code:string) {
    this.addMessageEx(severity, msg, code, {});
  }
  addMessageEx(severity:MessageSeverity|boolean, msg:string, code:string, props:IMessageProps) {
    let sev: MessageSeverity;
    if (typeof severity === 'boolean') {
      sev = severity ? MessageSeverity.ERROR : MessageSeverity.WARNING;
    } else {
      sev = severity;
    }
    var message = new ModelParseMessage(
      sev,
      this.currentKeyPath().join('.'),
      msg, code, props, 
      this.currentType() ? this.currentType().qualifiers||[] :[]
    );
    this._messages.push(message);
  }

  _removeMessages(filter:(m:IPropertyStatusMessage) => boolean) {
    this._messages = this._messages.filter((x) => !filter(x));
  }

  get messages():IPropertyStatusMessage[] {
    return this._messages;
  }

  get warnings():IPropertyStatusMessage[] {
    return this._messages.filter((x) => x.severity === MessageSeverity.WARNING);
  }

  get errors():IPropertyStatusMessage[] {
    return this._messages.filter((x) => x.severity === MessageSeverity.ERROR);
  }

  get allowConversion():boolean {
    return this._allowConversion;
  }

  private _valueTraversal:ObjectTraversal;
  private _currentType:IModelType<any>;
  private _currentRequired:boolean;
  private _allowConversion:boolean;
  private _requiredStack: boolean[];
  private _typeStack: IModelType<any>[];
  private _keyPath: string[];
  private _messages: IPropertyStatusMessage[];
}
