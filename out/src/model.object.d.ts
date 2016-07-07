import { IModelType, IModelTypeItem, IModelTypeCompositeBuilder, IModelTypeEntry, IModelTypeComposite, IModelParseContext } from "./model.api";
import { ModelTypeConstrainable, ModelConstraints, ModelTypeConstraintOptional } from "./model.base";
export declare class ModelTypeObject<T> extends ModelTypeConstrainable<T> implements IModelTypeCompositeBuilder<T> {
    private _constructFun;
    private _entries;
    private _entriesByName;
    constructor(name: string, construct?: () => T, constraints?: ModelConstraints<T>);
    protected _clone(constraints: ModelConstraints<T>): this;
    asItemType(): IModelTypeItem<T>;
    addItem(key: string, type: IModelType<any>, required?: boolean): IModelTypeCompositeBuilder<T>;
    subModel(name: string | number): IModelType<any>;
    slice(names: string[] | number[]): IModelTypeComposite<T>;
    extend<X>(type: IModelTypeComposite<X>): IModelTypeCompositeBuilder<T>;
    readonly items: IModelTypeEntry[];
    parse(ctx: IModelParseContext): T;
    validate(ctx: IModelParseContext): void;
    unparse(value: T): any;
    create(): T;
    protected _kind(): string;
}
export declare class ModelTypeConstraintEqualFields extends ModelTypeConstraintOptional<any> {
    constructor(fieldsOrSelf: string[] | ModelTypeConstraintEqualFields);
    private _isConstraintEqualFields();
    protected _id(): string;
    checkAndAdjustValue(val: any, ctx: IModelParseContext): Date;
    private _fields;
}
export interface IRequiredIfOptions {
    ifField: string;
    ifValue: string | number | string[] | number[];
    required: string | string[];
    possibleValues?: any[];
}
export interface IRequiredIfSettings {
    ifField: string;
    ifValue: string[] | number[];
    required: string[];
    possibleValues?: any[];
}
export declare class ModelTypeConstraintRequiredIf extends ModelTypeConstraintOptional<any> {
    constructor(optionsOrSelf: IRequiredIfOptions | ModelTypeConstraintRequiredIf);
    private _isConstraintRequiredIf();
    protected _id(): string;
    _checkValue(val: any, possible: any | any[]): boolean;
    _checkIf(val: any): boolean;
    checkAndAdjustValue(val: any, ctx: IModelParseContext): Date;
    private _settings;
}
