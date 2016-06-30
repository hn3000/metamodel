import { IModelType, IModelParseMessage, Primitive, IModelViewField, IModelView } from "./model.api";
export declare class ModelViewField implements IModelViewField {
    keypath: string[];
    pointer: string;
    accesspath: string;
    type: IModelType<any>;
    validate(val: any): IModelParseMessage[];
}
/**
 * Provides an immutable facade for a model, adding IModelType
 * based validation and support for copy-on-write mutation.
 *
 */
export declare class ModelView<T> implements IModelView<T> {
    constructor(modelType: IModelType<T>, modelData?: any);
    getModelType(): IModelType<T>;
    getModel(): T;
    withChangedField(keyPath: string | string[], newValue: Primitive | any[]): IModelView<T>;
    _updatedModel(model: any, keyPath: string[], newValue: Primitive | any[]): any;
    getFieldValue(keyPath: string | string[]): any;
    getField(keyPath: string | string[]): IModelViewField;
    private _modelType;
    private _fields;
    private _inputModel;
    private _model;
    private _visitedFlags;
}
