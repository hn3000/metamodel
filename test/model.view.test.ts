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
          name: 'a',
          properties: [ 'aa', 'ab' ]
        },
        {
          name: 'b',
          properties: [ 'ba', 'bb' ]
        },
        {
          name: 'c',
          properties: [ 'ca', 'cb' ]
        }
      ]
    };

    private _schemaParser: ModelSchemaParser;
    private _pagedModel: IModelTypeComposite<any>;

    setUp() {
      this._schemaParser = new ModelSchemaParser(undefined, {
        strings: {
          minLength: 2
        }
      });
      this._pagedModel = this._schemaParser.parseSchemaObject(this._pagedSchema) as IModelTypeComposite<any>;
    }

  async testVisitedFields(): Promise<void> {
    var view: IModelView<any> = new ModelView(this._pagedModel);
    view = view.withAddedData({
      aa: "lala",
      ba: "l"
    });

    view = await view.validateFull();

    this.isTrue(view.isPageValid(0), 'page 0 should be valid');
    this.isFalse(view.isPageValid(1), 'page 1 should be invalid');

    this.isTrue(view.arePagesUpToCurrentValid(), 'visited pages should be invalid');
    this.isFalse(view.areVisitedPagesValid(), 'visited pages should be invalid');

    view = view.withAddedData({
      ba: "lolo"
    });

    view = await view.validateFull();

    this.isTrue(view.isPageValid(0), 'page 0 should be valid');
    this.isTrue(view.isPageValid(1), 'page 1 should be valid');
  }
}