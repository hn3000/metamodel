/// <reference types="es6-promise" />
import { IModelType, IModelTypeItem, IModelTypeConstraint, IModelTypeConstrainable, IModelTypeConstraintFactory, IModelTypeRegistry } from "./model.api";
import { ModelConstraints } from "./model.base";
import { ModelTypeNumber } from "./model.number";
import { ModelTypeString, ModelTypeConstraintPossibleValues } from "./model.string";
import { ModelTypeBool } from "./model.bool";
import { ModelTypeArray } from "./model.array";
export interface IConstraintFactory<T> {
    [k: string]: (o: any) => IModelTypeConstraint<T>;
}
export interface IConstraintFactories {
    numbers: IConstraintFactory<number>;
    strings: IConstraintFactory<string>;
    dates: IConstraintFactory<Date>;
    booleans: IConstraintFactory<boolean>;
    objects: IConstraintFactory<any>;
    universal: IConstraintFactory<any>;
}
export interface IModelSchemaParserDefaults {
    numbers?: {
        minimum?: number;
        maximum?: number;
        minimumExclusive?: boolean;
        maximumExclusive?: boolean;
        multipleOf?: number;
    };
    strings?: {
        minLength?: number;
        maxLength?: number;
        pattern?: String | RegExp;
    };
    dates?: {
        minimum?: Date;
        maximum?: Date;
    };
    booleans?: {};
    objects?: {};
    universal?: {};
}
export declare class ModelSchemaParser implements IModelTypeRegistry {
    constructor(constraintFactory?: IModelTypeConstraintFactory, defaultValues?: IModelSchemaParserDefaults);
    addSchemaFromURL(url: string): Promise<any>;
    addSchemaObject(name: string, schemaObject: any, defaults?: IModelSchemaParserDefaults): IModelType<any>;
    parseSchemaObject(schemaObject: any, name?: string): IModelType<any>;
    parseSchemaConstraintEnum<T>(schemaObject: any): ModelTypeConstraintPossibleValues<T>;
    parseSchemaObjectTypeString(schemaObject: any): ModelTypeString;
    parseSchemaObjectTypeNumber(schemaObject: any, ...constraints: IModelTypeConstraint<number>[]): ModelTypeNumber;
    parseSchemaObjectTypeBool(schemaObject: any): ModelTypeBool;
    parseSchemaObjectTypeObject(schemaObject: any, name?: string): IModelTypeConstrainable<any>;
    parseSchemaObjectTypeArray(schemaObject: any, name?: string): ModelTypeArray<any>;
    parseSchemaObjectUntyped(schemaObject: any, name?: string): IModelTypeConstrainable<any>;
    _parseConstraints(schemaObject: any, factories: IConstraintFactory<any>[]): ModelConstraints<any>;
    type(name: string): IModelType<any>;
    itemType(name: string): IModelTypeItem<any>;
    addType(type: IModelType<any>): void;
    getRegisteredNames(): string[];
    private _ensureRefProcessor();
    private _constraintFactory;
    private _registry;
    private _refProcessor;
    private _defaults;
}
