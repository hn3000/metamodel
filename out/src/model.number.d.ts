import { IModelParseContext, IModelTypeConstraint } from "./model.api";
import { ModelConstraints, ModelTypeConstraintOptional, ModelTypeItem } from "./model.base";
export declare class ModelTypeNumber extends ModelTypeItem<number> {
    constructor(c?: ModelConstraints<number>);
    lowerBound(): IModelTypeConstraint<number>;
    upperBound(): IModelTypeConstraint<number>;
    parse(ctx: IModelParseContext): number;
    validate(ctx: IModelParseContext): void;
    unparse(value: number): any;
    create(): number;
    fromString(val: string): number;
    asString(val: number): string;
    protected _kind(): string;
}
export declare class ModelTypeConstraintInteger implements IModelTypeConstraint<number> {
    readonly id: string;
    checkAndAdjustValue(val: number, ctx: IModelParseContext): number;
}
export declare class ModelTypeConstraintMultipleOf extends ModelTypeConstraintOptional<number> {
    constructor(modulus: number | ModelTypeConstraintMultipleOf);
    _id(): string;
    checkAndAdjustValue(val: number, ctx: IModelParseContext): number;
    readonly modulus: number;
    private _modulus;
}
export declare abstract class ModelTypeConstraintComparison extends ModelTypeConstraintOptional<number> {
    constructor(val: number | ModelTypeConstraintComparison);
    readonly value: number;
    warnOnly(): this;
    protected _id(): string;
    protected _op(): string;
    protected _compare(a: number, b: number): boolean;
    protected _code(): string;
    checkAndAdjustValue(val: number, ctx: IModelParseContext): number;
    private _val;
}
export declare class ModelTypeConstraintLess extends ModelTypeConstraintComparison {
    constructor(val: number);
    protected _op(): string;
    protected _compare(a: number, b: number): boolean;
    protected _code(): string;
}
export declare class ModelTypeConstraintLessEqual extends ModelTypeConstraintComparison {
    constructor(val: number);
    protected _op(): string;
    protected _compare(a: number, b: number): boolean;
    protected _code(): string;
}
export declare class ModelTypeConstraintMore extends ModelTypeConstraintComparison {
    constructor(val: number);
    protected _op(): string;
    protected _compare(a: number, b: number): boolean;
    protected _code(): string;
}
export declare class ModelTypeConstraintMoreEqual extends ModelTypeConstraintComparison {
    constructor(val: number);
    protected _op(): string;
    protected _compare(a: number, b: number): boolean;
    protected _code(): string;
}
