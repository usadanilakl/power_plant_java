import { BaseDto } from '../base/base.model';

export class FileIdDto extends BaseDto {
  fileType: number;
  fileLink: string;
  baseLink: string;
  folder: string;
  system: number;
  relatedSystems: string[];
  /**
   * IDs of System Values for the new @ManyToMany systems collection.
   * `undefined` ⇒ omitted by caller ⇒ backend leaves existing joins untouched.
   * `[]` ⇒ explicit clear (the form intent when the user deselects everything).
   */
  systems: number[] | undefined;
  /** Same null-vs-empty contract as {@link systems}. */
  tags: number[] | undefined;
  fileNumber: string[];
  vendor: number;
  points: number[];
  extension: string;
  extensions: string[];
  bulkEditStep: string;
  docNum: string;

  constructor(data: Partial<FileIdDto> = {}) {
    super(data);
    this.fileType = data.fileType || 0;
    this.fileLink = data.fileLink || '';
    this.baseLink = data.baseLink || '';
    this.folder = data.folder || '';
    this.system = data.system || 0;
    this.relatedSystems = data.relatedSystems || [];
    // Preserve undefined when the source doesn't include it — toJson skips the
    // key so the backend leaves the existing @ManyToMany joins alone.
    this.systems = data.systems !== undefined ? data.systems : undefined;
    this.tags = data.tags !== undefined ? data.tags : undefined;
    this.fileNumber = data.fileNumber || [];
    this.vendor = data.vendor || 0;
    this.points = data.points || [];
    this.objectType = data.objectType || '';
    this.extension = data.extension || '';
    this.extensions = data.extensions || [];
    this.bulkEditStep = data.bulkEditStep || '';
    this.docNum = data.docNum || '';
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
      // Conditional emit: undefined ⇒ key omitted ⇒ backend leaves joins alone.
      ...(this.systems !== undefined ? { systems: this.systems } : {}),
      ...(this.tags !== undefined ? { tags: this.tags } : {}),
      fileNumber: this.fileNumber,
      vendor: this.vendor,
      points: this.points,
      extension: this.extension,
      extensions: this.extensions,
      bulkEditStep: this.bulkEditStep,
      docNum: this.docNum,
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
      // Round-trip the omitted-vs-empty distinction so a re-serialized FileIdDto
      // doesn't materialize systems/tags into [] when they weren't on the wire.
      systems: json.systems !== undefined ? json.systems : undefined,
      tags: json.tags !== undefined ? json.tags : undefined,
      fileNumber: json.fileNumber,
      vendor: json.vendor,
      points: json.points || [],
      extension: json.extension,
      extensions: json.extensions,
      bulkEditStep: json.bulkEditStep,
      docNum: json.docNum,
    });
  }
}