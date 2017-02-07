export { Primitive, Predicate, IModelObject, MessageSeverity, IMessageProps, IStatusMessage, IPropertyStatusMessage, IModelParseContext, IModelType, IModelTypeConstrainable, IModelTypeItem, IModelTypeEntry, IModelTypeComposite, IModelTypeCompositeBuilder, IModelTypeConstraint, IModelTypeConstraintFactory, IModelTypeRegistry, IClientProps } from "./model.api";
import { ModelTypeRegistry } from "./model.registry";
export { ModelTypeConstrainable, ModelTypeItem, ModelConstraints, ModelTypeConstraintOptional, ClientProps } from "./model.base";
import { ModelTypeConstraintLess, ModelTypeConstraintLessEqual, ModelTypeConstraintMore, ModelTypeConstraintMoreEqual } from "./model.number";
import { ModelTypeConstraintPossibleValues } from "./model.string";
export { ModelParseContext, ObjectTraversal } from "./model.infra";
export { ModelTypeRegistry } from "./model.registry";
export { ModelTypeNumber, ModelTypeConstraintLess, ModelTypeConstraintLessEqual, ModelTypeConstraintMore, ModelTypeConstraintMoreEqual } from "./model.number";
export { ModelTypeString, ModelTypeConstraintPossibleValues, ModelTypeConstraintLength, ModelTypeConstraintRegex } from "./model.string";
export { ModelTypeBool } from "./model.bool";
export { ModelTypeArray } from "./model.array";
export { ModelTypeObject, ModelTypeConstraintConditionalValue, ModelTypeConstraintCompareProperties, ModelTypeConstraintEqualProperties } from "./model.object";
export { IModelSchemaParserDefaults, IConstraintFactories, ModelSchemaParser } from "./model.schema";
export { IModelViewField, IModelViewPage, IModelView, ValidationScope, ModelView } from "./model.view";
export { JsonPointer, JsonReference, JsonReferenceProcessor } from "@hn3000/json-ref";
export declare class ModelTypeConstraints {
    static less(v: number): ModelTypeConstraintLess;
    static lessEqual(v: number): ModelTypeConstraintLessEqual;
    static more(v: number): ModelTypeConstraintMore;
    static moreEqual(v: number): ModelTypeConstraintMoreEqual;
    static possibleValues(v: string[]): ModelTypeConstraintPossibleValues<string>;
    static recommendedValues(v: string[]): ModelTypeConstraintPossibleValues<string>;
}
export declare var modelTypes: ModelTypeRegistry;
