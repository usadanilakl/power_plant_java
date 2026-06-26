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
  /** Proper multi-system collection (new @ManyToMany — replaces system+relatedSystems). */
  systems: ValueDto[];
  /** Free-form tag values (new @ManyToMany, Category=Tag). */
  tags: ValueDto[];
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
  /** Proper multi-system collection (new @ManyToMany — replaces system+relatedSystems). */
  systems: ValueDto[];
  /** Free-form tag values (new @ManyToMany, Category=Tag). */
  tags: ValueDto[];
  /**
   * Hidden flags tracking whether the source payload included systems/tags. Used
   * by toJson/toIdModel to skip the key when omitted, so the backend can tell
   * "leave alone" (key absent) from "clear the joins" (key present + empty array).
   * Keeps the public ValueDto[] type non-nullable for all consumers.
   */
  private _systemsProvided = false;
  private _tagsProvided = false;
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
    // Default the public field to [] (non-nullable type) but track whether the
    // source ACTUALLY had it. Without this flag, partial-update paths that
    // construct FileDto with just {id, name, ...} would default systems to []
    // and toIdModel would serialize systems:[] → backend wipes the joins.
    this._systemsProvided = data.systems !== undefined;
    this.systems = this._systemsProvided
      ? data.systems!.map(v => ValueDto.fromJson(v))
      : [];
    this._tagsProvided = data.tags !== undefined;
    this.tags = this._tagsProvided
      ? data.tags!.map(v => ValueDto.fromJson(v))
      : [];
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
          // Conditional emit so an omitted-then-serialized FileDto doesn't carry
          // `systems: []` / `tags: []` (which the backend reads as "clear joins").
          ...(this._systemsProvided ? { systems: this.systems.map(v => v?.toJson?.() ?? v) } : {}),
          ...(this._tagsProvided ? { tags: this.tags.map(v => v?.toJson?.() ?? v) } : {}),
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
          // Preserve undefined when the JSON omits the field (so round-trip stays
          // "leave alone" rather than turning into "clear joins"). Empty array in
          // the JSON IS preserved — that's the explicit-clear intent.
          systems: json.systems !== undefined
            ? json.systems.map((v: any) => ValueDto.fromJson(v))
            : undefined,
          tags: json.tags !== undefined
            ? json.tags.map((v: any) => ValueDto.fromJson(v))
            : undefined,
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
          // Only forward systems/tags when they were intentionally set on this
          // FileDto. Partial-update callers that never touched these fields get
          // FileIdDto.systems/tags = undefined → FileIdDto.toJson omits the key
          // → backend leaves existing joins alone. Empty array from the form's
          // "user removed all" path still flows through because the form ALWAYS
          // sets these fields (so the flag is true with the empty array).
          systems: this._systemsProvided
            ? this.systems.map(extractId).filter(id => id > 0)
            : undefined,
          tags: this._tagsProvided
            ? this.tags.map(extractId).filter(id => id > 0)
            : undefined,
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
