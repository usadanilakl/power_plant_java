import { FileModel } from './file.model';

export interface IFileClipboard
  extends Omit<
    FileModel,
    | 'id'
    | 'points'
    | 'fileLink'
    | 'baseLink'
    | 'extension'
    | 'extensions'
    | 'bulkEditStep'
  > {}

export class FileClipboardItem implements IFileClipboard {
  name: string = '';
  objectType: string = 'File';
  fileType: any = null;
  folder: string = '';
  system: any = null;
  relatedSystems: string[] = [];
  fileNumber: string[] = [];
  vendor: any = null;
  docNum: string = '';
  isVerified: boolean = false;

  constructor(data: Partial<FileModel> = {}) {
    this.name = data.name || '';
    this.objectType = 'File';
    this.fileType = data.fileType ? { id: data.fileType.id, name: data.fileType.name } : null;
    this.folder = data.folder || '';
    this.system = data.system ? { id: data.system.id, name: data.system.name } : null;
    this.relatedSystems = data.relatedSystems || [];
    this.fileNumber = data.fileNumber || [];
    this.vendor = data.vendor ? { id: data.vendor.id, name: data.vendor.name } : null;
    this.docNum = data.docNum || '';
    this.isVerified = data.isVerified || false;
  }
}
