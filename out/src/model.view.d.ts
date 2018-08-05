import { IModelType, IModelTypeComposite, IStatusMessage, IPropertyStatusMessage, Primitive } from "./model.api";
import { IModelView, IModelViewField, IModelViewPage, ValidationScope } from "./model.view.api";
export declare class ModelViewField implements IModelViewField {
    constructor(key: string, type: IModelType<any>);
    readonly keypath: string[];
    readonly key: string;
    readonly pointer: string;
    readonly type: IModelType<any>;
    validate(val: any): IPropertyStatusMessage[];
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
    constructor(modelTypeOrSelf: IModelTypeComposite<T> | ModelView<T>, modelData?: any, initialPage?: number);
    getModelType(): IModelType<T>;
    getField(keyPath: string | string[]): IModelViewField;
    getFields(): IModelViewField[];
    getModel(): T;
    withValidationMessages(messages: IPropertyStatusMessage[]): ModelView<T>;
    withStatusMessages(messages: IStatusMessage[]): ModelView<T>;
    withClearedVisitedFlags(): IModelView<any>;
    withAddedVisitedFlags(fields: string[]): IModelView<any>;
    validationScope(): ValidationScope;
    validateDefault(): Promise<IModelView<T>>;
    validateVisited(): Promise<IModelView<T>>;
    validatePage(): Promise<IModelView<T>>;
    validateFull(): Promise<IModelView<T>>;
    private _validateSlice;
    withFieldEditableFlag(keypath: string | string[], flag: boolean): ModelView<T>;
    withFieldEditableFlags(flags: {
        [keypath: string]: boolean;
    }): ModelView<T>;
    isFieldEditable(keypath: string | string[]): boolean;
    withChangedField(keyPath: string | string[], newValue: Primitive | any[]): IModelView<T>;
    withAddedData(obj: any): IModelView<T>;
    _asKeyArray(keyPath: string | string[]): string[];
    _asKeyString(keyPath: string | string[]): string;
    getFieldValue(keyPath: string | string[]): any;
    getPossibleFieldValues(keyPath: string | string[]): any[];
    getFieldType(keyPath: string | string[]): IModelType<any>;
    getFieldMessages(keyPath: string | string[]): IPropertyStatusMessage[];
    getValidationMessages(): IPropertyStatusMessage[];
    isFieldValid(keyPath: string | string[]): boolean;
    getPages(): ModelViewPage[];
    getPage(aliasOrIndex?: string | number): IModelViewPage;
    getPageMessages(aliasOrIndex?: string | number): IStatusMessage[];
    isPageValid(aliasOrIndex?: string | number): boolean;
    areVisitedPagesValid(): boolean;
    arePagesUpToCurrentValid(): boolean;
    isVisitedValid(): boolean;
    isValid(): boolean;
    areFieldsValid(fields: string[]): boolean;
    isFieldVisited(field: string | string[]): boolean;
    isPageVisited(aliasOrIndex: string | number): boolean;
    hasStatusError(): boolean;
    getStatusMessages(): IStatusMessage[];
    readonly currentPageIndex: number;
    readonly currentPageNo: number;
    isFinished(): boolean;
    changePage(step: number): IModelView<T>;
    gotoPage(index: number, validationScope?: ValidationScope): IModelView<T>;
    private _visitedPageFields;
    private _viewMeta;
    private _inputModel;
    private _model;
    private _visitedFields;
    private _readonlyFields;
    private _currentPage;
    private _validationScope;
    private _validations;
    private _statusMessages;
    private _messages;
    private _messagesByField;
}
