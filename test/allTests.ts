import {ModelTest} from "./model.test";

import {
  Test
} from "tsunit.external/tsUnit";


export function runTests() {
  "use strict";
  let test = new Test();
  test.addTestClass(new ModelTest());

  let result = test.run();
  //console.log(result);
  result.err
}

runTests();
