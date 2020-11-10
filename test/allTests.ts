import { KeypathTest } from "./keypath.test";
import { ModelTest } from "./model.test";
import { ModelParsingTest } from "./model.parsing.test";
import { ModelTypeObjectTest } from "./model.object.test";
import { ModelTypePredicatesTest } from "./model.predicates.test";
import { ModelTypeArrayTest } from "./model.array.test";
import { ModelTypeNumberTest } from "./model.number.test";
import { ModelTypeStringTest } from "./model.string.test";
import { ModelTypeDateTest } from "./model.date.test";
import { ModelViewTest } from './model.view.test'
import { TestRegexUtil } from "./regex-util.test"


import {
  TestAsync,
  TestDescription
} from "tsunit.external/tsUnitAsync";

function parmNum(t:TestDescription) {
  return (null != t.parameterSetNumber) ? `[${t.parameterSetNumber}]` : '';
}

export function runTests() {
  "use strict";
  let test = new TestAsync();
  test.addTestClass(new KeypathTest(), "KeypathTest");
  test.addTestClass(new ModelTest(), "ModelTest");
  test.addTestClass(new ModelTypeObjectTest(), "ModelTypeObjectTest");
  test.addTestClass(new ModelTypePredicatesTest(), "ModelTypePredicatesTest");
  test.addTestClass(new ModelTypeArrayTest(), "ModelTypeArrayTest");
  test.addTestClass(new ModelTypeNumberTest(), "ModelTypeNumberTest");
  test.addTestClass(new ModelTypeStringTest(), "ModelTypeStringTest");
  test.addTestClass(new ModelTypeDateTest(), "ModelTypeDateTest");
  test.addTestClass(new ModelParsingTest(), "ModelParsingTest");
  test.addTestClass(new ModelViewTest(), "ModelViewTest");
  test.addTestClass(new TestRegexUtil(), "TestRegexUtil");

  let promise = test.runAsync();
  promise.then((result) => {
    //console.log(result);
    if (result.errors.length) {
      console.log('---');
      result.errors.forEach((e) => {
        console.log(`Failed: ${e.testName}.${e.funcName}${parmNum(e)} - ${e.message}`);
      });
      console.log('---');
      console.log(`ran unit tests, ${result.passes.length} passed, ${result.errors.length} failed`);
    } else {
      let testnames = result.passes.map((x) => `${x.testName}.${x.funcName}${parmNum(x)}`).join('\n');
      console.log('---');
      console.log(testnames);
      console.log('---');
      console.log(`ran unit tests, all ${result.passes.length} tests passed`);
    }
  });
}

runTests();
