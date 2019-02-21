
import {
  modelTypes, ModelTypeDate, ModelParseContext,
} from '../src/model';


import {
  TestClass
} from "tsunit.external/tsUnitAsync";
import { ModelTypeArraySizeConstraint, ModelTypeArrayUniqueElementsConstraint } from '../src/model.array';

export class ModelTypeDateTest extends TestClass {
  testSomeDateIsValid() {
    let type = new ModelTypeDate('date');
    
    let ctx = new ModelParseContext(new Date(), type);
    type.validate(ctx);

    this.areIdentical(0, ctx.messages.length);
  }

  testStringAsDateIsValidIfConvertible() {
    let type = new ModelTypeDate('date');
    
    let ctx = new ModelParseContext('2019-01-31', type, false, true);
    type.validate(ctx);

    this.areIdentical(0, ctx.messages.length);
  }
  testStringAsDateIsInvalidIfNotConvertible() {
    let type = new ModelTypeDate('date');
    
    let ctx = new ModelParseContext('2019-01-31', type, false, false);
    type.validate(ctx);

    this.areIdentical(1, ctx.messages.length);
    this.areIdentical('value-invalid', ctx.messages[0].code);
  }

  testNullDateIsValid() {
    let type = new ModelTypeDate('date');
    
    let ctx = new ModelParseContext(null, type, false); // only required Dates must not be null
    type.validate(ctx);

    this.areIdentical(0, ctx.messages.length);
  }
  testNullDateIsInvalidIfRequired() {
    let type = new ModelTypeDate('date');
    
    let ctx = new ModelParseContext(null, type, true); // only required Dates must not be null
    type.validate(ctx);

    this.areIdentical(1, ctx.messages.length);
    this.areIdentical('required-empty', ctx.messages[0].code);
  }
}
