import { IModelType, IModelTypeItem, IModelTypeCompositeBuilder } from "./model.api";
import { ModelParseContext } from "./model.infra";
import { ModelTypeArray } from "./model.array";
export declare class ModelTypeRegistry {
    asItemType(type: IModelType<any>): IModelTypeItem<any>;
    removeType(name: string): void;
    addType(type: IModelType<any>): IModelType<any>;
    addObjectType<C>(name: string, construct?: () => C): IModelTypeCompositeBuilder<C>;
    addArrayType<E>(type: IModelType<E>): ModelTypeArray<E>;
    type(name: string): IModelType<any>;
    itemType(name: string): IModelTypeItem<any>;
    getRegisteredNames(): string[];
    createParseContext(obj: any, type: IModelType<any>): ModelParseContext;
    private _types;
    private _itemTypes;
}
