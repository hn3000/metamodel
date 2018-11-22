
import {
  IModelType,
  IModelTypeComposite,
  IStatusMessage,
  IPropertyStatusMessage,
  MessageSeverity,
  Predicate,
  Primitive
} from "./model.api";

import {
  ModelParseContext
} from "./model.infra";

import {
  IModelView,
  IModelViewField,
  IModelViewPage,
  ValidationScope
} from "./model.view.api";
import { modelTypes } from "./model";
import { ModelTypeAny, createPredicateOrOfAnd, IConditionOptions } from "./model.object";

// constant, to make sure empty array is always the same instance
// should be unmodifiable, to be sure
const ARRAY_EMPTY: any[] = [];

export class ModelViewField implements IModelViewField {
  constructor(key:string, type:IModelType<any>) {
    this._keyString = key;
    this._keyPath = key.split('.');
    this._type = type;
  }

  get keypath():string[] {   // ["a","b","c"]
    return this._keyPath;
  }
  get key():string {           // "a.b.c"
    return this._keyString;
  }
  get pointer():string {     // "/a/b/c"
    return '/'+this._keyPath.join('/');
  }

  get type():IModelType<any> {
    return this._type;
  }

  validate(val:any):IPropertyStatusMessage[] {
    let ctx = new ModelParseContext(val, this._type);
    this._type.validate(ctx);
    return [...ctx.errors,...ctx.warnings];
  }

  private _keyString: string;
  private _keyPath:   string[];
  private _type: IModelType<any>;
}

export class ModelViewPage implements IModelViewPage {
  constructor(
    alias:string,
    index: number,
    pageType:IModelTypeComposite<any>,
    pages: IModelViewPage[]=[],
    extraInfo?: any,
    skipCondition?: IConditionOptions|IConditionOptions[]
  ) {
    this._alias = alias;
    this._index = index;
    this._type = pageType;
    this._pages = pages;
    this._extraInfo = extraInfo;
    this._skipPredicate = skipCondition != null ? createPredicateOrOfAnd(skipCondition) : null;
  }

  get alias(): string {
    return this._alias;
  }
  get index(): number {
    return this._index;
  }
  get type():IModelTypeComposite<any> {
    return this._type;
  }
  get fields():string[] {
    return this._type.items.map((x) => x.key);
  }

  get pages(): IModelViewPage[] {
    return this._pages;
  }
  get extraInfo(): string {
    return this._extraInfo;
  }

  get skipPredicate(): Predicate<any> {
    return this._skipPredicate;
  }

  private _alias: string;
  private _index: number;
  private _type: IModelTypeComposite<any>;
  private _pages: IModelViewPage[];
  private _extraInfo: any;
  private _skipPredicate: Predicate<any>;
}

function createPageObjects<T>(
  options: {
    type: IModelTypeComposite<T>;
    pageArray: any[]|undefined;
    parentAlias?: string;
  }
): ModelViewPage[] {

  let { type, pageArray, parentAlias } = options;

  if (null == pageArray || 0 == pageArray.length) {
    return [];
  }

  return pageArray.map((thisPage:any, index:number) => {
    var properties:string[] = null;

    if (null != thisPage.schema) {
      properties = Object.keys(thisPage.schema.properties);
    }
    if (null == properties) {
      properties = thisPage.properties || thisPage.fields;
    }
    if (null == properties) {
      properties = ARRAY_EMPTY;
    }

    let alias = makeAlias({
      alias: thisPage.alias,
      fieldNames: properties,
      parentAlias,
      index
    });

    let model = type.slice(properties);
    let pagesHost = (null != thisPage.schema) ? thisPage.schema : thisPage;
    if (pagesHost != thisPage && ("pages" in thisPage || "sections" in thisPage)) {
      console.log(`ignoring ${"pages" in thisPage ? "pages" : "sections"} in page "${alias}"; expected them in it's schema`);
    }
    let pages = createPageObjects({
      type,
      pageArray: pagesHost.sections || pagesHost.pages,
      parentAlias: alias
    });

    const conditionFields = ['x-skipIfAny', 'x-skipIf', 'skipIfAny', 'skipIf'];
    const actualConditions = conditionFields.reduce((r,x) => (x in thisPage) ? r.concat(x): r, []);
    let skipCondition = null;
    if (actualConditions.length > 0) {
      if (actualConditions.length > 1) {
        console.warn(`multiple skip conditions specified on page ${alias} : ${actualConditions.join(',')}, using ${actualConditions[0]} only`);
      }
      skipCondition = thisPage[actualConditions[0]];
    }

    return new ModelViewPage(alias, index, model, pages, thisPage.extraInfo, skipCondition);
  });
}

