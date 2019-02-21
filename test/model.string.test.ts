
import {
  modelTypes, ModelTypeString, ModelParseContext, ModelConstraints, ModelTypeConstraintLength,
} from '../src/model';


import {
  TestClass
} from "tsunit.external/tsUnitAsync";
import { ModelTypeArraySizeConstraint, ModelTypeArrayUniqueElementsConstraint } from '../src/model.array';

export class ModelTypeStringTest extends TestClass {

  testNonEmptyStringIsValid() {
    let type = new ModelTypeString('string');
    
    let ctx = new ModelParseContext('#', type);
    type.validate(ctx);

    this.areIdentical(0, ctx.messages.length);
  }
  testEmptyStringIsValid() {
    let type = new ModelTypeString('string');
    
    let ctx = new ModelParseContext('', type, true);
    type.validate(ctx);

    this.areIdentical(0, ctx.messages.length);

    ctx = new ModelParseContext('', type, false);
    type.validate(ctx);

    this.areIdentical(0, ctx.messages.length);
  }

  testNullStringIsValid() {
    let type = new ModelTypeString('string', new ModelConstraints([new ModelTypeConstraintLength(1, null)]));
    
    let ctx = new ModelParseContext(null, type, false); // only required strings must not be null
    type.validate(ctx);

    this.areIdentical(0, ctx.messages.length);
  }
  testEmptyStringIsInvalid() {
    let type = new ModelTypeString('string', new ModelConstraints([new ModelTypeConstraintLength(1, null)]));
    
    let ctx = new ModelParseContext('', type, true); // required -- otherwise empty string is okay
    type.validate(ctx);

    this.areIdentical(1, ctx.messages.length);
    this.areIdentical('value-short', ctx.messages[0].code);
  }

  testNullStringIsInvalid() {
    let type = new ModelTypeString('string', new ModelConstraints([new ModelTypeConstraintLength(1, null)]));
    
    let ctx = new ModelParseContext(null, type, true); // required -- otherwise null string is okay
    type.validate(ctx);

    this.areIdentical(1, ctx.messages.length);
    this.areIdentical('required-empty', ctx.messages[0].code);
  }
}
