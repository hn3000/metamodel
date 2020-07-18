import {
  createPredicateOrOfAnd,
  createSinglePredicate,
  ComparisonOp
} from "../src/model.object"

import {
  TestClass
} from "tsunit.external/tsUnitAsync";

export class ModelTypePredicatesTest extends TestClass {

  constructor() {
    super();

    const comparisonOpParams = [
      [ '<', 0, 1, true],
      [ '<', 1, 0, false],
      [ '<=', 0, 1, true],
      [ '<=', 0, 0, true],
      [ '<=', 1, 0, false],
      [ '>', 0, 1, false],
      [ '>', 1, 0, true],
      [ '>=', 0, 1, false],
      [ '>=', 0, 0, true],
      [ '>=', 1, 0, true],
    ];

    this.parameterizeUnitTest(this.testComparisonOp, comparisonOpParams);
    this.parameterizeUnitTest(this.testComparisonOpInvert, comparisonOpParams);
  }

  testComparisonOp(op: ComparisonOp, v1: any, v2: any, expected: boolean) {
    const pred = createSinglePredicate({ op, value: v2, property: 'a' });

    this.areIdentical(expected, pred({ a: v1 }), `${v1} ${op} ${v2} should be ${expected}`);
  } 

  testComparisonOpInvert(op: ComparisonOp, v1: any, v2: any, expected: boolean) {
    const pred = createSinglePredicate({ op, value: v2, property: 'a', invert: true });

    this.areIdentical(expected, !pred({ a: v1 }), `${v1} ${op} ${v2} should be ${expected}`);
  } 


  testPredicateEqualsHasTwoNames() {
    const pred1 = createSinglePredicate({ op: '=', property: 'a', value: '#'});
    const pred2 = createSinglePredicate({ op: '==', property: 'a', value: '#'});
    this.isFalse(pred1({ }));
    this.isFalse(pred2({ }));

    this.isTrue(pred1({ a: '#' }));
    this.isTrue(pred2({ a: '#' }));
  }

  testPredicateEqualsIgnoresUndefined() {
    const pred1 = createSinglePredicate({ op: '=', property: 'a', value: '#'});
    this.isFalse(pred1({ }));

    this.isTrue(pred1({ a: '#' }));
    this.isFalse(pred1({ a: 'some other value' }));
  }
  testPredicateUnEqualsIgnoresUndefined() {
    const pred1 = createSinglePredicate({ op: '!=', property: 'a', value: '#'});
    this.isFalse(pred1({ }));

    this.isFalse(pred1({ a: '#' }));
    this.isTrue(pred1({ a: 'some other value' }));
  }
  testPredicateEqualsAllowsArrayValue() {
    const pred1 = createSinglePredicate({ op: '=', property: 'a', value: ['#', '+'] });
    this.isFalse(pred1({ }), 'ignores undefined properties');

    this.isTrue(pred1({ a: '#' }), 'accepts # -- first value from array');
    this.isTrue(pred1({ a: '+' }), 'accepts + -- second value from array');
    this.isFalse(pred1({ a: 'some other value' }), 'does not accept value not in array');
  }

  testPredicateNotEqualsAllowsArrayValue() {
    const pred1 = createSinglePredicate({ op: '!=', property: 'a', value: ['#', '+'] });
    this.isFalse(pred1({ }), 'ignores undefined properties');

    this.isFalse(pred1({ a: '#' }), 'finds # -- first value from array');
    this.isFalse(pred1({ a: '+' }), 'finds + -- second value from array');
    this.isTrue(pred1({ a: 'some other value' }), 'does not find value not in array');
  }