export class ModelViewMeta<T> {

  constructor(type:IModelTypeComposite<T>) {
    this._modelType = type;

    let schema = type.propGet('schema');
    if (schema && schema.pages) {
      let pages = createPageObjects({ pageArray: schema.pages, type });
      this._pages = pages;
    } else {
      this._pages = [ new ModelViewPage('default', 0, type) ];
    }
    //TODO: construct fields (we haven't needed them, yet)
  }

  getPages():ModelViewPage[] {
    return this._pages;
  }

  getModelType():IModelTypeComposite<T> {
    return this._modelType;
  }

  getFields():IModelViewField[] {
    let fields = this._fields;
    let keys = Object.keys(fields);
    return keys.map((k) => fields[k]);
  }

  getField(keyPath:string|string[]):IModelViewField {
    let key = (typeof keyPath === 'string') ? keyPath : keyPath.join('.');
    return this._fields[key];
  }

  _updatedModel(model:any, keyPath:string[], newValue:Primitive|any[]) {
    return this._updatedModelWithType(model, keyPath, newValue, this._modelType);
  }

  _updatedModelWithType(model:any, keyPath:string[], newValue:Primitive|any[], type:IModelType<any>) {
    var keys = Object.keys(model);
    var result:any = (null != type && type.create) ? type.create() : {};

    var name = keyPath[0];
    var value:any;
    const compType = (type as IModelTypeComposite<any>);
    let entryType = type && compType.itemType && compType.itemType(name);

    if (keyPath.length == 1) {
      value = newValue;

      if (null != entryType) {
        let parseCtx = new ModelParseContext(newValue, entryType);
        let modelValue = entryType.parse(parseCtx);
        if (0 == parseCtx.errors.length) {
          value = modelValue;
        }
      }
    } else {
      let entry = model[name];
      if (null == entry) {
        // use model to create missing entry
        entry = (null != entryType) ? entryType.create() : {};
      }
      value = this._updatedModelWithType(entry, keyPath.slice(1), newValue, entryType);
    }
    for (var k of keys) {
      result[k] = (k == name) ? value : (model as any)[k];
    }
    if (!result.hasOwnProperty(name)) {
      result[name] = value;
    }
    return result;
  }


  private _modelType:IModelTypeComposite<T>;
  private _fields:{[keypath:string]:ModelViewField};
  private _pages:ModelViewPage[];
}

/**
 * Provides an immutable facade for a model, adding IModelType
 * based validation and support for copy-on-write mutation.
 *
 */
export class ModelView<T> implements IModelView<T> {
  constructor(modelTypeOrSelf:IModelTypeComposite<T> | ModelView<T>, modelData?:any, initialPage:number=0) {
    if (modelTypeOrSelf instanceof ModelView) {
      let that = <ModelView<T>>modelTypeOrSelf;
      this._viewMeta = that._viewMeta;
      this._model = modelData || that._model;
      this._visitedFields = shallowCopy(that._visitedFields);
      this._readonlyFields = shallowCopy(that._readonlyFields);
      this._currentPage = that._currentPage;
      this._focusedPage = that._focusedPage;
      this._focusedSubPages = that._focusedSubPages;
      this._validationScope = that._validationScope;
      this._statusMessages = that._statusMessages;
      this._messages = that._messages;
      this._messagesByField = that._messagesByField;
    } else {
      this._viewMeta = new ModelViewMeta(modelTypeOrSelf);
      this._model = modelData || {};
      this._visitedFields = {};
      for (var k of Object.keys(this._model)) {
        this._visitedFields[k] = (null != (<any>this._model)[k]);
      }
      this._readonlyFields = {};
      this._currentPage = initialPage;
      this._validations = {};
      this._statusMessages = [];
      this._messages = [];
      this._messagesByField = {};
    }
    this._inputModel = this._model;
    this._validations = {};
  }

  getModelType():IModelType<T> {
    return this._viewMeta.getModelType();
  }
  getField(keyPath:string|string[]):IModelViewField {
    return this._viewMeta.getField(keyPath);
  }
  getFields():IModelViewField[] {
    return this._viewMeta.getFields();
  }
  getModel():T {
    // TODO: create a read-only view of underlying data?
    return this._model;
  }

