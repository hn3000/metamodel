import { IKeypath } from "./model.api";
import { JsonPointer } from "@hn3000/json-ref";
export { IKeypath } from "./model.api";

export function _asKeyArray(keyPath:string|string[]) {
  var path: string[];
  if (Array.isArray(keyPath)) {
    path = keyPath;
  } else {
    path = keyPath.split('.');
  }
  return path;
}

export function _asKeyString(keyPath:string|string[]) {
  var path: string;
  if (Array.isArray(keyPath)) {
    path = keyPath.join('.');
  } else {
    path = keyPath;
  }
  return path;
}

export function keypath(keypath: string|string[]|JsonPointer|IKeypath): IKeypath {
  if (Array.isArray(keypath) || typeof keypath === 'string' || keypath instanceof JsonPointer) {
    return new Keypath(keypath);
  } else {
    return keypath;
  }
}

class Keypath implements IKeypath {
  constructor(keypath: string|string[]|JsonPointer) {
    if (keypath instanceof JsonPointer) {
      this._pointer = keypath;
      this._keys = keypath.keys;
      this._path = undefined;
    } else {
      this._keys = _asKeyArray(keypath);
      this._path = undefined;
      this._pointer = undefined;
    }
  }

  get keys() { return this._keys; }
  get path() {
    if (undefined == this._path) {
      this._path = this._keys.join('.');
    }
    return this._path;
  }
  get pointer() {
    if (undefined === this._pointer) {
      this._pointer = new JsonPointer(this._keys);
    }
    return this._pointer.asString();
  }

  private _keys: string[] = [];
  private _path: string | undefined;
  private _pointer: JsonPointer | undefined;
}