  testPredicateTruthy() {
    const pred = createSinglePredicate({ op: '!!', property: 'a' });

    this.isTrue(pred({ a: true }), 'true is truthy');
    this.isTrue(pred({ a: 1 }), '1 is truthy');
    this.isTrue(pred({ a: 17 }), '17 is truthy');
    this.isTrue(pred({ a: -17 }), '-17 is truthy');
    this.isTrue(pred({ a: [] }), 'empty array is truthy');
    this.isTrue(pred({ a: " " }), 'non-empty string is truthy');

    this.isFalse(pred({ }), 'undefined is not truthy');
    this.isFalse(pred({ a: null }), 'null is not truthy');
    this.isFalse(pred({ a: false }), 'false is not truthy');
    this.isFalse(pred({ a: 0 }), '0 is not truthy');
    this.isFalse(pred({ a: "" }), 'empty string is not truthy');
  }

  testPredicateFalsey() {
    const pred = createSinglePredicate({ op: '!', property: 'a' });

    this.isTrue(!pred({ a: true }), 'true is truthy');
    this.isTrue(!pred({ a: 1 }), '1 is truthy');
    this.isTrue(!pred({ a: 17 }), '17 is truthy');
    this.isTrue(!pred({ a: -17 }), '-17 is truthy');
    this.isTrue(!pred({ a: [] }), 'empty array is truthy');
    this.isTrue(!pred({ a: " " }), 'non-empty string is truthy');

    this.isFalse(!pred({ }), 'undefined is not truthy');
    this.isFalse(!pred({ a: null }), 'null is not truthy');
    this.isFalse(!pred({ a: false }), 'false is not truthy');
    this.isFalse(!pred({ a: 0 }), '0 is not truthy');
    this.isFalse(!pred({ a: "" }), 'empty string is not truthy');
  }
  testUnaryPredicateInvert() {
    const pred1 = createSinglePredicate({ op: '!', property: 'a' });
    const pred2 = createSinglePredicate({ op: '!', property: 'a', invert: true });

    this.areIdentical(pred1({ a: true }), !pred2({ a: true }), 'true is truthy');
    this.areIdentical(pred1({ a: false }), !pred2({ a: false }), 'false is not truthy');
    this.areIdentical(pred1({ a: undefined }), !pred2({ a: undefined }), 'undefined is not truthy');

  }

  testPredicateOrOfAndAcceptsSingle() {
    const pred = createPredicateOrOfAnd(
        { op: '!', property: 'a' }
    );

    this.isTrue(pred({}), 'a not present');
    this.isFalse(pred({ a: 1 }), 'a present');
  }
  testPredicateOr() {
    const pred = createPredicateOrOfAnd(
      [
        [ { op: '!', property: 'a' } ],
        [ { op: '!', property: 'b' } ]
      ]
    );

    this.isTrue(pred({}), 'neither a or b are present');
    this.isTrue(pred({ a: 1 }), '!b is true');
    this.isTrue(pred({ b: 1 }), '!a is true');

    this.isFalse(pred({ a: 1, b: 1 }), 'both a and b present');
  }

  testPredicateAnd() {
    const pred = createPredicateOrOfAnd(
      [
        [ 
          { op: '!', property: 'a' },
          { op: '!', property: 'b' } 
        ]
      ]
    );

    this.isTrue(pred({}), 'neither a or b are present');
    this.isTrue(pred({a:0}), 'a is 0, b not present');
    this.isTrue(pred({b:0}), 'b is 0, a not present');
    this.isTrue(pred({a:0, b:0}), 'a and b are 0');

    this.isFalse(pred({ a: 1 }), '!b is true');
    this.isFalse(pred({ b: 1 }), '!a is true');
    this.isFalse(pred({ a: 1, b: 1 }), 'both a and b present');
  }

  testUnknownPredicateIsFalse() {
    const pred = createPredicateOrOfAnd({ op: '#not-an-operator#' } as any);
    this.isFalse(pred(undefined));
  }

  testComparisonDoesNotCareAboutType() {
    const pred = createPredicateOrOfAnd({ op: '>', property: 'a', value: 12 } as any);
    this.isFalse(pred({}));
    this.isFalse(pred({ a: 12 }));
    this.isFalse(pred({ a: '12' }));

    this.isTrue(pred({ a: 13 }));
    this.isTrue(pred({ a: '13' }));
  }
}