  withValidationMessages(messages:IPropertyStatusMessage[]):ModelView<T> {
    if (0 === messages.length && 0 === this._messages.length) {
      // avoid bogus changes
      return this;
    }

    let result = new ModelView(this, this._inputModel);
    let byField: { [keypath:string]:IPropertyStatusMessage[]; } = {};

    let newMessages = messages.slice();
    let statusMessages:IStatusMessage[] = [];
    for (var m of messages) {
      if (null == m.property || '' === m.property) {
        statusMessages.push(m);
      } else {
        let mp = m.property;
        do {
          if (!byField[mp]) {
            byField[mp] = [ m ];
          } else {
            byField[mp].push(m);
          }
          let dotPos = mp.lastIndexOf('.');
          mp = mp.substring(0, dotPos);
        } while (mp !== '');
      }
    }
    result._messages = newMessages;
    result._messagesByField = byField
    result._statusMessages = statusMessages;

    return result;
  }

  withStatusMessages(messages:IStatusMessage[]):ModelView<T> {
    if (0 === messages.length && 0 === this._statusMessages.length) {
      return this;
    }
    let result = new ModelView(this, this._inputModel);
    result._statusMessages = messages.slice();
    return result;
  }

  withClearedVisitedFlags(): IModelView<any> {
    const visited = Object.keys(this._visitedFields);
    if (0 == visited.length || visited.every(x => !this._visitedFields[x])) {
      return this;
    }

    let result = new ModelView(this, this._inputModel);
    result._visitedFields = {};
    return result;
  }
  withAddedVisitedFlags(fields:string[]): IModelView<any> {
    if (!fields || 0 === fields.length) {
      return this;
    }

    let result = new ModelView(this, this._inputModel);
    for (let f of fields) {
      this._visitedFields[f] = true;
    }
    return result;
  }

  validationScope() {
    return this._validationScope;
  }

  validateDefault():Promise<IModelView<T>> {
    switch (this._validationScope) {
      case ValidationScope.VISITED:
      default:
        return this.validateVisited();

      case ValidationScope.PAGE:
        return this.validatePage();
      case ValidationScope.FULL:
        return this.validateFull();
    }
  }

  validateVisited():Promise<IModelView<T>> {
    let fields = Object.keys(this._visitedFields);
    let modelSlice = this._viewMeta.getModelType().slice(fields);
    return this._validateSlice(modelSlice, ValidationScope.VISITED);
  }

  validatePage():Promise<IModelView<T>> {
    const page = this.getPage();
    let modelSlice: IModelTypeComposite<any>;
    if (null != page) {
      modelSlice = page.type;
    } else if (this.currentPageIndex == 0) {
      modelSlice = this._viewMeta.getModelType().slice([]);
    } else {
      modelSlice = this._viewMeta.getModelType();
    }
    return this._validateSlice(modelSlice, ValidationScope.PAGE);
  }

  validateFull():Promise<IModelView<T>> {
    let modelSlice = this._viewMeta.getModelType();
    if (null != this.getFocusedPage()) {
      let focusedPage = this.getFocusedPage();
      modelSlice = modelSlice.slice(focusedPage.fields);
    }
    return this._validateSlice(modelSlice, ValidationScope.FULL);
  }

  private _validateSlice(modelSlice:IModelTypeComposite<T>, kind:ValidationScope):Promise<IModelView<T>> {
    if (!this._validations[kind]) {
      this._validations[kind] = Promise.resolve(null).then(
        () => {
          let ctx = new ModelParseContext(this._inputModel, modelSlice);
          modelSlice.validate(ctx);

          let messages = [ ...ctx.errors, ...ctx.warnings];
          var result = this.withValidationMessages(messages);
          result._validationScope = kind;
          return result;
        }
      );
    }
    return this._validations[kind];
  }

  withFieldEditableFlag(keypath:string|string[], flag:boolean) {
    var flags: {[keypath:string]:boolean};
    flags = shallowCopy(this._readonlyFields);

    for (let k of Object.keys(flags)) {
      flags[k] = !flags[k];
    }

    var key = this._asKeyString(keypath);
    flags[key] = flag;
    return this.withFieldEditableFlags(flags);
  }
  withFieldEditableFlags(flags:{[keypath:string]:boolean}) {
    let result = new ModelView<T>(this);

    for (let k of Object.keys(flags)) {
      result._readonlyFields[k] = !flags[k];
    }
    return result;
  }
  isFieldEditable(keypath:string|string[]):boolean {
    let k = this._asKeyString(keypath);
    return !this._readonlyFields.hasOwnProperty(k) || !this._readonlyFields[k];
  }

