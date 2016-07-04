import { IModelType, IModelParseContext } from "./model.api";
import { ModelTypeConstrainable, ModelConstraints } from "./model.base";
export declare class ModelTypeArray<T> extends ModelTypeConstrainable<T[]> {
    constructor(elementType: IModelType<T>, constraints?: ModelConstraints<T[]>);
    parse(ctx: IModelParseContext): T[];
    validate(ctx: IModelParseContext): void;
    unparse(val: T[]): any;
    create(): T[];
    protected _kind(): string;
    private _elementType;
}
