import {
    IModelTypeComposite,
    IModelView,
    ModelParseContext,
    ModelTypeConstraints,
    ModelSchemaParser,
    ModelView,
    modelTypes
} from "../src/model";

import {
  TestClass
} from "tsunit.external/tsUnitAsync";

export class ModelViewTest extends TestClass {

  private _tinySchema = {
    type: 'object',
    properties: {
      a: { type: 'string' },
      r: { type: 'string' },
    },
    required: [ 'r' ]
  };

  private _pagedSchema = {
    type: 'object',
    properties: {
      aa: { type: 'string' },
      ab: { type: 'string' },
      ba: { type: 'string' },
      bb: { type: 'string' },
      ca: { type: 'string' },
      cb: { type: 'string' }
    },
    pages: [
      {
        alias: 'a',
        properties: [ 'aa', 'ab' ],
        pages: [
          { properties: [ 'aa' ] }
        ]
      },
      {
        alias: 'b',
        properties: [ 'ba', 'bb' ],
        pages: [
          { properties: [ 'ba' ] }
        ]
      },
      {
        alias: 'c',
        properties: [ 'ca', 'cb' ]
      }
    ]
  };

  private _pagedSchemaSkippedPage = {
    type: 'object',
    properties: {
      aa: { type: 'string' },
      ab: { type: 'string' },
      ac: { type: 'string' },
      ad: { type: 'string' },
      ba: { type: 'string' },
      bb: { type: 'string' },
      ca: { type: 'string' },
      cb: { type: 'string' }
    },
    pages: [
      {
        alias: 'a',
        properties: [ 'aa', 'ab', 'ac', 'ad' ],
        pages: [
          { 
            alias: 'aa',
            properties: [ 'aa' ],
            skipIf: [[ { property: 'aa', value: 'skip!', op: '==' } ]]
          },
          { 
            alias: 'ab',
            properties: [ 'ab' ],
            skipIf: [[ { property: 'ab', value: 'skip!', op: '==' } ]]
          },
          { 
            alias: 'ac',
            properties: [ 'ac' ],
            skipIf: [[ { property: 'ac', value: 'skip!', op: '==' } ]]
          },
          { 
            alias: 'ad',
            properties: [ 'ad' ],
            skipIf: [[ { property: 'ad', value: 'skip!', op: '==' } ]]
          }
        ],
        skipIf: [[
          { property: 'ab', op: '==', value: 'skip!' }
        ]]
      },
      {
        alias: 'b',
        properties: [ 'ba', 'bb' ],
        pages: [
          { properties: [ 'ba' ] }
        ],
        skipIf: [[
          { property: 'aa', op: '==', value: 'skip!' }
        ]]
      },
      {
        alias: 'c',
        properties: [ 'ca', 'cb' ]
      }
    ]
  };

  private _schemaParser: ModelSchemaParser;
  private _tinyModel: IModelTypeComposite<any>;
  private _pagedModel: IModelTypeComposite<any>;
  private _pagedSkippedPageModel: IModelTypeComposite<any>;

  setUp() {
    this._schemaParser = new ModelSchemaParser(undefined, {
      strings: {
        minLength: 2
      }
    });
    this._tinyModel = this._schemaParser.parseSchemaObject(this._tinySchema) as IModelTypeComposite<any>;
    this._pagedModel = this._schemaParser.parseSchemaObject(this._pagedSchema) as IModelTypeComposite<any>;
    this._pagedSkippedPageModel = this._schemaParser.parseSchemaObject(this._pagedSchemaSkippedPage) as IModelTypeComposite<any>;
  }

  async testFieldValidity(): Promise<void> {
    var view: IModelView<any> = new ModelView(this._tinyModel);

    view = view.withAddedData({
      a: null,
      r: null
    });

    view = await view.validateFull();

    this.isTrue(view.isFieldValid('a'), 'field a should be valid');
    this.isFalse(view.isFieldValid('r'), 'field r should not be valid');
  }

  async testPageValidity(): Promise<void> {
    var view: IModelView<any> = new ModelView(this._pagedModel);

    view = view.withAddedData({
      aa: "_",
      ba: "_",
      ca: "_"
    });

    view = await view.validateFull();

    this.isTrue(view.isPageValid(-1), 'page -1 should be valid');
    this.isTrue(view.isPageValid(3), 'page 3 should be valid');
    this.isFalse(view.isPageValid(0), 'page 0 should not be valid');
    this.isFalse(view.isPageValid(1), 'page 1 should not be valid');
    this.isFalse(view.isPageValid(2), 'page 2 should not be valid');
    this.isFalse(view.isPageValid('c-cc'), 'page c-cc does not exist, should not be valid');
  }

