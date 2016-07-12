import {
    modelTypes,
    ModelParseContext,
    ModelTypeConstraints,
    ModelSchemaParser,
    ModelTypeRegistry
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
    })
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
    })
    type.validate(ctx);
    this.areIdentical(1, ctx.errors.length);
    this.areIdentical('q', ctx.errors[0].path);

    ctx = new ModelParseContext({
      p: '12',
      q: '13'
    })
    type.validate(ctx);
    this.areIdentical(0, ctx.errors.length);

    ctx = new ModelParseContext({
      p: '11',
      q: '14'
    })
    type.validate(ctx);
    this.areIdentical(0, ctx.errors.length);
  }
  
}
