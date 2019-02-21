
export {
  Primitive,
  Predicate,
  IModelObject,
  MessageSeverity,
  IMessageProps,
  IStatusMessage,
  IPropertyStatusMessage,
  IModelParseContext,
  IModelType,
  IModelTypeConstrainable,
  IModelTypeItem,
  IModelTypeEntry,
  IModelTypeComposite,
  IModelTypeCompositeBuilder,
  IModelTypeConstraint,
	IModelTypeConstraintFactory,
  IModelTypeRegistry,
  IClientProps
} from "./model.api";

import {
  ModelTypeRegistry
} from "./model.registry";

export {
  ModelTypeConstrainable,
  ModelTypeItem,
  ModelConstraints,
  ModelTypeConstraintOptional,
  ClientProps
} from "./model.base";

import {
  ModelTypeNumber,
  ModelTypeConstraintInteger,
  ModelTypeConstraintLess,
  ModelTypeConstraintLessEqual,
  ModelTypeConstraintMore,
  ModelTypeConstraintMoreEqual,
  ModelTypeConstraintMultipleOf
} from "./model.number";

import {
    ModelTypeString,
    ModelTypeConstraintPossibleValues,
    ModelTypeConstraintLength,
    ModelTypeConstraintRegex
} from "./model.string";

import {
    ModelTypeBool
} from "./model.bool";

import {
  ModelTypeDate
} from './model.date';

export {
  ModelParseContext,
  ObjectTraversal,
  ModelParseMessage
} from "./model.infra";

export {
  ModelTypeRegistry
} from "./model.registry";

export {
    ModelTypeNumber,
    ModelTypeConstraintInteger,
    ModelTypeConstraintLess,
    ModelTypeConstraintLessEqual,
    ModelTypeConstraintMore,
    ModelTypeConstraintMoreEqual,
    ModelTypeConstraintMultipleOf
} from "./model.number";

export {
    ModelTypeString,
    ModelTypeConstraintPossibleValues,
    ModelTypeConstraintLength,
    ModelTypeConstraintRegex
} from "./model.string";

export {
    ModelTypeBool
} from "./model.bool";

export {
  ModelTypeArray
} from "./model.array";

export {
  ModelTypeDate
} from './model.date';

export {
  ModelTypeAny,
  ModelTypeObject,
  ModelTypeConstraintConditionalValue,
  ModelTypeConstraintCompareProperties,
  ModelTypeConstraintEqualProperties
} from "./model.object";

export {
  IModelSchemaParserDefaults,
  IConstraintFactories,
  ModelSchemaParser
} from "./model.schema";


export {
  IModelViewField,
  IModelViewPage,
  IModelView,
  ValidationScope,
} from "./model.view.api";

export {
  ModelView
} from "./model.view";

export {
  JsonPointer,
  JsonReference,
  JsonReferenceProcessor
} from "@hn3000/json-ref";

export class ModelTypeConstraints {
  static less(v:number)      { return new ModelTypeConstraintLess(v); }
  static lessEqual(v:number) { return new ModelTypeConstraintLessEqual(v); }
  static more(v:number)      { return new ModelTypeConstraintMore(v); }
  static moreEqual(v:number) { return new ModelTypeConstraintMoreEqual(v); }
  static multipleOf(v:number){ return new ModelTypeConstraintMultipleOf(v); }

  static possibleValues(v:string[]) { return new ModelTypeConstraintPossibleValues(v); }
  static recommendedValues(v:string[]) { return new ModelTypeConstraintPossibleValues(v).warnOnly(); }
}

export var modelTypes = new ModelTypeRegistry();

modelTypes.addType(new ModelTypeBool());
modelTypes.addType(new ModelTypeNumber());
modelTypes.addType(modelTypes.itemType('number').withConstraints(new ModelTypeConstraintInteger()));
modelTypes.addType(new ModelTypeString());
modelTypes.addType(new ModelTypeDate());

modelTypes.addArrayType(modelTypes.type('number'));
modelTypes.addArrayType(modelTypes.type('number/int'));
modelTypes.addArrayType(modelTypes.type('string'));
modelTypes.addArrayType(modelTypes.type('boolean'));
