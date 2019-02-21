
import {
  modelTypes, ModelTypeArray, ModelParseContext,
} from '../src/model';


import {
  TestClass
} from "tsunit.external/tsUnitAsync";
import { ModelTypeArraySizeConstraint, ModelTypeArrayUniqueElementsConstraint } from '../src/model.array';

export class ModelArrayTest extends TestClass {

  private model: ModelTypeArray<string>;
  private modelLengthConstraint: ModelTypeArray<string>;
  private modelUnique: ModelTypeArray<string>;
  setUp() {
    modelTypes.removeType('string[]');
    this.model = modelTypes.addArrayType(modelTypes.type('string'));
    this.modelLengthConstraint = this.model.withConstraints(
      new ModelTypeArraySizeConstraint({ minLength:2, maxLength: 4 })
    );
    this.modelUnique = this.model.withConstraints(
      new ModelTypeArrayUniqueElementsConstraint()
    );
  }


  testArrayValidates() {
    const ctx = new ModelParseContext([], this.model, true);
    ctx.currentType().validate(ctx);
    this.areIdentical(0, ctx.errors.length);
  }
  testRequiredButNullArrayDoesNotValidate() {
    const ctx = new ModelParseContext(null, this.model, true);
    ctx.currentType().validate(ctx);
    this.areIdentical(1, ctx.errors.length);
  }
  testNonRequiredNullArrayValidates() {
    const ctx = new ModelParseContext(null, this.model, false);
    ctx.currentType().validate(ctx);
    this.areIdentical(0, ctx.errors.length);
  }
  testNonRequiredNonArrayDoesNotValidate() {
    const ctx = new ModelParseContext('#bogus', this.model, false);
    ctx.currentType().validate(ctx);
    this.areIdentical(1, ctx.errors.length);
  }
  testNonRequiredShortArrayDoesNotValidate() {
    const ctx = new ModelParseContext([1], this.modelLengthConstraint, false);
    ctx.currentType().validate(ctx);
    this.areIdentical(1, ctx.errors.length);
  }
  testNonRequiredLongArrayDoesNotValidate() {
    const ctx = new ModelParseContext([1,2,3,4,5], this.modelLengthConstraint, false);
    ctx.currentType().validate(ctx);
    this.areIdentical(1, ctx.errors.length);
  }
  testNonRequiredNullArrayWithLengthConstraintsValidates() {
    const ctx = new ModelParseContext(null, this.modelLengthConstraint, false);
    ctx.currentType().validate(ctx);
    this.areIdentical(0, ctx.errors.length);
  }
  testArrayWithUniqueConstraintAndNoDuplicatesValidates() {
    const ctx = new ModelParseContext([1,2,3], this.modelUnique, false);
    ctx.currentType().validate(ctx);
    this.areIdentical(0, ctx.errors.length);
  }
  testArrayWithUniqueConstraintAndDuplicatesDoesNotValidate() {
    const ctx = new ModelParseContext([1,2,1], this.modelUnique, false);
    ctx.currentType().validate(ctx);
    this.areIdentical(1, ctx.errors.length);
  }
}
