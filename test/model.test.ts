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

    let exampleModel = modelTypes.addComposite('example', ()=>({}))
      .addItem('lala', modelTypes.type('int'))
      .addItem('blah', modelTypes.type('string'))
      .addItem('blub', modelTypes.type('float'));


    let context = new ModelParseContext(example);
    exampleModel.validate(context);

    this.areIdentical(0, context.warnings.length);
    this.areIdentical(0, context.errors.length);
  }
}