  async testVisitedFields(): Promise<void> {
    var view: IModelView<any> = new ModelView(this._pagedModel);
    view = view.withAddedData({
      aa: "lala",
      ba: "l"
    });

    view = await view.validateFull();

    this.isTrue(view.isPageValid(0), 'page 0 should be valid');
    this.isTrue(view.isPageValid('aa'), 'page aa should be valid');
    this.isFalse(view.isPageValid(1), 'page 1 should be invalid');
    this.isFalse(view.isPageValid('ba'), 'page ba should not be valid');

    this.isTrue(view.arePagesUpToCurrentValid(), 'visited pages should be valid');
    this.isFalse(view.areVisitedPagesValid(), 'visited pages should be invalid');

    view = view.withAddedData({
      ba: "lolo"
    });

    view = await view.validateFull();

    this.isTrue(view.isPageValid(0), 'page 0 should be valid');
    this.isTrue(view.isPageValid(1), 'page 1 should be valid');
    this.isTrue(view.isPageValid('aa'), 'page aa should be valid');
    this.isTrue(view.isPageValid('ba'), 'page ba should be valid');
    this.isFalse(view.isPageValid('cc'), 'page cc still does not exist, should not be valid');
  }

  async testPageSkipping(): Promise<void> {
    var view: IModelView<any> = new ModelView(this._pagedSkippedPageModel, {}, -1);

    this.areIdentical(-1, view.currentPageIndex);

    view = view.withAddedData({
      aa: "skip!",
      ba: null,
      ca: null
    });

    view = view.changePage(1);

    this.areIdentical(0, view.currentPageIndex);
    this.areIdentical(1, view.currentUnskippedPageNo, 'unskipped page no should be 1');
    this.areIdentical('c', view.getPageByUnskippedPageNo(1).alias);

    view = view.changePage(1);

    this.areIdentical(2, view.currentPageIndex);
    this.areIdentical(2, view.currentUnskippedPageNo, 'unskipped page no should be 2');
    this.areIdentical('a', view.getNextUnskippedPage(-1).alias);

    view = view.changePage(1);

    this.areIdentical(3, view.currentPageIndex);
  }
  async testFocusedPageSkippingPageA(): Promise<void> {
    var view: IModelView<any> = new ModelView(this._pagedSkippedPageModel, {}, -1);

    this.areIdentical(-1, view.currentPageIndex);

    view = view.withAddedData({
      aa: "skip!",
      ab: "skip!",
      ba: null,
      ca: null
    });

    view = view.withFocusedPage('a');

    this.areIdentical('a', view.getFocusedPage().alias);
    this.areIdentical(1, view.getFocusedPageNo());
    this.areIdentical(0, view.getFocusedPageUnskippedPageNo());  // page 'a' is skipped itself
    this.areIdentical('ac', view.currentPageAlias);
    this.areIdentical(3, view.currentPageNo);
    this.areIdentical(1, view.currentUnskippedPageNo);

    view = view.withAddedData({
      ab: "do not skip!"
    });

    this.areIdentical(1, view.getFocusedPageNo());
    this.areIdentical(1, view.getFocusedPageUnskippedPageNo());
    this.areIdentical('ac', view.currentPageAlias);
    this.areIdentical(3, view.currentPageNo);
    this.areIdentical(2, view.currentUnskippedPageNo);

    view = view.withAddedData({
      aa: "do not skip!"
    });

    this.areIdentical(1, view.getFocusedPageNo());
    this.areIdentical(1, view.getFocusedPageUnskippedPageNo());
    this.areIdentical('ac', view.currentPageAlias);
    this.areIdentical(3, view.currentPageNo);
    this.areIdentical(3, view.currentUnskippedPageNo);
  }

  async testFocusedPageSkippingPageC(): Promise<void> {
    var view: IModelView<any> = new ModelView(this._pagedSkippedPageModel, {}, -1);

    this.areIdentical(-1, view.currentPageIndex);

    view = view.withAddedData({
      aa: "skip!",
      ba: null,
      ca: null
    });

    view = view.withFocusedPage('c');

    this.areIdentical('c', view.getFocusedPage().alias);
    this.areIdentical(3, view.getFocusedPageNo());
    this.areIdentical(2, view.getFocusedPageUnskippedPageNo());

    view = view.withAddedData({
      ab: "skip!"
    });

    this.areIdentical(3, view.getFocusedPageNo());
    this.areIdentical(1, view.getFocusedPageUnskippedPageNo());

    view = view.withAddedData({
      aa: "do not skip!",
      ab: "do not skip!"
    });

    this.areIdentical(3, view.getFocusedPageNo());
    this.areIdentical(3, view.getFocusedPageUnskippedPageNo());
    
  }
}
