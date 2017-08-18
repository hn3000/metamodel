import { IModelParseContext, IModelTypeConstraint } from "./model.api";
import { ModelConstraints, ModelTypeConstraintOptional, ModelTypeItem } from "./model.base";
export declare class ModelTypeString extends ModelTypeItem<string> {
    constructor(name?: string, c?: ModelConstraints<string>);
    lowerBound(): IModelTypeConstraint<string>;
    upperBound(): IModelTypeConstraint<string>;
    parse(ctx: IModelParseContext): string;
    validate(ctx: IModelParseContext): void;
    unparse(value: string): any;
    asString(val: string): string;
    fromString(val: string): string;
    create(): string;
    protected _kind(): string;
}
export declare class ModelTypeConstraintPossibleValues<T> extends ModelTypeConstraintOptional<T> {
    constructor(values: T[]);
    readonly allowedValues: T[];
    protected _id(): string;
    checkAndAdjustValue(value: T, ctx: IModelParseContext): T;
    private _allowedValues;
}
export declare class ModelTypeConstraintLength extends ModelTypeConstraintOptional<string> {
    constructor(minLen: number, maxLen: number, message?: string);
    protected _id(): string;
    checkAndAdjustValue(value: string, ctx: IModelParseContext): string;
    readonly minLength: number;
    readonly maxLength: number;
    private _minLength;
    private _maxLength;
    private _message;
}
export declare class ModelTypeConstraintRegex extends ModelTypeConstraintOptional<string> {
    constructor(pattern: string | RegExp, flags?: string, message?: string);
    protected _id(): string;
    checkAndAdjustValue(value: string, ctx: IModelParseContext): string;
    private _pattern;
    private _message;
}
export declare class ModelTypeConstraintInvalidRegex extends ModelTypeConstraintOptional<string> {
    constructor(pattern: string | RegExp, flags?: string, message?: string);
    protected _id(): string;
    checkAndAdjustValue(value: string, ctx: IModelParseContext): string;
    private _pattern;
    private _message;
}
