import { IModelType, IModelTypeItem, IModelTypeConstraint, IModelTypeRegistry } from "./model.api";
import { ModelTypeNumber } from "./model.number";
import { ModelTypeString, ModelTypeConstraintPossibleValues } from "./model.string";
import { ModelTypeBool } from "./model.bool";
import { ModelTypeArray } from "./model.array";
import { ModelTypeObject } from "./model.object";
export declare class ModelSchemaParser implements IModelTypeRegistry {
    constructor();
    addSchemaObject(name: string, schemaObject: any): IModelType<any>;
    parseSchemaObject(schemaObject: any, name?: string): IModelType<any>;
    parseSchemaConstraintEnum<T>(schemaObject: any): ModelTypeConstraintPossibleValues<T>;
    parseSchemaObjectTypeString(schemaObject: any): ModelTypeString;
    parseSchemaObjectTypeNumber(schemaObject: any, ...constraints: IModelTypeConstraint<number>[]): ModelTypeNumber;
    parseSchemaObjectTypeBool(schemaObject: any): ModelTypeBool;
    parseSchemaObjectTypeObject(schemaObject: any, name?: string): ModelTypeObject<{}>;
    parseSchemaObjectTypeArray(schemaObject: any, name?: string): ModelTypeArray<any>;
    type(name: string): IModelType<any>;
    itemType(name: string): IModelTypeItem<any>;
    addType(type: IModelType<any>): void;
    getRegisteredNames(): string[];
    private _registry;
}
