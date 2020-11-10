import {
  TestClass
} from "tsunit.external/tsUnitAsync";
import { keypath, IKeypath, _asKeyString } from '../src/keypath';
import { JsonPointer } from '@hn3000/json-ref';

export class KeypathTest extends TestClass {
  testKeypathFromString() {
    const kp: IKeypath = keypath('a.b.c');
    this.areCollectionsIdentical(['a','b','c'], kp.keys);
    this.areIdentical('a.b.c', kp.path);
    this.areIdentical('/a/b/c', kp.pointer);
  }
  testKeypathFromKeys() {
    const kp: IKeypath = keypath(['a','b','c']);
    this.areCollectionsIdentical(['a','b','c'], kp.keys);
    this.areIdentical('a.b.c', kp.path);
    this.areIdentical('/a/b/c', kp.pointer);
  }
  testKeypathFromJsonPointer() {
    const kp: IKeypath = keypath(JsonPointer.get('/a/b/c'));
    this.areCollectionsIdentical(['a','b','c'], kp.keys);
    this.areIdentical('a.b.c', kp.path);
    this.areIdentical('/a/b/c', kp.pointer);
  }
  testKeypathFromKeypath() {
    const kp: IKeypath = keypath(keypath('/a/b/c'));
    this.areCollectionsIdentical(['a','b','c'], kp.keys);
    this.areIdentical('a.b.c', kp.path);
    this.areIdentical('/a/b/c', kp.pointer);
  }
  testKeypathPathCaching() {
    const kp: IKeypath = keypath(['a','b','c']);
    this.areIdentical('a.b.c', kp.path);
    this.areIdentical('a.b.c', kp.path);
  }

  testAsKeyArrayFromString() {
    const ks = _asKeyString([]);
    this.areIdentical('', ks);
  }
}