import {
  IModelType,
  IModelTypeItem,
  IModelTypeConstraint,
  IModelTypeRegistry
} from "./model.api"

import {
  ModelTypeRegistry
} from "./model.registry";

import {
  ModelConstraints
} from "./model.base";

import {
  ObjectTraversal
} from "./model.infra";

import {
    ModelTypeNumber,
    ModelTypeConstraintLess,
    ModelTypeConstraintLessEqual,
    ModelTypeConstraintMore,
    ModelTypeConstraintMoreEqual,
    ModelTypeConstraintInteger,
    ModelTypeConstraintMultipleOf
} from "./model.number"

import {
    ModelTypeString,
    ModelTypeConstraintPossibleValues,
    ModelTypeConstraintRegex
} from "./model.string"

import {
    ModelTypeBool
} from "./model.bool"

import {
  ModelTypeArray
} from "./model.array"

import {
  ModelTypeObject
} from "./model.object"


export class ModelSchemaParser implements IModelTypeRegistry {
  constructor() {
    this._registry = new ModelTypeRegistry();
  }
  
  
  addSchemaObject(name:string, schemaObject:any):IModelType<any> {
    var type = this.parseSchemaObject(schemaObject, name);
    
     type && this._registry.addType(type);
     
     return type;
  }
  
  parseSchemaObject(schemaObject:any, name?:string):IModelType<any> {
    var schemaType = schemaObject['type'];
    switch (schemaType) {
      case 'object':
        return this.parseSchemaObjectTypeObject(schemaObject, name);
      case 'array':
        return this.parseSchemaObjectTypeArray(schemaObject);
      case 'string':
        return this.parseSchemaObjectTypeString(schemaObject);
      case 'number':
        return this.parseSchemaObjectTypeNumber(schemaObject);
      case 'integer':
        return this.parseSchemaObjectTypeNumber(schemaObject, new ModelTypeConstraintInteger());
      case 'bool':
        return this.parseSchemaObjectTypeString(schemaObject);
    }
    
    console.log(`don't know how to handle ${schemaObject}`);
    return null;
  }

  parseSchemaConstraintEnum<T>(schemaObject:any) {
    var e = schemaObject['enum'];
    if (Array.isArray(e)) {
      return new ModelTypeConstraintPossibleValues(<T[]>e);
    }
    return null;
  }
  
  parseSchemaObjectTypeString(schemaObject:any) {
    var minLen = schemaObject['minLength'];
    var maxLen = schemaObject['maxLength'];
    var pattern = schemaObject['pattern'];
    
    var constraints:IModelTypeConstraint<string>[] = [];
    if (minLen != null || maxLen != null) {
      var msg:string;
      if (minLen == null || minLen == 0) {
        msg = `length must be at most ${maxLen}:`;
      } else if (maxLen == null) {
        msg = `length must be at least ${minLen||0}:`;
      } else {
        msg = `length must be between ${minLen||0} and ${maxLen}:`;
      }
      var expr =  `^.{${minLen||0},${maxLen||''}}$`;
      
      constraints.push(new ModelTypeConstraintRegex(expr, '', msg));
    }
    if (pattern != null) {
      constraints.push(new ModelTypeConstraintRegex(pattern, ''));
    }
    return new ModelTypeString(new ModelConstraints(constraints));
  }
  
  parseSchemaObjectTypeNumber(schemaObject:any, ...constraints:IModelTypeConstraint<number>[]) {
    var min = schemaObject['minimum'];
    var max = schemaObject['maximum'];
    var minOut = schemaObject['minimumExclusive'];
    var maxOut = schemaObject['maximumExclusive'];
    var multipleOf = schemaObject['multipleOf'];
    
    if (typeof(min) === "number") {
      if (minOut) {
        constraints.push(new ModelTypeConstraintMore(min));
      } else {
        constraints.push(new ModelTypeConstraintMoreEqual(min));
      }
    }
    if (typeof(max) === "number") {
      if (maxOut) {
        constraints.push(new ModelTypeConstraintLess(max));
      } else {
        constraints.push(new ModelTypeConstraintLessEqual(max));
      }
    }
    
    if (typeof(multipleOf) === "number") {
      constraints.push(new ModelTypeConstraintMultipleOf(multipleOf));
    }
    return new ModelTypeNumber(new ModelConstraints(constraints));
  }
  
  parseSchemaObjectTypeBool(schemaObject:any) {
    return new ModelTypeBool();
  }
  
  parseSchemaObjectTypeObject(schemaObject:any, name?:string) {
    var id = name || schemaObject.id || anonymousId();
    var type = new ModelTypeObject(id);
    var props = schemaObject['properties'];
    if (props) {
      var keys = Object.keys(props);
      for (var i = 0, n = keys.length; i < n; ++i) {
        var key = keys[i];
        type.addItem(key, this.parseSchemaObject(props[key], key));
      }
    }
    
    return type;
  }
  
  parseSchemaObjectTypeArray(schemaObject:any, name?:string) {
    var elementType = this.parseSchemaObject(schemaObject.items);
    var type = new ModelTypeArray(elementType);
    
    return type;
  }
  
  type(name:string) { return this._registry.type(name); }
  itemType(name:string) { return this._registry.itemType(name); }
  addType(type:IModelType<any>) { this._registry.addType(type); }
  getRegisteredNames() { return this._registry.getRegisteredNames(); }
  
  private _registry:ModelTypeRegistry;
}

function anonymousId(prefix?:string) {
  var suffix = (Math.floor(Math.random()*10e6)+(Date.now()*10e6)).toString(36);
  return (prefix || 'anon') + suffix;
}