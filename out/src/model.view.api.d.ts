import { IModelType, IModelTypeComposite, IStatusMessage, IPropertyStatusMessage, Primitive } from "./model.api";
export interface IModelViewField {
    keypath: string[];
    pointer: string;
    key: string;
    type: IModelType<any>;
    validate(val: any): IPropertyStatusMessage[];
}
export interface IModelViewPage {
    alias: string;
    type: IModelTypeComposite<any>;
    fields: string[];
}
export declare enum ValidationScope {
    VISITED = 0,
    PAGE = 1,
    FULL = 2
}
/**
 * Provides an immutable facade for a model, adding IModelType
 * based validation and support for copy-on-write mutation.
 *
 */
export interface IModelView<T> {
    getModelType(): IModelType<T>;
    getModel(): T;
    withFieldEditableFlag(keyPath: string | string[], flag: boolean): IModelView<T>;
    withFieldEditableFlags(flags: {
        [keyPath: string]: boolean;
    }): IModelView<T>;
    isFieldEditable(keyPath: string | string[]): boolean;
    withClearedVisitedFlags(): IModelView<any>;
    withAddedVisitedFlags(fields: string[]): IModelView<any>;
    withChangedField(keyPath: string | string[], newValue: Primitive | any[]): IModelView<T>;
    withAddedData(obj: any): IModelView<T>;
    getFieldValue(keyPath: string | string[]): any;
    getFieldType(keyPath: string | string[]): IModelType<any>;
    getField(keyPath: string | string[]): IModelViewField;
    getFields(): IModelViewField[];
    getPossibleFieldValues(keyPath: string | string[]): any[];
    getFieldMessages(keyPath: string | string[]): IPropertyStatusMessage[];
    getValidationMessages(): IPropertyStatusMessage[];
    isFieldVisited(field: string | string[]): boolean;
    isFieldValid(keyPath: string | string[]): boolean;
    areFieldsValid(fields: string[]): boolean;
    getPages(): IModelViewPage[];
    getPage(aliasOrIndex?: string | number): IModelViewPage;
    getPageMessages(aliasOrIndex?: string | number): IStatusMessage[];
    isPageVisited(aliasOrIndex: string | number): boolean;
    isPageValid(aliasOrIndex?: string | number): boolean;
    isVisitedValid(): boolean;
    areVisitedPagesValid(): boolean;
    arePagesUpToCurrentValid(): boolean;
    isValid(): boolean;
    isFinished(): boolean;
    getStatusMessages(): IStatusMessage[];
    currentPageIndex: number;
    currentPageNo: number;
    changePage(step: number): IModelView<T>;
    gotoPage(index: number, validationScope?: ValidationScope): IModelView<T>;
    withValidationMessages(messages: IPropertyStatusMessage[]): IModelView<T>;
    withStatusMessages(messages: IStatusMessage[]): IModelView<T>;
    validationScope(): ValidationScope;
    validateDefault(): Promise<IModelView<T>>;
    validateVisited(): Promise<IModelView<T>>;
    validatePage(): Promise<IModelView<T>>;
    validateFull(): Promise<IModelView<T>>;
}
export interface IValidationResult {
    messages: IPropertyStatusMessage[];
}
export interface IValidator {
    (oldModel: any, newModel: any): Promise<IValidationResult>;
}