  withChangedField(keyPath:string|string[], newValue:Primitive|any[]):IModelView<T> {
    var path: string[];
    var keyString:string;
    if (Array.isArray(keyPath)) {
      path = keyPath;
      keyString = keyPath.join('.');
    } else {
      path = keyPath.split('.');
      keyString = keyPath;
    }

    if (newValue === this.getFieldValue(path)) {
      return this;
    }

    var newModel = this._viewMeta._updatedModel(this._inputModel, path, newValue) as T;
    let result = new ModelView<T>(this, newModel);

    result._visitedFields[keyString] = true;

    return result;
  }

  withAddedData(obj:any):IModelView<T> {
    var result:IModelView<T> = this;
    for (var k of Object.keys(obj)) {
      result = result.withChangedField(k, obj[k]);
    }
    return result;
  }

  _asKeyArray(keyPath:string|string[]) {
    var path: string[];
    if (Array.isArray(keyPath)) {
      path = keyPath;
    } else {
      path = keyPath.split('.');
    }
    return path;
  }

  _asKeyString(keyPath:string|string[]) {
    var path: string;
    if (Array.isArray(keyPath)) {
      path = keyPath.join('.');
    } else {
      path = keyPath;
    }
    return path;
  }

  getFieldValue(keyPath:string|string[]):any {
    let path = this._asKeyArray(keyPath);
    return path.reduce((o:any,k:string):any => (o && o[k]), this._inputModel);
  }

  getPossibleFieldValues(keyPath:string|string[]):any[] {
    let path = this._asKeyArray(keyPath);
    let last = path.splice(path.length-1, 1)[0];

    let type = this.getFieldType(path) as IModelTypeComposite<any>;
    let fieldType = type && type.itemType(last).asItemType();
    if (null == fieldType) {
      return null; // no known restrictions
    }

    let value = this.getFieldValue(path);
    if (type.possibleValuesForContextData) {
      return  type.possibleValuesForContextData(last, value);
    }
    return fieldType.possibleValues();
  }

  getFieldType(keyPath:string|string[]):IModelType<any> {
    let path = this._asKeyArray(keyPath);
    return path.reduce((o:IModelTypeComposite<any>,k:string):any => (o && o.itemType && o.itemType(k)), this._viewMeta.getModelType());
  }

  getFieldMessages(keyPath:string|string[]):IPropertyStatusMessage[] {
    let path = this._asKeyString(keyPath);
    return this._messagesByField[path] || ARRAY_EMPTY;
  }

  getValidationMessages(): IPropertyStatusMessage[] {
    return this._messages.slice();
  }

  isFieldValid(keyPath:string|string[]):boolean {
    let m = this._messagesByField[this._asKeyString(keyPath)];
    return null == m || 0 == m.length;
  }

  withFocusedPage(page: string|number|IModelViewPage): IModelView<any> {
    let thePage: IModelViewPage;
    if (typeof page == 'string' || typeof page == 'number') {
      thePage = this.getPage(page);
    } else if (!Array.isArray(page) && this._isPage(page)) {
      thePage = page;
    } else {
      console.warn('invalid page to be focused', page);
      thePage = null;
    }
    if (thePage == this._focusedPage) {
      return this;
    }
    let result = new ModelView(this);
    result._focusedPage = thePage;
    const hasPages = (thePage && thePage.pages.length > 0);
    if (!hasPages) {
      console.warn('page to be focused has no pages or sections, will use whole page', page);
    }
    result._focusedSubPages = hasPages ? thePage.pages : [ thePage ];
    result._currentPage = 0;
    return result;
  }

  withAllPages() {
    return this.withFocusedPage(null);
  }

  getFocusedPage() {
    return this._focusedPage;
  }

  getFocusedPageNo() {
    if (null != this._focusedPage) {
      return this._focusedPage.index + 1;
    }

    return undefined;
  }

  _isPage(page: IModelViewPage) {
    let pages = [ ... this.getPages() ];
    while (pages.length) {
      let p = pages.shift();
      if (p === page) {
        return true;
      }
      if (p.pages) {
        pages.push(...p.pages);
      }
    }
    return false;
  }

