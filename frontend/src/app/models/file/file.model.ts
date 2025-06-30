import { ValueDto } from '../value.model';
import { EquipmentDto } from '../equipment/equipment.model';
import { FileIdDto } from './file-id.model';

export interface FileModel {
  id: number;
  name: string;
  fileType: ValueDto;
  fileLink: string;
  baseLink: string;
  folder: string;
  system: ValueDto;
  relatedSystems: string;
  fileNumber: string[];
  vendor: ValueDto;
  points: EquipmentDto[];
  objectType: string;
  extension: string;
  extensions: string[];
  bulkEditStep: string;
  docNum: string;
  isVerified: boolean;
}

export class FileDto implements FileModel {
  id: number;
  name: string;
  fileType: ValueDto;
  fileLink: string;
  baseLink: string;
  folder: string;
  system: ValueDto;
  relatedSystems: string;
  fileNumber: string[];
  vendor: ValueDto;
  points: EquipmentDto[];
  objectType: string;
  extension: string;
  extensions: string[];
  bulkEditStep: string;
  docNum: string;
  isVerified: boolean;

  constructor(data: Partial<FileModel> = {}) {
    this.id = data.id || 0;
    this.name = data.name || '';
    this.fileType = data.fileType || new ValueDto({ id: 0, name: '' });
    this.fileLink = data.fileLink || '';
    this.baseLink = data.baseLink || '';
    this.folder = data.folder || '';
    this.system = data.system || new ValueDto({ id: 0, name: '' });
    this.relatedSystems = data.relatedSystems || '';
    this.fileNumber = data.fileNumber || [];
    this.vendor = data.vendor || new ValueDto({ id: 0, name: '' });
    this.points = data.points || [];
    this.objectType = data.objectType || '';
    this.extension = data.extension || '';
    this.extensions = data.extensions || [];
    this.bulkEditStep = data.bulkEditStep || '';
    this.docNum = data.docNum || '';
    this.isVerified = data.isVerified || false;
  }

    // Serialization method
    toJson(): any {
        return {
          id: this.id,
          name: this.name,
          fileType: this.fileType,
          fileLink: this.fileLink,
          baseLink: this.baseLink,
          folder: this.folder,
          system: this.system,
          relatedSystems: this.relatedSystems,
          fileNumber: this.fileNumber,
          vendor: this.vendor,
          points: this.points,
          objectType: this.objectType,
          extension: this.extension,
          extensions: this.extensions,
          bulkEditStep: this.bulkEditStep,
          docNum: this.docNum,
          isVerified: this.isVerified
        };
      }
    
      // Deserialization method (static)
      static fromJson(json: any): FileDto {
        return new FileDto({
          id: json.id,
          name: json.name,
          fileType: json.fileType,
          fileLink: json.fileLink,
          baseLink: json.baseLink,
          folder: json.folder,
          system: json.system,
          relatedSystems: json.relatedSystems,
          fileNumber: json.fileNumber,
          vendor: json.vendor,
          points: json.points,
          objectType: json.objectType,
          extension: json.extension,
          extensions: json.extensions,
          bulkEditStep: json.bulkEditStep,
          docNum: json.docNum,
          isVerified: json.isVerified
        });
      }

      toIdModel(): FileIdDto {
        return new FileIdDto({
          id: this.id,
          name: this.name,
          fileType: this.fileType?.id || 0,
          fileLink: this.fileLink,
          baseLink: this.baseLink,
          folder: this.folder,
          system: this.system?.id || 0,
          relatedSystems: this.relatedSystems,
          fileNumber: this.fileNumber,
          vendor: this.vendor?.id || 0,
          points: this.points.map(point => point.id),
          objectType: this.objectType,
          extension: this.extension,
          extensions: this.extensions,
          bulkEditStep: this.bulkEditStep,
          docNum: this.docNum,
          isVerified: this.isVerified
        });
      }



  // You can add methods here for any file-specific operations
}