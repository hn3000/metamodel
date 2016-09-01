export interface Predicate<T> {
    (x: T): boolean;
}
export interface IModelObject {
    [key: string]: any;
}
export interface IClientProps {
    propExists(key: string): boolean;
    propGet(key: string): any;
    propSet(key: string, val: any): void;
    propKeys(): string[];
}
export interface IMessageProps {
    [key: string]: number | string | any;
}
export declare enum MessageSeverity {
    NOTE = 0,
    SUCCESS = 1,
    WARNING = 2,
    ERROR = 3,
}
export interface IStatusMessage {
    msg: string;
    code: string;
    qualifiers?: string[];
    props?: IMessageProps;
    severity: MessageSeverity;
}
export interface IPropertyStatusMessage extends IStatusMessage {
    property: string;
}
export interface IModelParseContext {
    currentValue(): any;
    currentRequired(): boolean;
    currentKeyPath(): string[];
    currentType(): IModelType<any>;
    pushItem(key: string | number, required: boolean, type: IModelType<any>): void;
    popItem(): void;
    addWarning(msg: string, code: string): void;
    addError(msg: string, code: string): void;
    addErrorEx(msg: string, code: string, props: IMessageProps): void;
    addWarningEx(msg: string, code: string, props: IMessageProps): void;
    addMessage(isError: boolean, msg: string, code: string): void;
    addMessage(severity: MessageSeverity, msg: string, code: string): void;
    addMessageEx(isError: boolean, msg: string, code: string, props: IMessageProps): void;
    addMessageEx(severity: MessageSeverity, msg: string, code: string, props: IMessageProps): void;
    _removeMessages(filter: (m: IPropertyStatusMessage) => boolean): void;
    hasMessagesForCurrentValue(): boolean;
    messages: IPropertyStatusMessage[];
    warnings: IPropertyStatusMessage[];
    errors: IPropertyStatusMessage[];
    allowConversion: boolean;
}
export interface IModelType<T> extends IClientProps {
    name: string;
    kind: string;
    qualifiers: string[];
    parse(ctx: IModelParseContext): T;
    validate(ctx: IModelParseContext): void;
    unparse(val: T): any;
    create(): T;
    asItemType(): IModelTypeItem<T>;
}
export interface IModelTypeConstrainable<T> extends IModelType<T> {
    withConstraints(...c: IModelTypeConstraint<T>[]): this;
    findConstraints(p: Predicate<IModelTypeConstraint<T>>): IModelTypeConstraint<T>[];
}
export interface IModelTypeConstraint<T> {
    id: string;
    checkAndAdjustValue(val: T, ctx: IModelParseContext): T;
    usedItems?(): string[];
    appliesTo?(kind: string): boolean;
    possibleValuesForContextData?(name: string | number, data: T): any[];
}
export interface IModelTypeConstraintFactory {
    [kind: string]: (options: any) => IModelTypeConstraint<any>;
}
export interface IModelTypeItem<T> extends IModelTypeConstrainable<T> {
    fromString(valStr: string): T;
    asString(val: T): string;
    lowerBound(): IModelTypeConstraint<T>;
    upperBound(): IModelTypeConstraint<T>;
    possibleValues(): T[];
}
export interface IModelTypeEntry {
    key: string;
    type: IModelType<any>;
    required: boolean;
}
export interface IModelTypeComposite<C> extends IModelTypeConstrainable<C> {
    items: IModelTypeEntry[];
    itemType(name: string | number): IModelType<any>;
    slice(name: string[] | number[]): IModelTypeComposite<C>;
    /**
     * return: null -> no list of allowed values,
     *         empty array -> no values possible
     */
    possibleValuesForContextData(name: string | number, data: any): any[];
}
export interface IModelTypeCompositeBuilder<C> extends IModelTypeComposite<C> {
    extend<X>(type: IModelTypeComposite<X>): IModelTypeCompositeBuilder<C>;
    addItem<T>(key: string, type: IModelType<T>, required?: boolean): IModelTypeCompositeBuilder<C>;
}
export interface IModelTypeRegistry {
    type(name: string): IModelType<any>;
    itemType(name: string): IModelTypeItem<any>;
    addType(type: IModelType<any>): void;
    getRegisteredNames(): string[];
}
