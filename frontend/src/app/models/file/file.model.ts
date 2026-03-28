import { ValueDto } from '../value.model';
import { EquipmentDto } from '../equipment/equipment.model';
import { FileIdDto } from './file-id.model';
import { BaseDto, BaseModel } from '../base/base.model';

export interface FileModel extends BaseModel {
  id: number;
  name: string;
  fileType: ValueDto;
  fileLink: string;
  baseLink: string;
  folder: string;
  system: ValueDto;
  relatedSystems: string[];
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

export class FileDto extends BaseDto implements FileModel {
  fileType: ValueDto;
  fileLink: string;
  baseLink: string;
  folder: string;
  system: ValueDto;
  relatedSystems: string[];
  fileNumber: string[];
  vendor: ValueDto;
  points: EquipmentDto[];
  extension: string;
  extensions: string[];
  bulkEditStep: string;
  docNum: string;

  constructor(data: Partial<FileModel> = {}) {
    super(data);
    this.id = data.id || 0;
    this.name = data.name || '';
    this.fileType = data.fileType ? ValueDto.fromJson(data.fileType) : new ValueDto({ id: 0, name: '' });
    this.fileLink = data.fileLink || '';
    this.baseLink = data.baseLink || '';
    this.folder = data.folder || '';
    this.system = data.system ? ValueDto.fromJson(data.system) : new ValueDto({ id: 0, name: '' });
    this.relatedSystems = data.relatedSystems || [];
    this.fileNumber = data.fileNumber || [];
    this.vendor = data.vendor ? ValueDto.fromJson(data.vendor) : new ValueDto({ id: 0, name: '' });
    this.points = data.points?.map(point => EquipmentDto.fromJson(point)) || [];
    this.objectType = data.objectType || '';
    this.extension = data.extension || '';
    this.extensions = data.extensions || [];
    this.bulkEditStep = data.bulkEditStep || '';
    this.docNum = data.docNum || '';
    this.isVerified = data.isVerified || false;
  }

    // Serialization method
    override toJson(): any {
        return {
          ...super.toJson(),
          fileType: this.fileType?.toJson?.() ?? this.fileType,
          fileLink: this.fileLink,
          baseLink: this.baseLink,
          folder: this.folder,
          system: this.system?.toJson?.() ?? this.system,
          relatedSystems: this.relatedSystems,
          fileNumber: this.fileNumber,
          vendor: this.vendor?.toJson?.() ?? this.vendor,
          points: this.points.map(point => point.toJson()),
          extension: this.extension,
          extensions: this.extensions,
          bulkEditStep: this.bulkEditStep,
          docNum: this.docNum,
        };
      }
    
      // Deserialization method (static)
      static override fromJson(json: any): FileDto {
        return new FileDto({
          ...super.fromJson(json),
          fileType: json.fileType ? ValueDto.fromJson(json.fileType) : new ValueDto({ id: 0, name: '' }),
          fileLink: json.fileLink,
          baseLink: json.baseLink,
          folder: json.folder,
          system: json.system ? ValueDto.fromJson(json.system) : new ValueDto({ id: 0, name: '' }),
          relatedSystems: json.relatedSystems,
          fileNumber: json.fileNumber,
          vendor: json.vendor ? ValueDto.fromJson(json.vendor) : new ValueDto({ id: 0, name: '' }),
          points: json.points?.map((point: any) => EquipmentDto.fromJson(point)) ?? [],
          extension: json.extension,
          extensions: json.extensions,
          bulkEditStep: json.bulkEditStep,
          docNum: json.docNum,
        });
      }

      toIdModel(): FileIdDto {
        // Helper to extract ID from value (handles both object with id and raw number)
        const extractId = (value: any): number => {
          if (value == null) return 0;
          if (typeof value === 'number') return value;
          if (typeof value === 'object' && value.id != null) return value.id;
          return 0;
        };

        return new FileIdDto({
          id: this.id,
          name: this.name,
          fileType: extractId(this.fileType),
          fileLink: this.fileLink,
          baseLink: this.baseLink,
          folder: this.folder,
          system: extractId(this.system),
          relatedSystems: this.relatedSystems,
          fileNumber: this.fileNumber,
          vendor: extractId(this.vendor),
          points: this.points?.map(point => typeof point === 'number' ? point : point.id) || [],
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
