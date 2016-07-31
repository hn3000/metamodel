import {
    modelTypes,
    ModelParseContext,
    ModelTypeConstraints
} from "../src/model";

import {
  TestClass
} from "@hn3000/tsunit-async";

export class ModelTest extends TestClass {
  testSimpleMetaModel() {
    let example = {
      lala: 1,
      blah: '2',
      blub: 3.14
    };

    let exampleModel = modelTypes.addObjectType('example/1', ()=>({}))
      .addItem('lala', modelTypes.type('number/int'))
      .addItem('blah', modelTypes.type('string'))
      .addItem('blub', modelTypes.type('number'));


    let context = new ModelParseContext(example, exampleModel);
    exampleModel.validate(context);

    this.areIdentical(0, context.warnings.length);
    this.areIdentical(0, context.errors.length);
  }

  testSimpleMetaModelWarnsAboutInts() {
    let example = {
      lala: 1.1,
      blah: '2',
      blub: "3.14"
    };

    let exampleModel = modelTypes.addObjectType('example/fails/1', ()=>({}))
      .addItem('lala', modelTypes.type('number/int'))
      .addItem('blah', modelTypes.type('string'))
      .addItem('blub', modelTypes.type('number/int'));


    let context = new ModelParseContext(example, exampleModel);
    exampleModel.validate(context);

    this.areIdentical(2, context.warnings.length);
    this.areIdentical('lala', context.warnings[0].path);
    this.areIdentical('blub', context.warnings[1].path);
    this.areIdentical(0, context.errors.length);
  }

  testMetaModelChecksRanges() {
    let example = {
      lala: 1.1
    };

    let exampleModel = modelTypes.addObjectType('example/fails/2', ()=>({}))
      .addItem('lala', modelTypes.itemType('number').withConstraints(ModelTypeConstraints.less(1).warnOnly()));


    let context = new ModelParseContext(example, exampleModel);
    let result:any = exampleModel.parse(context);

    this.areIdentical(1, context.warnings.length);
    this.areIdentical('lala', context.warnings[0].path);
    this.areIdentical(0, context.errors.length);
    this.areIdentical(1.1,result.lala);
  }

  testMetaModelChecksAndAdjustsRanges() {
    let example = {
      lala: 1.1
    };

    let exampleModel = modelTypes.addObjectType('example/fails/3')
      .addItem('lala', modelTypes.itemType('number').withConstraints(ModelTypeConstraints.less(1)));


    let context = new ModelParseContext(example, exampleModel);
    let result:any = exampleModel.parse(context);

    this.areIdentical(1, context.warnings.length);
    this.areIdentical('lala', context.warnings[0].path);
    this.areIdentical(0, context.errors.length);
    this.areIdentical(1,result.lala);
  }
  testMetaModelParsesStrings() {
    let example = {
      value: "1.1",
      flag: "yes",
      choice: "one"
    };

    let exampleModel = modelTypes.addObjectType('example/fails/4')
      .addItem('value', modelTypes.itemType('number').withConstraints(ModelTypeConstraints.more(1)))
      .addItem('flag', modelTypes.itemType('boolean'))
      .addItem('choice', modelTypes.itemType('string').withConstraints(ModelTypeConstraints.possibleValues(['one','two', 'three'])));


    let context = new ModelParseContext(example, exampleModel);
    let result:any = exampleModel.parse(context);

    this.areIdentical(0, context.warnings.length);
    this.areIdentical(0, context.errors.length);

    this.areIdentical(1.1,result.value);
    this.areIdentical(true,result.flag);
    this.areIdentical("one",result.choice);

  }
  testMetaModelHasLowerBound() {
    let exampleModel = modelTypes.addObjectType('example/succeeds/1', ()=>({}))
      .addItem('lala', modelTypes.itemType('number').withConstraints(ModelTypeConstraints.more(1)));
      
    this.isTrue(null != exampleModel.itemType('lala').asItemType().lowerBound(), `constraints: ${(<any>exampleModel.itemType("lala"))._constraints}`);
  }
  testMetaModelHasUpperBound() {
    let exampleModel = modelTypes.addObjectType('example/succeeds/2', ()=>({}))
      .addItem('lala', modelTypes.itemType('number').withConstraints(ModelTypeConstraints.less(1)));
      
    this.isTrue(null != exampleModel.itemType('lala').asItemType().upperBound(), `constraints: ${(<any>exampleModel.itemType("lala"))._constraints}`);
  }
  
  testPossibleValuesAllowsValue() {
    let example = {
      lala: 'one'
    };

    let exampleModel = modelTypes.addObjectType('example/succeeds/3')
      .addItem('lala', modelTypes.itemType('string').withConstraints(ModelTypeConstraints.possibleValues(['one'])));

    let context = new ModelParseContext(example, exampleModel);
    let result:any = exampleModel.parse(context);

    this.areIdentical(0, context.warnings.length);
    this.areIdentical(0, context.errors.length);
    this.areIdentical('one', result['lala']);
  }
  testPossibleValuesPreventsForbiddenValue() {
    let example = {
      lala: 'two'
    };

    let exampleModel = modelTypes.addObjectType('example/succeeds/4')
      .addItem('lala', modelTypes.itemType('string').withConstraints(ModelTypeConstraints.possibleValues(['one'])));

    let context = new ModelParseContext(example, exampleModel);
    let result:any = exampleModel.parse(context);

    this.areIdentical(0, context.warnings.length);
    this.areIdentical(1, context.errors.length);
    this.areIdentical('lala', context.errors[0].path);
    this.areIdentical(null, result['lala']);
  }

  testArrayTypeParsesArray() {
    let example = {
      numbers: [1,2,3],
      strings: ['one', 'two', 'three']
    };

    let exampleModel = modelTypes.addObjectType('example/succeeds/5')
      .addItem('numbers', modelTypes.itemType('number[]'))
      .addItem('strings', modelTypes.itemType('string[]'))
      ;

    let context = new ModelParseContext(example, exampleModel);
    let result:any = exampleModel.parse(context);

    this.areIdentical(0, context.warnings.length);
    this.areIdentical(0, context.errors.length);

    this.areNotIdentical(result.numbers, example.numbers);
    this.areNotIdentical(result.strings, example.strings);
    this.areCollectionsIdentical(result.numbers, example.numbers);
    this.areCollectionsIdentical(result.strings, example.strings);
  }
}
