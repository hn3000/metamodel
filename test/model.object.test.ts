import {
    IModelTypeComposite,
    modelTypes,
    ModelTypeConstraintConditionalValue,
    ModelTypeConstraintCompareProperties,
    ModelTypeConstraintEqualProperties,
    ModelTypeObject
} from "../src/model";

import {
  TestClass
} from "tsunit.external/tsUnitAsync";

export class ModelTypeObjectTest extends TestClass {

  private model:IModelTypeComposite<any>;
  private modelNested:IModelTypeComposite<any>;
  setUp() {
    modelTypes.removeType('test');
    this.model = (
      modelTypes.addObjectType('test')
        .addItem('p', modelTypes.type('string'))
        .addItem('q', modelTypes.type('string'))
        .addItem('r', modelTypes.type('string'))
        .addItem('s', modelTypes.type('string'))
    );
    modelTypes.removeType('nested');
    modelTypes.removeType('o');
    modelTypes.removeType('r');
    this.modelNested = (
      modelTypes.addObjectType('nested')
        .addItem('p', modelTypes.type('string'))
        .addItem('q', modelTypes.type('string'))
        .addItem('o', (
          modelTypes.addObjectType('o'))
          .addItem('s', modelTypes.type('string'), true)
          .addItem('n', modelTypes.type('number'), true)
        , false)
        .addItem('r', (
          modelTypes.addObjectType('r'))
          .addItem('s', modelTypes.type('string'), true)
          .addItem('n', modelTypes.type('number'), true)
        , true)
    );
  }

  testComparePropertiesConstraintEqualWithDifferentValues() {
    var model:ModelTypeObject<any> = this.model.slice(['p']) as ModelTypeObject<any>;
    model = model.withConstraints(new ModelTypeConstraintCompareProperties({properties: ['p','q'], op: '=='}));

    let t = {
      p: 12,
      q: 13
    };

    let context = modelTypes.createParseContext(t, model);
    model.validate(context);

    this.areIdentical(2, context.errors.length);
  }

  testComparePropertiesConstraintEqualWithEqualValues() {
    var model:ModelTypeObject<any> = this.model.slice(['p']) as ModelTypeObject<any>;
    model = model.withConstraints(new ModelTypeConstraintCompareProperties({properties: ['p','q'], op: '=='}));

    let t = {
      p: 12,
      q: 12
    };

    let context = modelTypes.createParseContext(t, model);
    model.validate(context);

    this.areIdentical(0, context.errors.length);
  }

  testComparePropertiesConstraintEqualWithNullishValues() {
    var model:ModelTypeObject<any> = this.model.slice(['p']) as ModelTypeObject<any>;
    model = model.withConstraints(new ModelTypeConstraintCompareProperties({
      properties: ['p', 'q'], 
      op: '=='
    }));

    let t: { [k: string]: null|undefined|string|number } = {
      p: null,
      q: undefined
    };

    let context = modelTypes.createParseContext(t, model);
    model.validate(context);

    this.areIdentical(0, context.errors.length);
    t = {
      p: null,
      q: undefined
    };

    context = modelTypes.createParseContext(t, model);
    model.validate(context);

    this.areIdentical(0, context.errors.length);
  }


  testComparePropertiesConstraintLessWithCorrectValues() {
    var model:ModelTypeObject<any> = this.model.slice(['p']) as ModelTypeObject<any>;
    model = model.withConstraints(new ModelTypeConstraintCompareProperties({properties: ['p','q'], op: '<'}));

    let t = {
      p: 12,
      q: 13
    };

    let context = modelTypes.createParseContext(t, model);
    model.validate(context);

    this.areIdentical(0, context.errors.length);
  }

  testComparePropertiesConstraintLessWithWrongValues() {
    var model:ModelTypeObject<any> = this.model.slice(['p']) as ModelTypeObject<any>;
    model = model.withConstraints(new ModelTypeConstraintCompareProperties({properties: ['p','q'], op: '<'}));

    let t = {
      p: 12,
      q: 12
    };

    let context = modelTypes.createParseContext(t, model);
    model.validate(context);

    this.areIdentical(2, context.errors.length);
    this.areIdentical('properties-wrong-order-less', context.errors[0].code);
    this.areIdentical('p', context.errors[0].property);
    this.areIdentical('properties-wrong-order-less', context.errors[1].code);
    this.areIdentical('q', context.errors[1].property);
  }