  getPages() {
    if (null != this._focusedPage) {
      return this._focusedSubPages;
    }
    return this._viewMeta.getPages();
  }

  getAllPages() {
    return this._viewMeta.getPages();
  }

  getPage(aliasOrIndex?:string|number):IModelViewPage {
    let page:IModelViewPage = null;
    let index = null;

    if (null == aliasOrIndex) {
      index = this.currentPageIndex;
    } else if (typeof aliasOrIndex == 'string') {
      let parsed = Number.parseInt(aliasOrIndex);
      if (''+parsed == aliasOrIndex) {
        index = parsed;
      } else {
        index = aliasOrIndex;
      }
    } else {
      index = +aliasOrIndex;
    }

    if (null == page) {
      if (typeof index === 'string') {
        let pages = [ ... this.getPages() ];
        while (pages.length) {
          let p = pages.shift();
          if (p.alias === aliasOrIndex) {
            page = p;
            break;
          }
          if (p.pages) {
            pages.push(...p.pages);
          }
        }
      } else {
        page = this.getPages()[index as number];
      }
    }

    return page;
  }

  getPageIndex(alias: string) {
    const thePage = this.getPage(alias);
    const index = this.getPages().indexOf(thePage);
    return index;
  }
  getPageByUnskippedPageNo(no: number): IModelViewPage {
    let pages = this.getPages();
    let count = no+1;
    let page = undefined;
    for (let i = 0, n = pages.length; i <= n; ++i) {
      page = pages[i];
      if (!this.shouldSkip(page)) {
        --count;
        if (count == 0) break;
      }
    }
    return page;
  }

  _getNextUnskippedPage(step: number): [IModelViewPage, number] {
    let nextPage = this._currentPage + step;

    if (nextPage < 0 || nextPage > this.getPages().length) {
      return [ undefined, undefined ];
    }

    let thePage = this.getPage(nextPage);
    while (this.shouldSkip(thePage)) {
      nextPage += step > 0 ? 1 : -1;
      thePage = this.getPage(nextPage);
    }
    return [ thePage, nextPage ];
  }
  getNextUnskippedPage(step: 1 | -1): IModelViewPage {
    let [ nextPage ] = this._getNextUnskippedPage(step);

    return nextPage;
  }

  getPageMessages(aliasOrIndex?:string|number):IStatusMessage[] {
    let result:IStatusMessage[] = [];
    const page = this.getPage(aliasOrIndex);
    const fields = page && page.fields || [];
    fields.forEach((x) => result.push(...this.getFieldMessages(x)));
    result.push(...this._statusMessages);
    return result;
  }

  isPageValid(aliasOrIndex?:string|number) {
    let page = this.getPage(aliasOrIndex);
    if (null == page) {
      let actualIndex = null == aliasOrIndex ? this.currentPageIndex : aliasOrIndex;
      if (actualIndex == -1 || actualIndex == this.getPages().length) {
        // pages before first and after last are always valid
        return true;
      }
    }
    return null != page && this.areFieldsValid(page.fields) && !this.hasStatusError();
  }
  areVisitedPagesValid() {
    return this.areFieldsValid(this._visitedPageFields())  && !this.hasStatusError();
  }
  arePagesUpToCurrentValid() {
    var pages = this.getPages().slice(0, this._currentPage);
    var fields = pages.reduce((r,p) => (r.concat(...p.fields)), []);
    return this.areFieldsValid(fields) && !this.hasStatusError();
  }
  isVisitedValid() {
    return this.areFieldsValid(Object.keys(this._visitedFields))  && !this.hasStatusError();
  }
  isValid() {
    const hasFieldMessage = this._messages.some(isNonSuccess);
    const hasStatusMessage = this._statusMessages.some(isNonSuccess);
    return !hasFieldMessage && !hasStatusMessage;
  }

  areFieldsValid(fields:string[]) {
    return fields.every((x) => this.isFieldValid(x));
  }
  isFieldVisited(field: string | string[]):boolean {
    let fieldPath = this._asKeyString(field);
    return null != this._visitedFields[fieldPath];
  }
  isPageVisited(aliasOrIndex: string | number):boolean {
    let page = this.getPage(aliasOrIndex) || { fields: [] as string[] };
    let visited = page.fields.some(f => this.isFieldVisited(f));
    return visited;
  }

  hasStatusError() {
    return this._statusMessages.some((x) => (x.severity == MessageSeverity.ERROR));
  }

