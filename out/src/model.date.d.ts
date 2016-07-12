import { IModelParseContext, IModelTypeConstraint } from "./model.api";
import { ModelConstraints, ModelTypeConstraintOptional, ModelTypeItem } from "./model.base";
export declare class ModelTypeDate extends ModelTypeItem<Date> {
    constructor(c?: ModelConstraints<Date>);
    lowerBound(): IModelTypeConstraint<Date>;
    upperBound(): IModelTypeConstraint<Date>;
    parse(ctx: IModelParseContext): Date;
    validate(ctx: IModelParseContext): void;
    unparse(value: Date): any;
    create(): Date;
    fromString(val: string): Date;
    asString(val: Date): string;
    protected _kind(): string;
}
export declare abstract class ModelTypeConstraintDateBase<D> extends ModelTypeConstraintOptional<D> {
    constructor();
    readonly value: Date;
    protected _id(): string;
    protected _op(): string;
    protected _compare(a: Date, b: Date): boolean;
    protected _val(): Date;
    asDate(val: Date | string): Date;
    checkAndAdjustValue(val: D, ctx: IModelParseContext): D;
}
export declare abstract class ModelTypeConstraintDateFixed<D> extends ModelTypeConstraintDateBase<D> {
    constructor(val: Date | string | ModelTypeConstraintDateFixed<D>);
    _val(): Date;
    private _value;
}
export declare class ModelTypeConstraintBefore<D> extends ModelTypeConstraintDateFixed<D> {
    constructor(val: Date | string);
    protected _op(): string;
    protected _compare(a: Date, b: Date): boolean;
}
export declare class ModelTypeConstraintAfter<D> extends ModelTypeConstraintDateFixed<D> {
    constructor(val: Date | string);
    protected _op(): string;
    protected _compare(a: Date, b: Date): boolean;
}
export declare class TimeSpan {
    constructor(timespan: string);
    readonly amount: number;
    readonly unit: string;
    _unit: string;
    _amount: number;
    private static REGEX;
}
export declare class ModelTypeConstraintOlder<D> extends ModelTypeConstraintDateBase<D> {
    constructor(timespan: string);
    protected _op(): string;
    protected _compare(a: Date, b: Date): boolean;
    protected _val(): Date;
    private _timespan;
}
