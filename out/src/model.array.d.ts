import { IModelType, IModelParseContext, IModelTypeComposite, IModelTypeEntry } from "./model.api";
import { ModelTypeConstrainable, ModelConstraints, ModelTypeConstraintOptional } from "./model.base";
export declare class ModelTypeArray<T> extends ModelTypeConstrainable<T[]> implements IModelTypeComposite<T[]> {
    constructor(elementType: IModelType<T>, constraints?: ModelConstraints<T[]>);
    parse(ctx: IModelParseContext): T[];
    validate(ctx: IModelParseContext): void;
    unparse(val: T[]): any;
    create(): T[];
    readonly items: IModelTypeEntry[];
    itemType(): IModelType<T>;
    slice(): this;
    possibleValuesForContextData(name: string | number, data: any): any[];
    protected _kind(): string;
    private _elementType;
}
export interface IArraySizeConstraintOptions {
    minLength: number;
    maxLength: number;
}
export declare class ModelTypeArraySizeConstraint<T> extends ModelTypeConstraintOptional<T[]> {
    constructor(options: IArraySizeConstraintOptions);
    _id(): string;
    checkAndAdjustValue(v: T[], c: IModelParseContext): T[];
    private _settings;
}
export declare class ModelTypeArrayUniqueElementsConstraint<T> extends ModelTypeConstraintOptional<T[]> {
    constructor();
    _id(): string;
    checkAndAdjustValue(v: T[], c: IModelParseContext): T[];
}