  getStatusMessages(): IStatusMessage[] {
    return this._statusMessages;
  }

  get currentPageAlias(): string {
    const pageCount = this.getPages().length;
    if (this.currentPageIndex === pageCount) {
      return 'conclusion';
    }
    const thePage = this.getPage();
    return null != thePage ? thePage.alias : null;
  }

  get currentPageIndex():number {
    return this._currentPage;
  }

  get currentPageNo():number {
    return this._currentPage+1;
  }
  get totalPageCount():number {
    return this.getPages().length;
  }

  _countSkippedPages(upto:number) {
    let skippedPages = 0;
    for (let i = upto; i > 0; --i) {
      let page = this.getPage(i-1);
      if (this.shouldSkip(page)) {
        skippedPages += 1;
      }
    }
    return skippedPages;
  }
  _countUnskippedPages(upto:number) {
    let skippedPages = this._countSkippedPages(upto);
    return upto - skippedPages;
  }
  get currentUnskippedPageNo():number {
    return this._countUnskippedPages(this.currentPageNo);
  }

  get totalUnskippedPageCount():number {
    return this._countUnskippedPages(this.totalPageCount);
  }
  isFinished():boolean {
    return this._currentPage > this.getPages().length;
  }

  changePage(step:number):IModelView<T> {
    let [ nextPage, nextPageIndex ] = this._getNextUnskippedPage(step);

    if (undefined === nextPage) {
      return this;
    }

    return this.gotoPage(nextPageIndex, ValidationScope.VISITED);
  }

  gotoPage(indexOrAlias:number|string, validationScope:ValidationScope=ValidationScope.VISITED):IModelView<T> {
    let result = new ModelView(this, this._inputModel);
    let index : number;
    if ('string' === typeof indexOrAlias) {
      index = this.getPageIndex(indexOrAlias);
      if (-1 === index) {
        console.warn(`page not found in pages: ${this.currentPageAlias}`);
      }
    } else {
      index = indexOrAlias;
    }
    result._currentPage = index;
    result._validationScope = validationScope;
    return result;
  }

  shouldSkip(page: IModelViewPage) {
    if (null != page && null != page.skipPredicate) {
      return page.skipPredicate(this._inputModel);
    }
    return false;
  }

  private _visitedPageFields() {
    var pages = this.getPages();
    var vpages = pages.filter(x => x.fields.some(f => this._visitedFields[f]));
    var vpagefields = vpages.reduce((r: string[],p) => r.concat(p.fields), []);

    return vpagefields;
  }

  private _viewMeta:ModelViewMeta<T>;
  private _inputModel:any;
  private _model:T;
  private _visitedFields: {[keypath:string]:boolean};
  private _readonlyFields: {[keypath:string]:boolean};

  private _currentPage:number;

  private _focusedPage: IModelViewPage;
  private _focusedSubPages: IModelViewPage[];

  private _validationScope:ValidationScope;
  private _validations:{[kind:number]:Promise<ModelView<T>>};
  private _statusMessages:IStatusMessage[];
  private _messages:IPropertyStatusMessage[];
  private _messagesByField:{ [keypath:string]:IPropertyStatusMessage[]; };

}

function isNonSuccess(x:IStatusMessage) {
  return x.severity != MessageSeverity.SUCCESS && x.severity != MessageSeverity.NOTE;
}

function shallowCopy(x:any) {
  let keys = Object.keys(x);
  let result:any = {};
  for (var k of keys) {
    result[k] = x[k];
  }
  return result;
}

function makeAlias(options: {
  alias?: string;
  parentAlias?: string;
  fieldNames: string[];
  index: number;
}) {
  if (options.alias != null && options.alias !== '-') {
    if (options.alias.startsWith('-')) {
      return options.parentAlias + options.alias;
    }
    return options.alias;
  }
  let prefix = '';
  if (options.alias === '-') {
    if (null != options.parentAlias) {
      prefix = options.parentAlias+'-';
    }
  }
  options.alias === '-' ? options.parentAlias +'-' : '';

  if (null != options.fieldNames && null != options.fieldNames[0]) {
    let field1 = toKebapCase(options.fieldNames[0]);
    return prefix + field1;
  } else {
    return prefix + options.index;
  }
}

let humpRE = /([a-z0-9])([A-Z])/g;
function toKebapCase(x: string) {
  return x.replace(humpRE, (m) => `${m[0]}-${m[1].toLowerCase()}`);
}
