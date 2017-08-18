
import {
  IModelTypeConstrainable,
  IModelTypeConstraint,
  IModelParseContext
} from './model.api';

import {
  ModelConstraints,
  ModelTypeConstrainable
} from './model.base';

export interface IFile {
  name?: string;
  file?: File;
}

export class ModelTypeFile extends ModelTypeConstrainable<IFile> implements IModelTypeConstrainable<IFile> {
  constructor(name:string, constraints?: ModelConstraints<IFile>) {
    super(name, constraints);
  }

  _kind(): string { return 'file'; }

  create(): IFile {
    return ({
      file: null,
      name: null
    });
  }

  parse(ctx: IModelParseContext): IFile {
    let val = ctx.currentValue();

    if (null == val) {
      return null;
    }

    let result: IFile = {
      file: null,
      name: null
    };
    result.file = val.file as File;
    result.name = val.name as string;

    return result;
  }

  unparse() {

  }

  validate() {

  }
}