import {
  IModelType,
  IModelTypeItem,
  IModelTypeConstraint,
  IModelTypeConstrainable,
  IModelTypeConstraintFactory,
  IModelTypeRegistry,
  IModelTypeComposite,
  IModelTypeCompositeBuilder
} from "./model.api"

import {
  ModelTypeRegistry
} from "./model.registry";

import {
  ModelConstraints,
  ModelTypeConstrainable,

} from "./model.base";

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
    ModelTypeConstraintLength,
    ModelTypeConstraintRegex,
    ModelTypeConstraintInvalidRegex
} from "./model.string"

import {
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
  ModelTypeAny,
  ModelTypeObject,
  ModelTypeConstraintCompareProperties,
  ModelTypeConstraintEqualProperties,
  ModelTypeConstraintConditionalValue,
  ModelTypePropertyConstraint
} from "./model.object"


import { invertedRE } from './regex-util';

import { JsonReferenceProcessor } from "@hn3000/json-ref"

import * as fetch from "isomorphic-fetch";

export interface IConstraintFactory<T> {
  [k:string]: (o:any) => IModelTypeConstraint<T>;
}

export interface IConstraintFactories {
  numbers:   IConstraintFactory<number>;
  strings:   IConstraintFactory<string>;
  dates:     IConstraintFactory<Date>;
  booleans:  IConstraintFactory<boolean>;
  objects:   IConstraintFactory<any>;
  universal: IConstraintFactory<any>;
}

export interface IModelSchemaParserDefaults {
  numbers?:   {
    minimum?: number;
    maximum?: number;
    minimumExclusive?: boolean;
    maximumExclusive?: boolean;
    multipleOf?: number;
  };
  strings?:   {
    minLength?: number;
    maxLength?: number;
    pattern?: String | RegExp;
  };
  dates?:     {
    minimum?: Date;
    maximum?: Date;
  }
  booleans?:  {

  };
  objects?:   {

  };
  universal?: {

  };
}

function parseAge(o:any) {
  let result = o.age ? o.age : o.years ? o.years+'y' : '0y';
  return result;
}

var constraintFactoriesDefault:IConstraintFactories = {
  numbers: {
    /* unnecessary: available via minimum / maximum
    less(o:any)        { return new ModelTypeConstraintLess(o.value); },
    more(o:any)        { return new ModelTypeConstraintMore(o.value); },
    lessEqual(o:any)   { return new ModelTypeConstraintLessEqual(o.value); },
    moreEqual(o:any)   { return new ModelTypeConstraintMoreEqual(o.value); }
    */
  },
  strings: {
    minAge(o:any)      { return new ModelTypeConstraintOlder<string>(parseAge(o)); },
    before(o:any)      { return new ModelTypeConstraintBefore<string>(o.date); },
    after(o:any)       { return new ModelTypeConstraintAfter<string>(o.date); }
  },
  dates: {
    minAge(o:any)      { return new ModelTypeConstraintOlder<Date>(o.age); },
    before(o:any)      { return new ModelTypeConstraintBefore<Date>(o.date); },
    after(o:any)       { return new ModelTypeConstraintAfter<Date>(o.date); }
  },
  booleans: { },
  objects: {
    minAge(o:any) {
      return new ModelTypePropertyConstraint(o.property, new ModelTypeConstraintOlder<string>(parseAge(o)));
    },
    before(o:any) {
      return new ModelTypePropertyConstraint(o.property, new ModelTypeConstraintBefore<string>(o.date));
    },
    after(o:any) {
      return new ModelTypePropertyConstraint(o.property, new ModelTypeConstraintAfter<string>(o.date));
    },
    equalProperties(o:any) { return new ModelTypeConstraintEqualProperties(o); },
    compareProperties(o:any) { return new ModelTypeConstraintCompareProperties(o); },
    requiredIf(o:any) {
      return new ModelTypeConstraintConditionalValue({
        condition: o.condition,
        clearOtherwise: o.clearOtherwise,
        properties: o.properties
      });
    },
    requiredIfAll(o:any) {
      return new ModelTypeConstraintConditionalValue({
        condition: o.condition||o.conditions,
        clearOtherwise: o.clearOtherwise,
        properties: o.properties
      });
    },
    valueIf(o:any) {
      return new ModelTypeConstraintConditionalValue({
        condition: o.condition,
        clearOtherwise: false,
        properties: o.valueProperty,
        possibleValue: o.possibleValue
      });
    },
    valueIfAll(o:any) {
      return new ModelTypeConstraintConditionalValue({
        condition: o.condition||o.conditions,
        clearOtherwise: false,
        properties: o.valueProperty,
        possibleValue: o.possibleValue
      });
    }
  },
  universal: {
    possibleValue(o:any)   { return new ModelTypeConstraintPossibleValues(o); },
    possibleValues(o:any)  { return new ModelTypeConstraintPossibleValues(o); },
  }
};

