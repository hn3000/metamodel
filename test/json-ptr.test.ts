///<reference path="../typings/globals/node/index.d.ts"  />

import * as fs from 'fs';

import {
    JsonPointer,
    JsonReference,
    
} from "../src/json-ptr";

import {
  TestClass
} from "tsunit.external/tsUnit";

export class JsonPointerTest extends TestClass {
  private json: any;
  constructor() {
    let tmp = fs.fileReadSync('./json-ptr.test.json');
    this.json = JSON.parse(tmp);
  }

  testHasJson() {
    this.isNotNull(this.json);
  }
}