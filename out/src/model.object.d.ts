import { IModelType, IModelTypeItem, IModelTypeCompositeBuilder, IModelTypeEntry, IModelTypeComposite, IModelParseContext } from "./model.api";
import { ModelTypeConstrainable, ModelConstraints } from "./model.base";
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
    protected _kind(): string;
}
