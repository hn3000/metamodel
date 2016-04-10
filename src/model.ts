import {
  Predicate,
  IModelObject,
  IModelParseMessage,
  IModelParseContext,
  IModelType,
  IModelTypeConstrainable,
  IModelTypeItem,
  IModelTypeEntry,
  IModelTypeComposite,
  IModelTypeCompositeBuilder,
  IModelTypeConstraint
} from "./model.api"

import {
  ModelParseContext
} from "./model.infra"

import {
  ModelTypeRegistry
} from "./model.registry"

import {
  ModelTypeConstrainable,
  ModelTypeItem,
  ModelConstraints,
  ModelTypeConstraintOptional
} from "./model.base"

import {
  ModelTypeNumber,
  ModelTypeConstraintInteger,
  ModelTypeConstraintLess,
  ModelTypeConstraintLessEqual,
  ModelTypeConstraintMore,
  ModelTypeConstraintMoreEqual
} from "./model.number"

import {
    ModelTypeString,
    ModelTypeConstraintPossibleValues
} from "./model.string"

import {
    ModelTypeBool
} from "./model.bool"

export {
  ModelParseContext
} from "./model.infra"

export {
    ModelTypeNumber,
    ModelTypeConstraintLess,
    ModelTypeConstraintLessEqual,
    ModelTypeConstraintMore,
    ModelTypeConstraintMoreEqual
} from "./model.number"

export {
    ModelTypeString,
    ModelTypeConstraintPossibleValues
} from "./model.string"

export {
    ModelTypeBool
} from "./model.bool"

export {
  ModelTypeArray
} from "./model.array"

export {
  ModelTypeObject
} from "./model.object"

export class ModelTypeConstraints {
  static less(v:number)      { return new ModelTypeConstraintLess(v); }
  static lessEqual(v:number) { return new ModelTypeConstraintLessEqual(v); }
  static more(v:number)      { return new ModelTypeConstraintMore(v); }
  static moreEqual(v:number) { return new ModelTypeConstraintMoreEqual(v); }
  static possibleValues(v:string[]) { return new ModelTypeConstraintPossibleValues(v); }
  static recommendedValues(v:string[]) { return new ModelTypeConstraintPossibleValues(v).warnOnly(); }
}

export var modelTypes = new ModelTypeRegistry();

modelTypes.addType(new ModelTypeBool());
modelTypes.addType(new ModelTypeNumber());
modelTypes.addType(modelTypes.itemType('number').withConstraints(new ModelTypeConstraintInteger()));
modelTypes.addType(new ModelTypeString());

modelTypes.addArrayType(modelTypes.type('number'));
modelTypes.addArrayType(modelTypes.type('number'));
modelTypes.addArrayType(modelTypes.type('string'));
modelTypes.addArrayType(modelTypes.type('boolean'));
