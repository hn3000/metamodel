import { IModelType, IModelTypeComposite, IModelParseMessage } from "./model.api";
export declare type Primitive = string | number | boolean | string[] | number[];
export interface IModelViewField {
    keypath: string[];
    pointer: string;
    key: string;
    type: IModelType<any>;
    validate(val: any): IModelParseMessage[];
}
export interface IModelViewPage {
    alias: string;
    type: IModelTypeComposite<any>;
    fields: string[];
}
export declare enum ValidationScope {
    VISITED = 0,
    PAGE = 1,
    FULL = 2,
}
/**
 * Provides an immutable facade for a model, adding IModelType
 * based validation and support for copy-on-write mutation.
 *
 */
export interface IModelView<T> {
    getModelType(): IModelType<T>;
    getModel(): T;
    withChangedField(keyPath: string | string[], newValue: Primitive | any[]): IModelView<T>;
    withAddedData(obj: any): IModelView<T>;
    getFieldValue(keyPath: string | string[]): any;
    getField(keyPath: string | string[]): IModelViewField;
    getFields(): IModelViewField[];
    getFieldMessages(keyPath: string | string[]): IValidationMessage[];
    isFieldValid(keyPath: string | string[]): boolean;
    getPages(): IModelViewPage[];
    getPage(alias: string): IModelViewPage;
    getPageMessages(aliasOrIndex?: string | number): IValidationMessage[];
    isPageValid(alias: string): boolean;
    currentPageIndex: number;
    currentPageNo: number;
    withValidationMessages(messages: IValidationMessage[]): IModelView<T>;
    validationScope(): ValidationScope;
    validateDefault(): Promise<IModelView<T>>;
    validateVisited(): Promise<IModelView<T>>;
    validatePage(): Promise<IModelView<T>>;
    validateFull(): Promise<IModelView<T>>;
    changePage(step: number): Promise<IModelView<T>>;
}
export interface IValidationMessage extends IModelParseMessage {
}
export interface IValidationResult {
    messages: IValidationMessage[];
}
export interface IValidator {
    (oldModel: any, newModel: any): Promise<IValidationResult>;
}
export declare class ModelViewField implements IModelViewField {
    constructor(key: string, type: IModelType<any>);
    readonly keypath: string[];
    readonly key: string;
    readonly pointer: string;
    readonly type: IModelType<any>;
    validate(val: any): IValidationMessage[];
    private _keyString;
    private _keyPath;
    private _type;
}
export declare class ModelViewPage {
    constructor(alias: string, pageType: IModelTypeComposite<any>);
    readonly alias: string;
    readonly type: IModelTypeComposite<any>;
    readonly fields: string[];
    private _alias;
    private _type;
}
export declare class ModelViewMeta<T> {
    constructor(type: IModelTypeComposite<T>);
    getPages(): ModelViewPage[];
    getModelType(): IModelTypeComposite<T>;
    getFields(): IModelViewField[];
    getField(keyPath: string | string[]): IModelViewField;
    _updatedModel(model: any, keyPath: string[], newValue: Primitive | any[]): any;
    _updatedModelWithType(model: any, keyPath: string[], newValue: Primitive | any[], type: IModelType<any>): any;
    private _modelType;
    private _fields;
    private _pages;
}
/**
 * Provides an immutable facade for a model, adding IModelType
 * based validation and support for copy-on-write mutation.
 *
 */
export declare class ModelView<T> implements IModelView<T> {
    constructor(modelTypeOrSelf: IModelTypeComposite<T> | ModelView<T>, modelData?: any);
    getModelType(): IModelType<T>;
    getField(keyPath: string | string[]): IModelViewField;
    getFields(): IModelViewField[];
    getModel(): T;
    withValidationMessages(messages: IValidationMessage[]): ModelView<T>;
    validationScope(): ValidationScope;
    validateDefault(): Promise<IModelView<T>>;
    validateVisited(): Promise<IModelView<T>>;
    validatePage(): Promise<IModelView<T>>;
    validateFull(): Promise<IModelView<T>>;
    private _validateSlice(modelSlice, kind);
    withChangedField(keyPath: string | string[], newValue: Primitive | any[]): IModelView<T>;
    withAddedData(obj: any): IModelView<T>;
    _asKeyArray(keyPath: string | string[]): string[];
    _asKeyString(keyPath: string | string[]): string;
    getFieldValue(keyPath: string | string[]): any;
    getFieldMessages(keyPath: string | string[]): IValidationMessage[];
    isFieldValid(keyPath: string | string[]): boolean;
    getPages(): ModelViewPage[];
    getPage(aliasOrIndex?: string | number): IModelViewPage;
    getPageMessages(aliasOrIndex?: string | number): IValidationMessage[];
    isPageValid(aliasOrIndex?: string | number): boolean;
    readonly currentPageIndex: number;
    readonly currentPageNo: number;
    changePage(step: number): Promise<IModelView<T>>;
    private _viewMeta;
    private _inputModel;
    private _model;
    private _visitedFields;
    private _currentPage;
    private _validationScope;
    private _validations;
    private _messages;
    private _messagesByField;
}