  testComparePropertiesConstraintGreaterWithWrongValues() {
    var model:ModelTypeObject<any> = this.model.slice(['p']) as ModelTypeObject<any>;
    model = model.withConstraints(new ModelTypeConstraintCompareProperties({properties: ['p','q'], op: '>'}));

    let t = {
      p: 12,
      q: 12
    };

    let context = modelTypes.createParseContext(t, model);
    model.validate(context);

    this.areIdentical(2, context.errors.length);
    this.areIdentical('properties-wrong-order-greater', context.errors[0].code);
    this.areIdentical('p', context.errors[0].property);
    this.areIdentical('properties-wrong-order-greater', context.errors[1].code);
    this.areIdentical('q', context.errors[1].property);
  }

  testComparePropertiesConstraintGreaterEqualWithWrongValues() {
    var model:ModelTypeObject<any> = this.model.slice(['p']) as ModelTypeObject<any>;
    model = model.withConstraints(new ModelTypeConstraintCompareProperties({properties: ['p','q'], op: '>='}));

    let t = {
      p: 12,
      q: 13
    };

    let context = modelTypes.createParseContext(t, model);
    model.validate(context);

    this.areIdentical(2, context.errors.length);
    this.areIdentical('properties-wrong-order-greater-equal', context.errors[0].code);
    this.areIdentical('p', context.errors[0].property);
    this.areIdentical('properties-wrong-order-greater-equal', context.errors[1].code);
    this.areIdentical('q', context.errors[1].property);
  }

  testEqualPropertiesConstraintWithDifferentValues() {
    var model:ModelTypeObject<any> = this.model.slice(['p']) as ModelTypeObject<any>;
    model = model.withConstraints(new ModelTypeConstraintEqualProperties(['p','q']));

    let t = {
      p: 12,
      q: 13
    };

    let context = modelTypes.createParseContext(t, model);
    model.validate(context);

    this.areIdentical(2, context.errors.length);
    this.areIdentical('properties-different', context.errors[0].code);
    this.areIdentical('p', context.errors[0].property);
    this.areIdentical('properties-different', context.errors[1].code);
    this.areIdentical('q', context.errors[1].property);
  }

  testEqualPropertiesConstraintWithEqualsValues() {
    var model:ModelTypeObject<any> = this.model.slice(['p']) as ModelTypeObject<any>;
    model = model.withConstraints(new ModelTypeConstraintEqualProperties(['p','q']));

    let t = {
      p: 12,
      q: 12
    };

    let context = modelTypes.createParseContext(t, model);
    model.validate(context);

    this.areIdentical(0, context.errors.length);
  }

  testConstraintConditionalValueRequiresCorrectValues() {
    var model:ModelTypeObject<any> = this.model.slice(['p']) as ModelTypeObject<any>;
    model = model.withConstraints(new ModelTypeConstraintConditionalValue({
        condition: { property: 'p', value: '12' },
        properties:  ['q','r','s'],
        clearOtherwise: false
    }));

    let t:any = {
      p: '12',
      q: '13',
      r: null
    };

    let context = modelTypes.createParseContext(t, model);
    model.validate(context);

    this.areIdentical(2, context.errors.length);
    this.areIdentical('r', context.errors[0].property);
    this.areIdentical('s', context.errors[1].property);
  }
  testConstraintConditionalValueChecksCorrectValue() {
    var model = this.model as ModelTypeObject<any>;
    model = model.withConstraints(new ModelTypeConstraintConditionalValue({
        condition: { property: 'p', value: '12' },
        properties:  'q',
        possibleValue: '13',
        clearOtherwise: false
    }));

    let t:any = {
      p: '12',
      q: '13',
      r: '14'
    };

    var context = modelTypes.createParseContext(t, model);
    model.validate(context);

    this.areIdentical(0, context.errors.length);

    t.q = '99';
    context = modelTypes.createParseContext(t, model);
    model.validate(context);

    this.areIdentical(1, context.errors.length);
    this.areIdentical('q', context.errors[0].property);
  }
  testConstraintConditionalValueAllowsOneFromArrayOfValues() {
    var model = this.model as ModelTypeObject<any>;
    model = model.withConstraints(new ModelTypeConstraintConditionalValue({
        condition: { property: 'p', value: '12' },
        properties:  'q',
        possibleValue: ['13', '15'],
        clearOtherwise: false
    }));

    let t:any = {
      p: '12',
      q: '13',
      r: '14'
    };

    var context = modelTypes.createParseContext(t, model);
    model.validate(context);

    this.areIdentical(0, context.errors.length);

    t.q = '13';
    context = modelTypes.createParseContext(t, model);
    model.validate(context);

    this.areIdentical(0, context.errors.length);

    t.q = '15';
    context = modelTypes.createParseContext(t, model);
    model.validate(context);

    this.areIdentical(0, context.errors.length);
  }
  testConstraintConditionalValueIgnoresWhenConditionFalse() {
    var model:ModelTypeObject<any> = this.model.slice(['p']) as ModelTypeObject<any>;
    model = model.withConstraints(new ModelTypeConstraintConditionalValue({
        condition: { property: 'p', value: '12' },
        properties:  ['q','r','s'],
        clearOtherwise: false
    }));

    let t:any = {
      p: '13',
      q: null,
      r: null
    };

    let context = modelTypes.createParseContext(t, model);
    model.validate(context);

    this.areIdentical(0, context.errors.length);
  }
  testConstraintConditionalValueClearsValuesWhenConditionFalse() {
    var model:IModelTypeComposite<any> = this.model;
    var modelwc = model.withConstraints(new ModelTypeConstraintConditionalValue({
        condition: { property: 'p', value: '12' },
        properties:  ['q','r','s'],
        clearOtherwise: true
    }));

    let t:any = {
      p: '13',
      q: 'ab',
      r: 17
    };

    let context = modelTypes.createParseContext(t, model, true, false);
    let result = model.parse(context);

    this.areIdentical(1, context.errors.length);
    this.areIdentical('r', context.errors[0].property);

    context = modelTypes.createParseContext(t, modelwc, false, false);
    result = modelwc.parse(context);
    this.areIdentical(0, context.errors.length);
    this.areIdentical(undefined, result.q);
    this.areIdentical(undefined, result.r);
  }

