/**
 * TS mirrors of {@code dto/files/FileConnectorDto.java} and
 * {@code FileConnectorIdDto.java}. Connectors are off-page reference shapes
 * drawn on a P&ID that point at another file — first-class entity instead of
 * Equipment with eqType='connector'.
 */
import { BaseModel, BaseDto } from '../base/base.model';

/** Response shape — backend resolves file numbers/names eagerly. */
export interface FileConnectorModel extends BaseModel {
  id: number;
  sourceFileId: number | null;
  targetFileId: number | null;
  /** Resolved at mapping time so the viewer can render labels without extra fetches. */
  sourceFileNumber: string | null;
  targetFileNumber: string | null;
  targetFileName: string | null;

  // Shape — same field names Equipment uses
  coordinates: string | null;
  originalPictureSize: string | null;
  rotation: number | null;
  symbolId: string | null;
  svgPath: string | null;

  /** Soft FK to the connector on targetFile pointing back at this one. */
  counterpartConnectorId: number | null;

  /** Optional user override. Empty → frontend derives from targetFileNumber. */
  label: string | null;

  /** Persisted per-connector toggle for canvas label rendering. Null/false → no label drawn. */
  showLabel: boolean | null;
}

export class FileConnectorDto extends BaseDto implements FileConnectorModel {
  sourceFileId: number | null = null;
  targetFileId: number | null = null;
  sourceFileNumber: string | null = null;
  targetFileNumber: string | null = null;
  targetFileName: string | null = null;

  coordinates: string | null = null;
  originalPictureSize: string | null = null;
  rotation: number | null = null;
  symbolId: string | null = null;
  svgPath: string | null = null;

  counterpartConnectorId: number | null = null;
  label: string | null = null;
  showLabel: boolean | null = null;

  constructor(data: Partial<FileConnectorModel> = {}) {
    super(data);
    this.id = data.id ?? 0;
    this.sourceFileId = data.sourceFileId ?? null;
    this.targetFileId = data.targetFileId ?? null;
    this.sourceFileNumber = data.sourceFileNumber ?? null;
    this.targetFileNumber = data.targetFileNumber ?? null;
    this.targetFileName = data.targetFileName ?? null;
    this.coordinates = data.coordinates ?? null;
    this.originalPictureSize = data.originalPictureSize ?? null;
    this.rotation = data.rotation ?? null;
    this.symbolId = data.symbolId ?? null;
    this.svgPath = data.svgPath ?? null;
    this.counterpartConnectorId = data.counterpartConnectorId ?? null;
    this.label = data.label ?? null;
    this.showLabel = data.showLabel ?? null;
  }

  /** Display text for the connector. Falls back to targetFileNumber when label is unset. */
  displayLabel(): string {
    if (this.label && this.label.trim()) return this.label;
    if (this.targetFileName) return this.targetFileName;
    if (this.targetFileNumber) return this.targetFileNumber;
    return `Connector #${this.id}`;
  }

  override toJson(): any {
    return {
      ...super.toJson(),
      sourceFileId: this.sourceFileId,
      targetFileId: this.targetFileId,
      sourceFileNumber: this.sourceFileNumber,
      targetFileNumber: this.targetFileNumber,
      targetFileName: this.targetFileName,
      coordinates: this.coordinates,
      originalPictureSize: this.originalPictureSize,
      rotation: this.rotation,
      symbolId: this.symbolId,
      svgPath: this.svgPath,
      counterpartConnectorId: this.counterpartConnectorId,
      label: this.label,
      showLabel: this.showLabel,
    };
  }

  static override fromJson(json: any): FileConnectorDto {
    return new FileConnectorDto({
      ...super.fromJson(json),
      sourceFileId: json.sourceFileId ?? null,
      targetFileId: json.targetFileId ?? null,
      sourceFileNumber: json.sourceFileNumber ?? null,
      targetFileNumber: json.targetFileNumber ?? null,
      targetFileName: json.targetFileName ?? null,
      coordinates: json.coordinates ?? null,
      originalPictureSize: json.originalPictureSize ?? null,
      rotation: json.rotation ?? null,
      symbolId: json.symbolId ?? null,
      svgPath: json.svgPath ?? null,
      counterpartConnectorId: json.counterpartConnectorId ?? null,
      label: json.label ?? null,
      showLabel: json.showLabel ?? null,
    });
  }

  /**
   * Convert to the create/update payload shape — same fields minus the
   * resolved display strings (backend doesn't accept those on write).
   */
  toIdModel(): FileConnectorIdDto {
    return {
      id: this.id || undefined,
      sourceFileId: this.sourceFileId,
      targetFileId: this.targetFileId,
      coordinates: this.coordinates,
      originalPictureSize: this.originalPictureSize,
      rotation: this.rotation,
      symbolId: this.symbolId,
      svgPath: this.svgPath,
      counterpartConnectorId: this.counterpartConnectorId,
      label: this.label,
      showLabel: this.showLabel,
    };
  }
}

/**
 * Create/update payload — files referenced by ID only. counterpartConnectorId
 * accepted here but the canonical way to link counterparts is the dedicated
 * link/unlink endpoints (they enforce bidirectional invariants).
 */
export interface FileConnectorIdDto {
  id?: number;
  sourceFileId: number | null;
  targetFileId: number | null;
  coordinates: string | null;
  originalPictureSize: string | null;
  rotation: number | null;
  symbolId: string | null;
  svgPath: string | null;
  counterpartConnectorId: number | null;
  label: string | null;
  /** Optional toggle for canvas label rendering. Send true/false to update,
   *  omit (undefined/null) to preserve the existing value (backend uses
   *  null-as-skip in the mapper). */
  showLabel: boolean | null;
}
