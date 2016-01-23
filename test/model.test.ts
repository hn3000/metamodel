import {
    modelTypes,
    ModelParseContext
} from "../src/model";

import {
  TestClass
} from "tsunit.external/tsUnit";

export class ModelTest extends TestClass {
  testSimpleMetaModel() {
    let example = {
      lala: 1,
      blah: '2',
      blub: 3.14
    };

    let exampleModel = modelTypes.addObjectType('example', ()=>({}))
      .addItem('lala', modelTypes.type('number/int'))
      .addItem('blah', modelTypes.type('string'))
      .addItem('blub', modelTypes.type('number'));


    let context = new ModelParseContext(example);
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

    let exampleModel = modelTypes.addObjectType('example/fails', ()=>({}))
      .addItem('lala', modelTypes.type('number/int'))
      .addItem('blah', modelTypes.type('string'))
      .addItem('blub', modelTypes.type('number/int'));


    let context = new ModelParseContext(example);
    exampleModel.validate(context);

    this.areIdentical(2, context.warnings.length);
    this.areIdentical('lala', context.warnings[0].path);
    this.areIdentical('blub', context.warnings[1].path);
    this.areIdentical(0, context.errors.length);
  }
}