  testConstraintConditionalValueOnArrayRequiresCorrectValues() {
    var model:ModelTypeObject<any> = this.model.slice(['p']) as ModelTypeObject<any>;
    model = model.withConstraints(new ModelTypeConstraintConditionalValue({
        condition: { property: 'p', value: '12' },
        properties:  ['q','r','s'],
        clearOtherwise: false
    }));

    let t:any = {
      p: ['11','12','13'],
      q: '13',
      r: null
    };

    let context = modelTypes.createParseContext(t, model);
    model.validate(context);

    this.areIdentical(2, context.errors.length);
    this.areIdentical('r', context.errors[0].property);
    this.areIdentical('s', context.errors[1].property);
  }

  testConstraintConditionalValueArrayOnArrayRequiresCorrectValues() {
    var model:ModelTypeObject<any> = this.model.slice(['p']) as ModelTypeObject<any>;
    model = model.withConstraints(new ModelTypeConstraintConditionalValue({
        condition: { property: 'p', op: "=", value: ['6', '12', '24'] },
        properties:  ['q','r','s'],
        clearOtherwise: false
    }));

    let t:any = {
      p: ['11','12','13'],
      q: '13',
      r: null
    };

    let context = modelTypes.createParseContext(t, model);
    model.validate(context);

    this.areIdentical(2, context.errors.length);
    this.areIdentical('r', context.errors[0].property);
    this.areIdentical('s', context.errors[1].property);
  }

  testOptionalObjectWithRequiredMembersIsNotRequired() {
    const model = this.modelNested;
    const t: any = {
      p: ['11','12','13'],
      q: '13',
      o: null,
      r: { n: 1, s: '#' }
    };
    let context = modelTypes.createParseContext(t, model);
    model.validate(context);

    this.areIdentical(0, context.messages.length, "validate should not find errors");

    context = modelTypes.createParseContext(t, model);
    model.parse(context);

    console.debug(context.messages);
    this.areIdentical(0, context.messages.length, "parse should not find errors");

  }

  testTypeObjectWithReplacedItems() {
    const model = (this.modelNested as ModelTypeObject<any>).withReplacedItems(
      {
        'r.s': modelTypes.type('boolean'),
        'r.n': undefined,
        'o': modelTypes.type('number')
      }
    );

    this.areIdentical('number', model.itemType('o').name);
    this.areIdentical('object', model.itemType('r').kind);
    this.areIdentical('bool', model.itemType('r').asCompositeType().itemType('s').kind);
    this.areIdentical(undefined, model.itemType('r').asCompositeType().itemType('n'));
  }


}
