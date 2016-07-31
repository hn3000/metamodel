import {
    modelTypes,
    ModelParseContext,
    ModelTypeConstraints,
    ModelSchemaParser,
    ModelTypeRegistry,
    ModelTypeObject
} from "../src/model";

import {
  TestClass
} from "@hn3000/tsunit-async";

export class ModelParsingTest extends TestClass {
  testSimpleSchema() {
    var parser = new ModelSchemaParser();
    
    parser.addSchemaObject('ExampleObject', {
      type: "object",
      properties: {
        "blah": {
          type: "string",
          pattern: /^\d+$/
        },
        "tgt3": {
          type: "string",
          minLength: 3
        },
        "tlt5": {
          type: "string",
          maxLength: 5
        },
        "tlt5d": {
          type: "string",
          maxLength: 5,
          pattern: /^\d+$/
        }
      }
    });
    
    var type = parser.type('ExampleObject');
    var ctx = new ModelParseContext({
      blah: '123a',
      tgt3: '12',
      tlt5: '123456',
      tlt5d: '12d34'
    }, type)
    type.validate(ctx);
    this.areIdentical(4, ctx.errors.length);
    this.areIdentical('value does not match /^\\d+$/:', ctx.errors[0].msg);
    this.areIdentical('length must be at least 3:', ctx.errors[1].msg);
    this.areIdentical('length must be at most 5:', ctx.errors[2].msg);
    this.areIdentical('value does not match /^\\d+$/:', ctx.errors[3].msg);
  }

  testSchemaWithValueIfConstraint() {
    var parser = new ModelSchemaParser();
    
    var type = parser.addSchemaObject('ExampleObject', {
      type: "object",
      properties: {
        "p": { type: "string", pattern: /^\d+$/ },
        "q": { type: "string", pattern: /^\d+$/ },
        "r": { type: "string", pattern: /^\d+$/ },
        "s": { type: "string", pattern: /^\d+$/ }
      },
      constraints: [
        { 
          constraint: 'valueIf', 
          condition: { property: 'p', value: '12'},
          valueProperty: 'q',
          possibleValue: '13'  
        }
      ]
    });
    
    var ctx = new ModelParseContext({
      p: '12',
      q: '14'
    }, type)
    type.validate(ctx);
    this.areIdentical(1, ctx.errors.length);
    this.areIdentical('q', ctx.errors[0].path);

    ctx = new ModelParseContext({
      p: '12',
      q: '13'
    }, type)
    type.validate(ctx);
    this.areIdentical(0, ctx.errors.length);

    ctx = new ModelParseContext({
      p: '11',
      q: '14'
    }, type)
    type.validate(ctx);
    this.areIdentical(0, ctx.errors.length);
  }
  
  testSchemaWithMinAge18YearsConstraintFails() {
    var parser = new ModelSchemaParser();
    
    var type = parser.addSchemaObject('ExampleObject', {
      type: "object",
      properties: {
        "p": { 
          type: "string", 
          pattern: /^\d{4}-\d{2}-\d{2}$/,
          constraints: [
            { 
              constraint: 'minAge', 
              age: "18y"  
            }
          ]
        }
      },
    });
    
    var ctx = new ModelParseContext({
      p: '2016-01-01'
    }, type)
    type.validate(ctx);
    this.areIdentical(1, ctx.errors.length);
    this.areIdentical('p', ctx.errors[0].path);
  }

  testSchemaWithMinAge18YearsConstraintSucceeds() {
    var parser = new ModelSchemaParser();
    
    var type = parser.addSchemaObject('ExampleObject', {
      type: "object",
      properties: {
        "p": { 
          type: "string", 
          pattern: /^\d{4}-\d{2}-\d{2}$/,
          constraints: [
            { 
              constraint: 'minAge', 
              age: "18y"  
            }
          ]
        }
      }
    });
    
    var ctx = new ModelParseContext({
      p: '1998-01-01'
    }, type)
    type.validate(ctx);
    this.areIdentical(0, ctx.errors.length);
  }
  testSchemaWithMinAge18OnObject() {
    var parser = new ModelSchemaParser();
    
    var type = parser.addSchemaObject('ExampleObject', {
      type: "object",
      properties: {
        "p": { 
          type: "string", 
          pattern: /^\d{4}-\d{2}-\d{2}$/
        }
      },
      constraints: [
        { 
          constraint: 'minAge', 
          property: 'p',
          years: "18"  
        }
      ]
    });
    
    var ctx = new ModelParseContext({
      p: '1998-01-01'
    }, type)
    type.validate(ctx);
    this.areIdentical(0, ctx.errors.length);

    ctx = new ModelParseContext({
      p: '2050-01-01'
    }, type)
    type.validate(ctx);
    this.areIdentical(1, ctx.errors.length);
    this.areIdentical('p', ctx.errors[0].path);
  }
  testSchemaWithMinAge18OnSlicedObject() {
    var parser = new ModelSchemaParser();
    
    var type = parser.addSchemaObject('ExampleObject', {
      type: "object",
      properties: {
        "p": { 
          type: "string", 
          pattern: /^\d{4}-\d{2}-\d{2}$/
        }
      },
      constraints: [
        { 
          constraint: 'minAge', 
          property: 'p',
          years: "18"  
        },
        { 
          constraint: 'minAge', 
          property: 'q',
          years: "18"  
        }
      ]
    });
    
    var slice = (type as ModelTypeObject<any>).slice(['p']);

    var ctx = new ModelParseContext({
      p: '1998-01-01'
    }, type)
    slice.validate(ctx);
    this.areIdentical(0, ctx.errors.length);

    ctx = new ModelParseContext({
      p: '2050-01-01'
    }, type)
    slice.validate(ctx);
    this.areIdentical(1, ctx.errors.length);
    this.areIdentical('p', ctx.errors[0].path);
  }
}
