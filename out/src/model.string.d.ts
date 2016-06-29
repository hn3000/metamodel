import { IModelParseContext, IModelTypeConstraint } from "./model.api";
import { ModelConstraints, ModelTypeConstraintOptional, ModelTypeItem } from "./model.base";
export declare class ModelTypeString extends ModelTypeItem<string> {
    constructor(c?: ModelConstraints<string>);
    lowerBound(): IModelTypeConstraint<string>;
    upperBound(): IModelTypeConstraint<string>;
    parse(ctx: IModelParseContext): string;
    validate(ctx: IModelParseContext): void;
    unparse(value: string): any;
    asString(val: string): string;
    fromString(val: string): string;
    protected _kind(): string;
}
export declare class ModelTypeConstraintPossibleValues<T> extends ModelTypeConstraintOptional<T> {
    constructor(values: T[]);
    protected _id(): string;
    checkAndAdjustValue(val: T, ctx: IModelParseContext): T;
    private _allowedValues;
}
export declare class ModelTypeConstraintRegex extends ModelTypeConstraintOptional<string> {
    constructor(pattern: string | RegExp, flags?: string, message?: string);
    protected _id(): string;
    checkAndAdjustValue(val: string, ctx: IModelParseContext): string;
    private _pattern;
    private _message;
}