const flavorProps = [
  'flavor',
  'flavour',
  'x-Flavour',
  'x-Flavor',
  'x-flavour',
  'x-flavor',
];


export class ModelSchemaParser implements IModelTypeRegistry {
  constructor(constraintFactory?:IModelTypeConstraintFactory, defaultValues?: IModelSchemaParserDefaults) {
    this._constraintFactory = constraintFactory || {};
    this._registry = new ModelTypeRegistry();
    this._defaults = defaultValues ?? {};
  }

  addSchemaFromURL(url:string):Promise<any> {
    this._ensureRefProcessor();
    var p = this._refProcessor.expandRef(url);

    return p.then((schema:any) => {
      return this.addSchemaObject(url, schema);
    });
  }

  /**
   * Parses a schema object and adds the resulting model type to the internal
   * registry.
   *
   * @param name of the type
   * @param schemaObject schema definition / description of the type
   * @param defaults can be used to override defaults
   */
  addSchemaObject(name:string, schemaObject:any, defaults?: IModelSchemaParserDefaults):IModelType<any> {
    const nameOrId = name || schemaObject.id;
    var type = this.parseSchemaObject(schemaObject, nameOrId);
//console.log(`parsed type for name ${name}: ${type.name} / ${type.kind}`);
     type && this._registry.addType(type);

     return type;
  }

