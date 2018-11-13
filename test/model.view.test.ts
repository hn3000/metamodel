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

  private _schemaParser: ModelSchemaParser;
  private _tinyModel: IModelTypeComposite<any>;
  private _pagedModel: IModelTypeComposite<any>;

  setUp() {
    this._schemaParser = new ModelSchemaParser(undefined, {
      strings: {
        minLength: 2
      }
    });
    this._tinyModel = this._schemaParser.parseSchemaObject(this._tinySchema) as IModelTypeComposite<any>;
    this._pagedModel = this._schemaParser.parseSchemaObject(this._pagedSchema) as IModelTypeComposite<any>;
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
}