import {
  modelTypes,
  ModelTypeNumber,
  ModelTypeConstraintMultipleOf,
  ModelConstraints,
  ModelParseContext,
  ModelTypeConstraintInteger
} from "../src/model";

import { TestClass } from "tsunit.external/tsUnitAsync";

export class ModelTypeNumberTest extends TestClass {
  testSomeNumberIsValid() {
    let type = new ModelTypeNumber('number');
    
    let ctx = new ModelParseContext(1, type);
    type.validate(ctx);

    this.areIdentical(0, ctx.messages.length);
  }

  testStringAsNumberIsValidIfConvertible() {
    let type = new ModelTypeNumber('number');
    
    let ctx = new ModelParseContext('1', type, false, true);
    type.validate(ctx);

    this.areIdentical(0, ctx.messages.length);
  }
  testStringAsNumberIsInvalidIfNotConvertible() {
    let type = new ModelTypeNumber('number');
    
    let ctx = new ModelParseContext('1', type, false, false);
    type.validate(ctx);

    this.areIdentical(1, ctx.messages.length);
    this.areIdentical('value-invalid', ctx.messages[0].code);
  }

  testNullNumberIsValid() {
    let type = new ModelTypeNumber('number');
    
    let ctx = new ModelParseContext(null, type, false); // only required Numbers must not be null
    type.validate(ctx);

    this.areIdentical(0, ctx.messages.length);
  }
  testNullNumberIsInvalidIfRequired() {
    let type = new ModelTypeNumber('number');
    
    let ctx = new ModelParseContext(null, type, true); // only required Numbers must not be null
    type.validate(ctx);

    this.areIdentical(1, ctx.messages.length);
    this.areIdentical('required-empty', ctx.messages[0].code);
  }
  testNumberIsInteger() {
    const type = new ModelTypeNumber(
      "int",
      new ModelConstraints([new ModelTypeConstraintInteger()])
    );

    let ctx = new ModelParseContext(1, type);
    type.validate(ctx);

    this.areIdentical(0, ctx.messages.length);

    ctx = new ModelParseContext(1.1, type);
    type.validate(ctx);

    this.areIdentical(1, ctx.messages.length);
    this.areIdentical('value-adjusted', ctx.messages[0].code);
  }
}
