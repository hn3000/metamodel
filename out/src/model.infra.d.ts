import { MessageSeverity, IMessageProps, IPropertyStatusMessage, IModelParseContext, IModelType } from "./model.api";
export declare class ModelParseMessage implements IPropertyStatusMessage {
    private _property;
    private _msg;
    private _code;
    private _qualifiers;
    private _props;
    private _severity;
    constructor(severity: MessageSeverity, property: string, msg: string, code: string, props: IMessageProps, qualifiers?: string[]);
    readonly property: string;
    readonly msg: string;
    readonly code: string;
    readonly qualifiers: string[];
    readonly props: any[];
    readonly severity: MessageSeverity;
    readonly isError: boolean;
}
export declare class ObjectTraversal {
    constructor(obj: any);
    readonly top: any;
    descend(key: string): void;
    ascend(): void;
    private _top;
    private _stack;
    private _keyPath;
}
export declare class ParallelTraversal {
    constructor(obj: any[]);
    readonly top: any[];
    readonly topDefined: any;
    readonly topNonNull: any;
    descend(key: string): void;
    ascend(): void;
    prependTop(t: any): void;
    appendTop(t: any): void;
    _updateTop(obj: any[]): void;
    private _top;
    private _topDefined;
    private _topNonNull;
    private _stack;
}
export declare class ModelParseContext implements IModelParseContext {
    constructor(value: any, type: IModelType<any>, required?: boolean, allowConversion?: boolean);
    currentValue(): any;
    currentType(): IModelType<any>;
    currentRequired(): boolean;
    currentKeyPath(): string[];
    pushItem(key: string, required?: boolean, type?: IModelType<any>): void;
    popItem(): void;
    hasMessagesForCurrentValue(): boolean;
    addWarning(msg: string, code: string): void;
    addError(msg: string, code: string): void;
    addWarningEx(msg: string, code: string, props: IMessageProps): void;
    addErrorEx(msg: string, code: string, props: IMessageProps): void;
    addMessage(severity: MessageSeverity | boolean, msg: string, code: string): void;
    addMessageEx(severity: MessageSeverity | boolean, msg: string, code: string, props: IMessageProps): void;
    addMessages(msgs: IPropertyStatusMessage[]): void;
    _removeMessages(filter: (m: IPropertyStatusMessage) => boolean): void;
    readonly messages: IPropertyStatusMessage[];
    readonly warnings: IPropertyStatusMessage[];
    readonly errors: IPropertyStatusMessage[];
    readonly allowConversion: boolean;
    private _valueTraversal;
    private _currentType;
    private _currentRequired;
    private _allowConversion;
    private _requiredStack;
    private _typeStack;
    private _keyPath;
    private _messages;
}
