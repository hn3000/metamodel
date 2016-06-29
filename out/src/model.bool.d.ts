import { IModelParseContext, IModelTypeConstraint } from "./model.api";
import { ModelConstraints, ModelTypeItem } from "./model.base";
export declare class ModelTypeBool extends ModelTypeItem<boolean> {
    constructor(c?: ModelConstraints<boolean>);
    lowerBound(): IModelTypeConstraint<boolean>;
    upperBound(): IModelTypeConstraint<boolean>;
    parse(ctx: IModelParseContext): boolean;
    validate(ctx: IModelParseContext): void;
    unparse(value: boolean): any;
    fromString(val: string): boolean;
    asString(val: boolean): string;
    protected _kind(): string;
    private _parseString(val);
}
