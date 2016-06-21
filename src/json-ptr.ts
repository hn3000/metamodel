
/// <reference path="../typings/index.d.ts" />

export class JsonPointer {
  constructor(ref:string) {
    this._keypath = (ref || "").split('/').map(JsonPointer.unquote);
  }

  public static unquote(s:string) {
    var result = s.replace(/~1/g, '/');
    result = result.replace(/~0/g, '~');
    return result;
  }

  public static quote(s:string) {
    var result = s.replace(/~/g, '~0');
    result = result.replace(/\//g, '~1');
    return result;
  }

  public static deref(o:any, k:string) {
    return o && o[k];
  }

  getValue(obj:any):any {
    return this._keypath.reduce(JsonPointer.deref, obj);
  }

  asString():string {
    return (['',...this._keypath]).map(JsonPointer.quote).join('/');
  }

  get keys():string[] {
    return this._keypath;
  }

  private _keypath:string[];
}

export class JsonReference {
  constructor(ref:string) {
    var filename = JsonReference.getFilename(ref);
    var pointer = (ref && ref.substring(filename.length+1)) || "";
    this._pointer = new JsonPointer(decodeURIComponent(pointer));
    this._filename = filename;
  }

  public static getFilename(ref:string) {
    var filename = "";
    if (ref != null) {
      let hashPos = ref.indexOf('#');
      if (-1 != hashPos) {
        filename = ref.substring(0, hashPos);
      } else {
        filename = ref;
      }
    }
    return filename;
  }

  get filename() {
    return this._filename;
  }
  get pointer():JsonPointer {
    return this._pointer;
  }

  private _filename:string;
  private _pointer:JsonPointer;
}

export interface Fetcher {
  (url:string): Promise<string>;
}

export class JsonReferenceExpander {
  constructor(fetch:Fetcher) {
    this._fetch = fetch;
    this._cache = {};
  }

  expandRef(url:string):Promise<any> {
    let ref = new JsonReference(url);
    var contentPromise = this._fetchWithRefs(ref.filename);

    return contentPromise.then((x) => {
      return this._expandRefs(url, ref.filename);
    });
  }

  _expandRefs(url:string, base?:string):any {
    let ref = new JsonReference(url);

    let filename = ref.filename || base;
    if (!filename) {
      throw new Error('invalid reference: no file');
    }
    if (-1 != visited.indexOf(filename)) {
      throw new Error('invalid reference: loop detected');
    }

    var jsonPromise = this._fetchContent(filename);
    visited.push(filename);
  
    return jsonPromise.then((json) =>{
      var obj = ref.getValue(json);

      var thisRef = obj["$ref"];
      if (null != thisRef) {
        return this._expandRef(thisRef, visited, ref.filename);
      }

      var result = {};
      var keys = Object.keys(json);
      for (var k of keys) {

      }
      return result;
    });
  }

  _findRefs(x:any) {
    var queue = [];
    var result = [];
    queue.push(x);
    while (0 != queue.length) {
      let thisOne = queue.shift();
      let ref = thisOne["$ref"];
      if (ref) {
        result.push(ref);
      } else {
        queue.push(Object.keys(thisOne).map((k) => thisOne[k]));
      }
    }

    return result;
  }

  _fetchContent(url:string):Promise<any> {
    if (this._cache.hasOwnProperty(url)) {
      return this._cache[url];
    }
    let result = this._fetch(url).then((x)=>JSON.parse(x));
    this._cache[url] = result;
    result.then((x) => (this._contents[url]=x, x);

    return result;
  }

  _fetchRefs(x:any, base:string) {
    var refs = this._findRefs(x);
    var files = refs.map(x => JsonReference.getFilename);
    var filesHash = files.reduce((c,f) => c[f] = f, {});
    files = Object.keys(filesHash);

    var filesPromises = files.map((x) => {
      return _contents.hasOwnProperty(x) ? _contents[x] : _fetchContent(x);
    });

    var promise = Promise.all(filesPromises);

    if (filesPromises.any(x => x["then"])) {
      return promise.then(this._fetchRefsAll.bind(this, files));
    }

    return promise;
  }

  _fetchRefsAll(files:string[], x:any[]) {
    var result:Promise<any> = [];
    for (var i=0, n=x.length; ++i) {
      result.push(this._fetchRefs(x[i], files[i]));
    }
    return Promise.all(result);
  }

  private _fetch:Fetcher;
  private _cache:{[k:string]:Promise<any>};
  private _contents:{[k:string]:any};
}
