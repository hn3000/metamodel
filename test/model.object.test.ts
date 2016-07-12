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
     this.model = modelTypes.addObjectType('test')
      .addItem('p', modelTypes.type('string'))
      .addItem('q', modelTypes.type('string'))
      .addItem('r', modelTypes.type('string'))
      .addItem('s', modelTypes.type('string'));
  }

  testEqualPropertiesConstraint() {
    var model:ModelTypeObject<any> = this.model.slice(['p']) as ModelTypeObject<any>;
    model = model.withConstraints(new ModelTypeConstraintEqualProperties(['p','q']));

    let t = {
      p: 12,
      q: 13
    };

    let context = modelTypes.createParseContext(t);
    model.validate(context);

    this.areIdentical(2, context.errors.length);
  }
  testConstraintConditionalValueRequiresValues() {
    var model:ModelTypeObject<any> = this.model.slice(['p']) as ModelTypeObject<any>;
    model = model.withConstraints(new ModelTypeConstraintConditionalValue({
        condition: { property: 'p', value: '12' },
        properties:  ['q','r','s']
    }));

    let t:any = {
      p: '12',
      q: '13',
      r: null
    };

    let context = modelTypes.createParseContext(t);
    model.validate(context);

    this.areIdentical(2, context.errors.length);
    this.areIdentical('r', context.errors[0].path);
    this.areIdentical('s', context.errors[1].path);
  }
  testConstraintConditionalValueRequiresCorrectValues() {
    var model = this.model as ModelTypeObject<any>;
    model = model.withConstraints(new ModelTypeConstraintConditionalValue({
        condition: { property: 'p', value: '12' },
        properties:  ['q','r','s'],
        possibleValue: ['13']
    }));

    let t:any = {
      p: '12',
      q: '13',
      r: '14'
    };

    let context = modelTypes.createParseContext(t);
    model.validate(context);

    this.areIdentical(2, context.errors.length);
    this.areIdentical('r', context.errors[0].path);
    this.areIdentical('s', context.errors[1].path);
  }
  testConstraintConditionalValueRequiresCorrectValue() {
    var model = this.model as ModelTypeObject<any>;
    model = model.withConstraints(new ModelTypeConstraintConditionalValue({
        condition: { property: 'p', value: '12' },
        properties:  'q',
        possibleValue: '13'
    }));

    let t:any = {
      p: '12',
      q: '13',
      r: '14'
    };

    var context = modelTypes.createParseContext(t);
    model.validate(context);

    this.areIdentical(0, context.errors.length);

    t.q = '99';
    context = modelTypes.createParseContext(t);
    model.validate(context);

    this.areIdentical(1, context.errors.length);
    this.areIdentical('q', context.errors[0].path);
  }
  testConstraintConditionalValueIgnoresWhenConditionFalse() {
    var model:ModelTypeObject<any> = this.model.slice(['p']) as ModelTypeObject<any>;
    model = model.withConstraints(new ModelTypeConstraintConditionalValue({
        condition: { property: 'p', value: '12' },
        properties:  ['q','r','s']
    }));

    let t:any = {
      p: '13',
      q: null,
      r: null
    };

    let context = modelTypes.createParseContext(t);
    model.validate(context);

    this.areIdentical(0, context.errors.length);
  }
}
