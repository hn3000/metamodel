import { ModelTest } from "./model.test";
import { ModelParsingTest } from "./model.parsing.test";

import {
  TestAsync
} from "@hn3000/tsunit-async";

export function runTests() {
  "use strict";
  let test = new TestAsync();
  test.addTestClass(new ModelTest(), "ModelTest");
  test.addTestClass(new ModelParsingTest(), "ModelParsingTest");

  let promise = test.runAsync();
  promise.then((result) => {
    //console.log(result);
    if (result.errors.length) {
      console.log('---');
      result.errors.forEach((e) => {
        let param = null != e.parameterSetNumber ? e.parameterSetNumber : '';
        console.log(`Failed: ${e.testName}.${e.funcName}${param} - ${e.message}`);
      });
      console.log('---');
      console.log(`ran unit tests, ${result.passes.length} passed, ${result.errors.length} failed`);
    } else {
      let testnames = result.passes.map((x) => `${x.testName}.${x.funcName}${x.parameterSetNumber}`).join('\n');
      console.log('---');
      console.log(testnames);
      console.log('---');
      console.log(`ran unit tests, all ${result.passes.length} tests passed`);
    }
  });
}

runTests();
