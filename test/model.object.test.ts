import {
    IModelTypeComposite,
    modelTypes,
    ModelTypeConstraintConditionalValue,
    ModelTypeConstraintEqualProperties,
    ModelTypeConstraints,
    ModelTypeObject
} from "../src/model";

import {
  TestClass
} from "@hn3000/tsunit-async";

export class ModelObjectTest extends TestClass {

  private model:IModelTypeComposite<any>;
  setUp() {
    modelTypes.removeType('test');
    this.model = (
      modelTypes.addObjectType('test')
        .addItem('p', modelTypes.type('string'))
        .addItem('q', modelTypes.type('string'))
        .addItem('r', modelTypes.type('string'))
        .addItem('s', modelTypes.type('string'))
    );
  }

  testEqualPropertiesConstraint() {
    var model:ModelTypeObject<any> = this.model.slice(['p']) as ModelTypeObject<any>;
    model = model.withConstraints(new ModelTypeConstraintEqualProperties(['p','q']));

    let t = {
      p: 12,
      q: 13
    };

    let context = modelTypes.createParseContext(t, model);
    model.validate(context);

    this.areIdentical(2, context.errors.length);
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

    let context = modelTypes.createParseContext(t, model, false, false);
    let result = model.parse(context);

    this.areIdentical(1, context.errors.length);
    this.areIdentical('r', context.errors[0].property);

    context = modelTypes.createParseContext(t, modelwc, false, false);
    result = modelwc.parse(context);
    this.areIdentical(0, context.errors.length);
    this.areIdentical(undefined, result.q);
    this.areIdentical(undefined, result.r);
  }
}
