import { BaseDto } from '../base/base.model';

export class FileIdDto extends BaseDto {
  fileType: number;
  fileLink: string;
  baseLink: string;
  folder: string;
  system: number;
  relatedSystems: string;
  fileNumber: string;
  vendor: number;
  points: number[];
  extension: string;
  bulkEditStep: string;
  docNum: string;
  isVerified: boolean;

  constructor(data: Partial<FileIdDto> = {}) {
    super(data);
    this.fileType = data.fileType || 0;
    this.fileLink = data.fileLink || '';
    this.baseLink = data.baseLink || '';
    this.folder = data.folder || '';
    this.system = data.system || 0;
    this.relatedSystems = data.relatedSystems || '';
    this.fileNumber = data.fileNumber || '';
    this.vendor = data.vendor || 0;
    this.points = data.points || [];
    this.objectType = data.objectType || '';
    this.extension = data.extension || '';
    this.bulkEditStep = data.bulkEditStep || '';
    this.docNum = data.docNum || '';
    this.isVerified = data.isVerified || false;
  }

  override toJson(): any {
    return {
      ...super.toJson(),
      fileType: this.fileType,
      fileLink: this.fileLink,
      baseLink: this.baseLink,
      folder: this.folder,
      system: this.system,
      relatedSystems: this.relatedSystems,
      fileNumber: this.fileNumber,
      vendor: this.vendor,
      points: this.points,
      extension: this.extension,
      bulkEditStep: this.bulkEditStep,
      docNum: this.docNum,
      isVerified: this.isVerified
    };
  }

  static override fromJson(json: any): FileIdDto {
    if (!json) {
      console.warn('Received null or undefined json in FileIdDto.fromJson');
      return new FileIdDto();
    }

    return new FileIdDto({
      ...super.fromJson(json),
      fileType: json.fileType,
      fileLink: json.fileLink,
      baseLink: json.baseLink,
      folder: json.folder,
      system: json.system,
      relatedSystems: json.relatedSystems,
      fileNumber: json.fileNumber,
      vendor: json.vendor,
      points: json.points || [],
      extension: json.extension,
      bulkEditStep: json.bulkEditStep,
      docNum: json.docNum,
      isVerified: json.isVerified
    });
  }
}