  parseSchemaObject(schemaObject:any, nameOrId?:string):IModelType<any> {
    var schemaType = schemaObject['type'];
    var result:IModelTypeConstrainable<any> = null;

    switch (schemaType) {
      case 'object':
        result = this.parseSchemaObjectTypeObject(schemaObject, nameOrId);
        break;
      case 'array':
        result = this.parseSchemaObjectTypeArray(schemaObject, nameOrId);
        break;
      case 'string':
        result = this.parseSchemaObjectTypeString(schemaObject, nameOrId);
        break;
      case 'number':
        result = this.parseSchemaObjectTypeNumber(schemaObject, nameOrId);
        break;
      case 'integer':
        result = this.parseSchemaObjectTypeNumber(schemaObject, nameOrId, new ModelTypeConstraintInteger());
        break;
      case 'boolean':
        result = this.parseSchemaObjectTypeBoolean(schemaObject, nameOrId);
        break;
      case 'bool':
        console.log("warning: non-standard type 'bool' found in schema");
        result = this.parseSchemaObjectTypeBoolean(schemaObject, nameOrId);
        break;
      default:
        result = this.parseSchemaObjectUntyped(schemaObject, nameOrId);
        //console.log(`don't know how to handle type ${schemaType} in`, schemaObject);
        break;
    }

    if (result != null) {
      const flavours = flavorProps.filter(x => x in schemaObject);
      if (flavours.length) {
        if (flavours.length > 1) {
          const flavoursArr = flavours.reduce((r,x) => (r.push(`${x}=${schemaObject[x]}`), r), []);
          console.debug(`found multiple flavours (${flavoursArr.join(';')}), using ${flavours[0]}`);
        }
        const flavour = schemaObject[flavours[0]];
        result.propSet('flavor', flavour);
        result.propSet('flavour', flavour);
      }
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

  parseSchemaObjectTypeString(schemaObject:any, name?: string) {

    const sources = [schemaObject, this._defaults.strings];
    const minLen = findFirst<number>(sources, 'minLength');
    const maxLen = findFirst<number>(sources, 'maxLength');
    const pattern = findFirst<string|RegExp>(sources, 'pattern');
    //const format = findFirst<string>(sources, 'format');

    var constraints = this._parseConstraints(schemaObject, [ constraintFactoriesDefault.strings, constraintFactoriesDefault.universal ]);
    if (minLen != undefined || maxLen != undefined) {
      constraints = constraints.add(new ModelTypeConstraintLength(minLen, maxLen));
    }
    if (pattern != undefined) {
      let ire = invertedRE(pattern);
      if (ire) {
        constraints = constraints.add(new ModelTypeConstraintInvalidRegex(`(${ire})`));
      } else {
        constraints = constraints.add(new ModelTypeConstraintRegex(pattern, ''));
      }
    }

    let enumConstraint = this.parseSchemaConstraintEnum<string>(schemaObject);
    if (null != enumConstraint) {
      constraints = constraints.add(enumConstraint);
    }

    return new ModelTypeString(name, constraints);
  }

  parseSchemaObjectTypeNumber(schemaObject:any, name?: string, ...constraints:IModelTypeConstraint<number>[]) {
    const sources = [schemaObject, this._defaults.numbers];
    const min = findFirst<number>(sources, 'minimum');
    const max = findFirst<number>(sources, 'maximum');
    const minOut = findFirst<number>(sources, 'minimumExclusive');
    const maxOut = findFirst<number>(sources, 'maximumExclusive');
    const multipleOf = findFirst<number>(sources, 'multipleOf');

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

    return new ModelTypeNumber(name, new ModelConstraints(constraints));
  }

  parseSchemaObjectTypeBoolean(schemaObject:any, name?: string) {
    let constraints:ModelConstraints<boolean> = null;
    let enumConstraint = this.parseSchemaConstraintEnum<boolean>(schemaObject);
    if (null != enumConstraint) {
      constraints = new ModelConstraints([enumConstraint]);
    }

    return new ModelTypeBool(name, constraints);
  }

  parseSchemaObjectTypeObject(schemaObject:any, name?:string): IModelTypeConstrainable<any> {
    let id = name || schemaObject.id || anonymousId();
    let constraints = this._parseConstraints(schemaObject, [constraintFactoriesDefault.objects,constraintFactoriesDefault.universal]);
    let type:IModelTypeCompositeBuilder<any>;
    let props = schemaObject['properties'];
    let keys = props && Object.keys(props);

    let dependencies = schemaObject['dependencies'];
    if (null != dependencies) {
      let deps = Object.keys(dependencies);
      for (let d of deps) {
        if (Array.isArray(dependencies[d])) {
          let dependentProperties = dependencies[d] as string[];
          constraints = constraints.add(new ModelTypeConstraintConditionalValue({
            condition: {
              property: d as string,
              invert: true,
              value: null as string
            },
            properties: dependentProperties,
            clearOtherwise: false
          }));
        }
      }
    }

    type = new ModelTypeObject(id, null, constraints);

    let required:string[] = schemaObject['required'] || [];
    if (props) {
      for (var key of keys) {
        let isRequired = (-1 != required.indexOf(key));
        type.addItem(key, this.parseSchemaObject(props[key], key), isRequired);
      }
    }

    let allOf = schemaObject['allOf'];
    if (allOf && Array.isArray(allOf)) {
      var index = 0;
      for (var inner of allOf) {
        let innerType = this.parseSchemaObjectTypeObject(inner, `${name}/allOf[${index}]`);
        if ((innerType as IModelTypeComposite<any>).items) {
          type = type.extend(innerType as IModelTypeComposite<any>);
        }
        ++index;
      }
    }

    required.forEach((req) => {
      const entry = type.findItem(req);
      if (null != entry) {
        entry.required = true;
      } else {
        type.addItem(req, new ModelTypeAny(req), true);
      }
    });

    if (0 == type.items.length) {
      return new ModelTypeAny(id, null, constraints);
    }

    return type;
  }

  parseSchemaObjectTypeArray(schemaObject:any, name?:string) {
    var elementType:IModelType<any> = null;
    if (Array.isArray(schemaObject.items)) {
      console.log('metamodel unhandled schema construct: array items property is array');
    } else if (null != schemaObject.items) {
      elementType = this.parseSchemaObject(schemaObject.items);
    }

    if (null == elementType) {
      console.warn('metamodel found untyped array');
      elementType = new ModelTypeAny("any");
    }
    var type = new ModelTypeArray(elementType, name);

    return type;
  }

  parseSchemaObjectUntyped(schemaObject:any, name?:string):IModelTypeConstrainable<any> {
    if (schemaObject.properties || schemaObject.allOf) {
      return this.parseSchemaObjectTypeObject(schemaObject, name);
    }
    if (null != schemaObject.type) {
      console.log(`no implementation for schema type ${schemaObject.type} (${name}) in ${JSON.stringify(schemaObject)}`);
    }
    return new ModelTypeAny(name);
  }

  _parseConstraints(
    schemaObject:any,
    factories:IConstraintFactory<any>[]
  ):ModelConstraints<any> {
    var constraints = schemaObject.constraints as any[];
    if (constraints && Array.isArray(constraints)) {
      var cc = constraints.map((c:any) => {
        var factory:(o:any) => IModelTypeConstraint<any>;
        factory = this._constraintFactory[c.constraint];
        if (!factory) {
          factory = findFirst(factories, c.constraint);
        }
        if (!factory) {
          console.log("unrecognized constraint", c.constraint, c);
        }
        return factory && factory(c);
      }).filter((x) => x != null);
      return new ModelConstraints<any>(cc);
    }
    return new ModelConstraints<any>([]);
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
  private _defaults:IModelSchemaParserDefaults;
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

function findFirst<T=unknown>(tt:{[k:string]:T}[], name:string):T|undefined {
  for (var t of tt) {
    if (t && t[name]) return t[name];
  }
  return undefined;
}
