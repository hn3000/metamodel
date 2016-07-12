import { IModelParseContext, IModelTypeConstraint, IModelTypeConstrainable, Predicate, IModelTypeItem, IClientProps } from "./model.api";
export declare class ClientProps implements IClientProps {
    propExists(key: string): boolean;
    propGet(key: string): any;
    propSet(key: string, val: any): void;
    propKeys(): string[];
    private _data;
}
export declare class ModelConstraints<T> implements IModelTypeConstraint<T> {
    constructor(constraints: ModelConstraints<T> | IModelTypeConstraint<T>[]);
    readonly id: string;
    checkAndAdjustValue(val: T, ctx: IModelParseContext): T;
    add(...c: IModelTypeConstraint<T>[]): ModelConstraints<T>;
    filter(p: Predicate<IModelTypeConstraint<T>>): IModelTypeConstraint<T>[];
    slice(names: string[] | number[]): ModelConstraints<T>;
    toString(): string;
    private _constraints;
}
export declare abstract class ModelTypeConstrainable<T> extends ClientProps implements IModelTypeConstrainable<T> {
    constructor(name: string, constraints?: ModelConstraints<T>);
    readonly name: string;
    readonly kind: string;
    asItemType(): IModelTypeItem<T>;
    withConstraints(...c: IModelTypeConstraint<T>[]): this;
    findConstraints(p: (x: IModelTypeConstraint<T>) => boolean): IModelTypeConstraint<T>[];
    abstract parse(ctx: IModelParseContext): T;
    abstract validate(ctx: IModelParseContext): void;
    abstract unparse(val: T): any;
    abstract create(): T;
    protected abstract _kind(): string;
    protected _setName(name: string): void;
    protected _clone(constraints: ModelConstraints<T>): this;
    protected _checkAndAdjustValue(val: T, ctx: IModelParseContext): T;
    protected _getConstraints(): ModelConstraints<T>;
    private _name;
    private _constraints;
}
export declare abstract class ModelTypeItem<T> extends ModelTypeConstrainable<T> implements IModelTypeItem<T> {
    asItemType(): IModelTypeItem<T>;
    abstract lowerBound(): IModelTypeConstraint<T>;
    abstract upperBound(): IModelTypeConstraint<T>;
    possibleValues(): T[];
    abstract parse(ctx: IModelParseContext): T;
    abstract validate(ctx: IModelParseContext): void;
    abstract unparse(val: T): any;
    abstract fromString(val: string): T;
    abstract asString(val: T): string;
}
export declare abstract class ModelTypeConstraintOptional<T> implements IModelTypeConstraint<T> {
    constructor();
    warnOnly(): this;
    abstract checkAndAdjustValue(v: T, c: IModelParseContext): T;
    readonly isWarningOnly: boolean;
    readonly id: string;
    protected abstract _id(): string;
    private _onlyWarn;
}
