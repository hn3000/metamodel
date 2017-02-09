
import * as reutil from '../src/regex-util';
import { TestClass } from '@hn3000/tsunit-async';

export class TestRegexUtil extends TestClass {
  testSimpleCharClassInversion() {
    let inverted = reutil.invertedRE("^[abc]+$");
    this.areIdentical("[^abc]", inverted);
  }
  testInvertedCharClassInversion() {
    let inverted = reutil.invertedRE("^[^abc]*$");
    this.areIdentical("[abc]", inverted);
  }
  testComplexCharClassREInversion() {
    let inverted = reutil.invertedRE(/^[^\u0000-\u001f\u007f-\u009f\{\}\[\]<>]*$/);
    this.areIdentical("[\\u0000-\\u001f\\u007f-\\u009f\\{\\}\\[\\]<>]", inverted);
  }
  testComplexCharClassStringInversion() {
    let inverted = reutil.invertedRE("^[^\\u0000-\\u001f\\u007f-\\u009f\\{\\}\\[\\]<>]*$");
    this.areIdentical("[\\u0000-\\u001f\\u007f-\\u009f\\{\\}\\[\\]<>]", inverted);
  }
}