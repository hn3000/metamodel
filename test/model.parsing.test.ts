import {
    modelTypes,
    ModelParseContext,
    ModelTypeConstraints,
    ModelSchemaParser,
    ModelTypeRegistry,
    ModelTypeObject,
    ModelView
} from "../src/model";

import {
  TestClass
} from "tsunit.external/tsUnitAsync";

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

  testSimpleSchemaWithDefaults() {
    var parser = new ModelSchemaParser(undefined, {
      strings: {
        pattern: "^[aeiou]+$",
        minLength: 3,
        maxLength: 5
      },
      numbers: {
        minimum: 3,
        maximum: 7,
        multipleOf: 2
      }
    });

    parser.addSchemaObject('ExampleObject', {
      type: "object",
      properties: {
        "text": {
          type: "string"
        },
        "number": {
          type: "number"
        },
        "number2": {
          type: "number"
        }
      }
    });

    var type = parser.type('ExampleObject');

    var ctx = new ModelParseContext({
      text: 'aeiou1b',
      number: 11,
      number2: 5
    }, type, true, false); // required=true, allowConversion=false

    type.validate(ctx);
    this.areIdentical(5, ctx.errors.length);
    this.areIdentical('length must be between 3 and 5:', ctx.errors[0].msg);
    this.areIdentical('value should not match /([^aeiou])/g:', ctx.errors[1].msg);
    this.areIdentical('expected 11 <= 7.', ctx.errors[2].msg);
    this.areIdentical('expected multiple of 2 but got 11', ctx.errors[3].msg);
    this.areIdentical('expected multiple of 2 but got 5', ctx.errors[4].msg);
  }

  testSimpleSchemaWithPatternDefault() {
    var parser = new ModelSchemaParser(undefined, {
      strings: {
        pattern: /a-z/
      }
    });

    parser.addSchemaObject('ExampleObject', {
      type: "object",
      properties: {
        "text": {
          type: "string"
        }
      }
    });

    var type = parser.type('ExampleObject');

    var ctx = new ModelParseContext({
      text: 'AEI'
    }, type, true, false); // required=true, allowConversion=false

    type.validate(ctx);
    this.areIdentical(1, ctx.errors.length);
    this.areIdentical('value does not match /a-z/:', ctx.errors[0].msg);

    ctx = new ModelParseContext({
      text: 'XXa-zYY'
    }, type, true, false); // required=true, allowConversion=false

    type.validate(ctx);
    this.areIdentical(0, ctx.errors.length);
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
    this.areIdentical('q', ctx.errors[0].property);

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
  testSchemaWithValueIfAllConstraint() {
    var parser = new ModelSchemaParser();

    var type = parser.addSchemaObject('ExampleObject', {
      type: "object",
      properties: {
        "p": { type: "number" },
        "q": { type: "integer" },
        "r": { type: "string", pattern: /^\d+$/ },
        "s": { type: "string", pattern: /^\d+$/ }
      },
      constraints: [
        {
          constraint: 'valueIfAll',
          condition: [
            { property: 'p', value: '12'},
            { property: 'q', value: '12'}
          ],
          valueProperty: 'r',
          possibleValue: '13'
        }
      ]
    });

    var ctx = new ModelParseContext({
      p: '12',
      q: '12',
      r: '11'
    }, type)
    type.validate(ctx);
    this.areIdentical(1, ctx.errors.length);
    this.areIdentical('r', ctx.errors[0].property);

    ctx = new ModelParseContext({
      p: '12',
      q: '11',
      r: '11'
    }, type)
    type.validate(ctx);
    this.areIdentical(0, ctx.errors.length);

    ctx = new ModelParseContext({
      p: '12',
      q: '12',
      r: '13'
    }, type)
    type.validate(ctx);
    this.areIdentical(0, ctx.errors.length);
  }

  testSchemaWithRequiredIfAllConstraint() {
    var parser = new ModelSchemaParser();

    var type = parser.addSchemaObject('ExampleObject', {
      type: "object",
      properties: {
        "p": { type: "number" },
        "q": { type: "integer" },
        "r": { type: "string", pattern: /^\d+$/ },
        "s": { type: "string", pattern: /^\d+$/ }
      },
      constraints: [
        {
          constraint: 'requiredIfAll',
          condition: [
            { property: 'p', value: '12'},
            { property: 'q', value: '12'}
          ],
          properties: 'r'
        }
      ]
    });

    var ctx = new ModelParseContext({
      p: '12',
      q: '12',
      r: null
    }, type)
    type.validate(ctx);
    this.areIdentical(1, ctx.errors.length);
    this.areIdentical('r', ctx.errors[0].property);

    ctx = new ModelParseContext({
      p: '12',
      q: '11',
      r: undefined
    }, type)
    type.validate(ctx);
    this.areIdentical(0, ctx.errors.length);

    ctx = new ModelParseContext({
      p: '12',
      q: '12',
      r: '13'
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
    this.areIdentical('p', ctx.errors[0].property);
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
    this.areIdentical('p', ctx.errors[0].property);
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
    this.areIdentical('p', ctx.errors[0].property);
  }
  testSchemaWithArrayOfEnum() {
    var parser = new ModelSchemaParser();

    var type = parser.addSchemaObject('ExampleObject', {
      type: "object",
      properties: {
        p: {
          type: "array",
          items: {
            type: "string",
            enum: [ "a", "b", "c" ],
            uniqueItems: true
          }
        }
      }
    });

    var slice = (type as ModelTypeObject<any>).slice(['p']);

    var ctx = new ModelParseContext({
      p: [ 'a' ]
    }, type)
    slice.validate(ctx);
    this.areIdentical(0, ctx.errors.length);

    ctx = new ModelParseContext({
      p: [ 'x', 'y' ]
    }, type)
    slice.validate(ctx);
    this.areIdentical(2, ctx.errors.length);
    this.areIdentical('p.0', ctx.errors[0].property);
    this.areIdentical('p.1', ctx.errors[1].property);

    let view = new ModelView​​(slice, ctx.currentValue);
    view = view.withValidationMessages(ctx.messages);

    this.areIdentical(2, view.getFieldMessages("p").length);
  }
}
