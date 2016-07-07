import {
  IModelType,
  IModelTypeItem,
  IModelTypeConstraint,
  IModelTypeConstraintFactory,
  IModelTypeRegistry
} from "./model.api"

import {
  ModelTypeRegistry
} from "./model.registry";

import {
  ModelConstraints,
  ModelTypeConstrainable,

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
    ModelTypeDate,
    ModelTypeConstraintBefore,
    ModelTypeConstraintAfter,
    ModelTypeConstraintOlder
} from "./model.date"

import {
    ModelTypeBool
} from "./model.bool"

import {
  ModelTypeArray
} from "./model.array"

import {
  ModelTypeObject,
  ModelTypeConstraintEqualFields,
  ModelTypeConstraintRequiredIf
} from "./model.object"


import { JsonReferenceProcessor } from "./json-ptr"

import * as fetch from "isomorphic-fetch";
import { Promise } from "es6-promise";

function shallowMerge(a:any, b:any):any {
  let result:any = {};
  let tmp:any = {};
  Object.keys(a).forEach((x) => tmp[x]=x);
  Object.keys(b).forEach((x) => tmp[x]=x);
  let keys = Object.keys(tmp);
  
  for (var k of keys) {
    result[k] = null != b[k] ? b[k] : a[k];
  }
  return result;
}

var constraintFactoryDefault = {
  less(o:any)         { return new ModelTypeConstraintLess(o.value); },
  more(o:any)         { return new ModelTypeConstraintMore(o.value); },
  lessEqual(o:any)    { return new ModelTypeConstraintLessEqual(o.value); },
  moreEqual(o:any)    { return new ModelTypeConstraintMoreEqual(o.value); },
  minAge(o:any)       { return new ModelTypeConstraintOlder(o.age); },
  fieldsEqual(o:any)  { return new ModelTypeConstraintEqualFields(o); },
  requiredIf(o:any)   { return new ModelTypeConstraintRequiredIf(o); },

  valueIf(o:any) { 
    return new ModelTypeConstraintRequiredIf({
      ifField: o.ifField, 
      ifValue: o.ifValue,
      required: o.constrainedField,
      possibleValues: o.possibleValues
    }); 
  }
};

export class ModelSchemaParser implements IModelTypeRegistry {
  constructor(constraintFactory?:IModelTypeConstraintFactory) {
    this._constraintFactory = constraintFactory || {};
    this._registry = new ModelTypeRegistry();
  }
  
  addSchemaFromURL(url:string):Promise<any> {
    this._ensureRefProcessor();
    var p = this._refProcessor.expandRef(url);

    return p.then((schema:any) => {
      return this.addSchemaObject(url, schema);
    });
  }
  
  addSchemaObject(name:string, schemaObject:any):IModelType<any> {
    var type = this.parseSchemaObject(schemaObject, name);
    
     type && this._registry.addType(type);
     
     return type;
  }
  
  parseSchemaObject(schemaObject:any, name?:string):IModelType<any> {
    var schemaType = schemaObject['type'];
    var result:ModelTypeConstrainable<any> = null;

    switch (schemaType) {
      case 'object':
        result = this.parseSchemaObjectTypeObject(schemaObject, name);
        break;
      case 'array':
        result = this.parseSchemaObjectTypeArray(schemaObject);
        break;
      case 'string':
        result = this.parseSchemaObjectTypeString(schemaObject);
        break;
      case 'number':
        result = this.parseSchemaObjectTypeNumber(schemaObject);
        break;
      case 'integer':
        result = this.parseSchemaObjectTypeNumber(schemaObject, new ModelTypeConstraintInteger());
        break;
      case 'boolean':
        result = this.parseSchemaObjectTypeBool(schemaObject);
        break;
      case 'bool':
        console.log("warning: non-standard type 'bool' found in schema");
        result = this.parseSchemaObjectTypeString(schemaObject);
        break;
      default:
        console.log(`don't know how to handle type ${schemaType} in`, schemaObject);
        break;
    }
    
    if (result != null) {
      result.propSet("schema", schemaObject);
    }

    return result;
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

    let enumConstraint = this.parseSchemaConstraintEnum<string>(schemaObject);
    if (null != enumConstraint) {
      constraints.push(enumConstraint);
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
    let enumConstraint = this.parseSchemaConstraintEnum<number>(schemaObject);
    if (null != enumConstraint) {
      constraints.push(enumConstraint);
    }

    return new ModelTypeNumber(new ModelConstraints(constraints));
  }
  
  parseSchemaObjectTypeBool(schemaObject:any) {
    return new ModelTypeBool();
  }
  
  parseSchemaObjectTypeObject(schemaObject:any, name?:string) {
    var id = name || schemaObject.id || anonymousId();
    var type = new ModelTypeObject(id);
    var required:string[] = schemaObject['required'] || [];
    var props = schemaObject['properties'];
    if (props) {
      var keys = Object.keys(props);
      for (var key of keys) {
        let isRequired = (-1 != required.indexOf(key));
        type.addItem(key, this.parseSchemaObject(props[key], key), isRequired);
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
  
  private _ensureRefProcessor() {
    if (!this._refProcessor) {
      this._refProcessor = new JsonReferenceProcessor(fetchFetcher);
    }
  }

  private _constraintFactory:IModelTypeConstraintFactory;
  private _registry:ModelTypeRegistry;
  private _refProcessor:JsonReferenceProcessor;
}

function anonymousId(prefix?:string) {
  var suffix = (Math.floor(Math.random()*10e6)+(Date.now()*10e6)).toString(36);
  return (prefix || 'anon') + suffix;
}

function fetchFetcher(url:string):Promise<string> {
  var p = fetch(url);
  
  return p.then(function (r:any) {
    if (r.status < 300) {
      var x = r.text();
      return x;
    }
    return null;
  });
}
