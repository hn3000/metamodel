
/* /// <reference path="../typings/index.d.ts" /> */

import { Promise } from "es6-promise";

export class JsonPointer {
  constructor(ref:string) {
    this._keypath = (ref || "").split('/').slice(1).map(JsonPointer.unquote);
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
    return '/'+(this._keypath.map(JsonPointer.quote).join('/'));
  }

  toString():string {
    return this.asString();
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

  public toString():string {
    return this._filename+'#'+this._pointer;
  }

  private _filename:string;
  private _pointer:JsonPointer;
}

export interface Fetcher {
  (url:string, base?:string): Promise<string>;
}

export class JsonReferenceProcessor {
  constructor(fetch:Fetcher) {
    this._fetch = fetch;
    this._cache = {};
    this._contents = {};
  }

  fetchRef(url:string):Promise<any> {
    let ref = new JsonReference(url);
    var contentPromise = this._fetchContent(ref.filename);
    return contentPromise
      .then((x)=>{
        //console.log("fetching refs for ", x, ref.filename);
        return this._fetchRefs(x,ref.filename).then(()=>x);
      });
  }

  expandRef(url:string):Promise<any> {
    return this.fetchRef(url)
      .then((x:any) => {
        // at this point all referenced files should be in _cache
        //console.log("expanding refs for ", x, ref.filename);
        return this._expandRefs(url);
      });
  }

  _expandRefs(url:string, base?:string):any {
    let ref = new JsonReference(url);

    let filename = this._adjustUrl(ref.filename, base);
    if (!filename) {
      throw new Error('invalid reference: no file');
    }
    if (!this._contents.hasOwnProperty(filename)) {
      throw new Error(`file not found: ${filename}`);
    }

    let json = this._contents[filename];
    let obj = ref.pointer.getValue(json);

    if (null != obj && typeof obj === 'object') {
      return this._expandDynamic(obj, filename, base,[]);
    }

    if (null == obj) {
      return { 
        "$ref": ref.toString(), 
        "$filenotfound": json == null, 
        "$refnotfound": obj == null  
      };
    }

    return obj;
  }

  _expandDynamic(obj:any, filename:string, base?:string, keypath?:string[]) {
    var url = this._adjustUrl(filename, base);
    if (obj && obj.hasOwnProperty && obj.hasOwnProperty("$ref")) {
      return this._expandRefs(obj["$ref"], url);
    } else {
      if (!obj) {
        var error:Error = null;
        try { throw new Error("here is a stacktrace"); }
        catch (xx) {
          error = xx;
        }
        console.log("expanding undefined? ", obj, filename, base, keypath, error.stack);
      }
    }

    var result = obj; 
    if (typeof obj === 'object' && Array.isArray(obj)) {
      result = (<any[]>obj).map((x)=>this._expandDynamic(x, url, null, [...keypath]));
    } else if (typeof obj === 'object') {
      result = {};
      var keys = Object.keys(obj);
      for (var k of keys) {
        //console.log("define property", k, result);
        Object.defineProperty(
          result,
          k,
          {
            enumerable: true, 
            get: ((obj:any,k:string)=>this._expandDynamic(obj[k], url,null,[...keypath,k])).bind(this,obj,k)
          }
        );
      }
    }
    return result;

  }

  _findRefs(x:any) {
    var queue:any[] = [];
    var result:string[] = [];
    //console.log('findRefs',x);
    queue.push(x);
    while (0 != queue.length) {
      let thisOne = queue.shift();
      //console.log('findRefs',thisOne);
      let ref = thisOne["$ref"];
      if (null != ref) {
        result.push(ref);
      } else if (typeof thisOne === 'object') {
        var keys = Object.keys(thisOne);
        var objs = keys.map((k) => thisOne[k]);
        queue.push(...objs);
      }
    }

    //console.log('findRefs done',x, result);

    return result;
  }

  _fetchContent(urlArg:string, base?:string):Promise<any> {
    var url = this._adjustUrl(urlArg, base);
    if (this._cache.hasOwnProperty(url)) {
      return this._cache[url];
    }
    let result = this._fetch(url).then((x)=>{
      return JSON.parse(x)
    });
    this._cache[url] = result;
    result.then((x) => (this._contents[url]=x, x));

    return result;
  }

  _adjustUrl(url:string, base?:string) {
    return this._urlAdjuster(base)(url);
  }

  private _adjusterCache:{ [base:string]:(x:string)=>string} = {};

  _urlAdjuster(base:string):(x:string)=>string {
    if (null != base) {
      let hashPos = base.indexOf('#');
      var theBase = (hashPos === -1) ? base : base.substring(0, hashPos);

      if (null != this._adjusterCache[theBase]) {
        return this._adjusterCache[theBase];
      }

      let slashPos = base.lastIndexOf('/');
      if (-1 != slashPos) {
        let prefix = base.substring(0, slashPos+1);
        let result = (x:string) => {
          if (null == x || x === "") {
            return theBase;
          }
          if ('/' === x.substring(0,1)) {
            return x;
          }
          return prefix + x;
        };
        this._adjusterCache[theBase] = result;

        return result;
      }
    }
    return (x) => x;
  }

  _fetchRefs(x:any, base:string):Promise<any[]> {
    var adjuster = this._urlAdjuster(base);
    var refs = this._findRefs(x);
    //console.log("found refs ", refs);

    var files = refs.map(x => adjuster(JsonReference.getFilename(x)));
    var filesHash:any = files.reduce((c:any,f:string) => { c[f] = f; return c; }, {});
    files = Object.keys(filesHash);
    //console.log("found files ", refs, files, " fetching ...");

    var needThen = false;
    var filesPromises = files.map((x) => {
      if (this._contents.hasOwnProperty(x)) {
        return this._contents[x];
      } else {
        needThen = true;
        return this._fetchContent(x);
      }
    });

    //console.log("got promises ", filesPromises);

    var promise = Promise.all(filesPromises);

    if (needThen) {
      return promise.then(this._fetchRefsAll.bind(this, files));
    }

    return promise;
  }

  _fetchRefsAll(files:string[], x:any[]) {
    var result:Promise<any>[] = [];
    for (var i=0, n=x.length; i<n; ++i) {
      result.push(this._fetchRefs(x[i], files[i]));
    }
    return Promise.all(result);
  }

  private _fetch:Fetcher;
  private _cache:{[k:string]:Promise<any>};
  private _contents:{[k:string]:any};
}
