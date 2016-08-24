import { IModelType, IModelTypeItem, IModelTypeCompositeBuilder, IModelTypeEntry, IModelTypeComposite, IModelParseContext, IModelTypeConstraint } from "./model.api";
import { ModelTypeConstrainable, ModelConstraints, ModelTypeConstraintOptional } from "./model.base";
export declare class ModelTypeAny extends ModelTypeConstrainable<any> implements IModelTypeItem<any> {
    private _constructFun;
    constructor(name: string, construct?: () => any, constraints?: ModelConstraints<any>);
    protected _clone(constraints: ModelConstraints<any>): this;
    protected _kind(): string;
    asItemType(): IModelTypeItem<any>;
    fromString(text: string): any;
    asString(obj: any): string;
    lowerBound(): IModelTypeConstraint<any>;
    upperBound(): IModelTypeConstraint<any>;
    possibleValues(): any[];
    create(): any;
    parse(ctx: IModelParseContext): any;
    validate(ctx: IModelParseContext): void;
    unparse(val: any): any;
}
export declare class ModelTypeObject<T> extends ModelTypeConstrainable<T> implements IModelTypeCompositeBuilder<T> {
    private _constructFun;
    private _entries;
    private _entriesByName;
    private _allowAdditional;
    constructor(name: string, construct?: () => T, constraints?: ModelConstraints<T>);
    protected _clone(constraints: ModelConstraints<T>): this;
    asItemType(): IModelTypeItem<T>;
    addItem(key: string, type: IModelType<any>, required?: boolean): IModelTypeCompositeBuilder<T>;
    itemType(name: string | number): IModelType<any>;
    slice(names: string[] | number[]): IModelTypeComposite<T>;
    extend<X>(type: IModelTypeComposite<X>): IModelTypeCompositeBuilder<T>;
    readonly items: IModelTypeEntry[];
    parse(ctx: IModelParseContext): T;
    validate(ctx: IModelParseContext): void;
    unparse(value: T): any;
    create(): T;
    protected _kind(): string;
}
export interface IEqualPropertiesConstraintOptions {
    properties: string | string[];
}
export declare class ModelTypeConstraintEqualProperties extends ModelTypeConstraintOptional<any> {
    constructor(fieldsOrSelf: string[] | IEqualPropertiesConstraintOptions | ModelTypeConstraintEqualProperties);
    private _isConstraintEqualFields();
    protected _id(): string;
    checkAndAdjustValue(val: any, ctx: IModelParseContext): any;
    usedItems(): string[];
    private _fields;
}
export interface IConditionOptions {
    property: string;
    value: string | string[] | number | number[];
    op?: "=";
    invert?: boolean;
}
export interface IConditionalValueConstraintOptions {
    condition: IConditionOptions;
    properties: string | string[];
    possibleValue?: string | number | string[] | number[];
    clearOtherwise: boolean;
}
export interface IConditionalValueConstraintSettings {
    id: string;
    predicate: (x: any) => boolean;
    valueCheck: (x: any) => boolean;
    properties: string[];
    possibleValues: any[];
    clearOtherwise: boolean;
}
export declare class ModelTypeConstraintConditionalValue extends ModelTypeConstraintOptional<any> {
    constructor(optionsOrSelf: IConditionalValueConstraintOptions | ModelTypeConstraintConditionalValue);
    private _isConstraintConditionalValue();
    protected _id(): string;
    checkAndAdjustValue(val: any, ctx: IModelParseContext): Date;
    usedItems(): string[];
    private _settings;
}
/**
 * can be used for validation, only, not for value modification
 */
export declare class ModelTypePropertyConstraint extends ModelTypeConstraintOptional<any> {
    constructor(property: string, constraint: IModelTypeConstraint<any>);
    _id(): string;
    checkAndAdjustValue(val: any, ctx: IModelParseContext): any;
    usedItems(): string[];
    private _property;
    private _constraint;
}
