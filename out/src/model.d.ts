export { Predicate, IModelObject, IModelParseMessage, IModelParseContext, IModelType, IModelTypeConstrainable, IModelTypeItem, IModelTypeEntry, IModelTypeComposite, IModelTypeCompositeBuilder, IModelTypeConstraint, IModelTypeRegistry } from "./model.api";
import { ModelTypeRegistry } from "./model.registry";
export { ModelTypeConstrainable, ModelTypeItem, ModelConstraints, ModelTypeConstraintOptional } from "./model.base";
import { ModelTypeConstraintLess, ModelTypeConstraintLessEqual, ModelTypeConstraintMore, ModelTypeConstraintMoreEqual } from "./model.number";
import { ModelTypeConstraintPossibleValues } from "./model.string";
export { ModelParseContext, ObjectTraversal } from "./model.infra";
export { ModelTypeRegistry } from "./model.registry";
export { ModelTypeNumber, ModelTypeConstraintLess, ModelTypeConstraintLessEqual, ModelTypeConstraintMore, ModelTypeConstraintMoreEqual } from "./model.number";
export { ModelTypeString, ModelTypeConstraintPossibleValues } from "./model.string";
export { ModelTypeBool } from "./model.bool";
export { ModelTypeArray } from "./model.array";
export { ModelTypeObject } from "./model.object";
export { ModelSchemaParser } from "./model.parsing";
export { IValidationMessage, Primitive, IModelViewField, IModelView, ModelView } from "./model.view";
export { JsonPointer, JsonReference, JsonReferenceProcessor } from "./json-ptr";
export declare class ModelTypeConstraints {
    static less(v: number): ModelTypeConstraintLess;
    static lessEqual(v: number): ModelTypeConstraintLessEqual;
    static more(v: number): ModelTypeConstraintMore;
    static moreEqual(v: number): ModelTypeConstraintMoreEqual;
    static possibleValues(v: string[]): ModelTypeConstraintPossibleValues<string>;
    static recommendedValues(v: string[]): ModelTypeConstraintPossibleValues<string>;
}
export declare var modelTypes: ModelTypeRegistry;
