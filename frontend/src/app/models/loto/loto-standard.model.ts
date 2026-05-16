import { Validators } from '@angular/forms';
import { BaseDto, BaseModel } from '../base/base.model';
import { FormField } from '../ui/form-field.model';
import { LotoPointDto } from './loto-point.model';
import { LotoStandardIdDto } from './loto-standard-id.model';
import { Column } from '../column.model';
import { ValueDto } from '../value.model';

export type LotoStandardFieldName = keyof LotoStandardModel;

export interface LotoStandardModel extends BaseModel {
  description: string | null;
  lotoPoints: LotoPointDto[] | null;
  groups: ValueDto[] | null;
}

export interface PointPrerequisiteDto {
  // Install side
  installRequiredPointIds: number[];
  installSafetyConditions: string[];
  installNotes?: string | null;
  // Removal side (empty arrays = inherit from install)
  removalRequiredPointIds: number[];
  removalSafetyConditions: string[];
  removalNotes?: string | null;
  removalOrder?: number | null;
}

export class LotoStandardDto extends BaseDto {
  description: string | null;
  lotoPoints: LotoPointDto[] | null;
  groups: ValueDto[] | null;
  pointPrerequisites: Record<number, PointPrerequisiteDto> | null;
  installPrerequisitesText: string | null;
  installHazardControlText: string | null;
  installProcedureText: string | null;
  removalPrerequisitesText: string | null;
  removalHazardControlText: string | null;
  removalProcedureText: string | null;
  removalReversesInstallOrder: boolean;

  /** Username of original creator (from BaseAuditEntity.createdBy on the server). */
  createdBy: string | null;

  // Development workflow (read-only — mutated only via workflow endpoints)
  developmentStatus: ValueDto | null;
  currentVersion: number | null;
  submittedForVerificationBy: string | null;
  submittedForVerificationAt: string | null;
  verifiedBy: string | null;
  verifiedAt: string | null;
  walkdownBy: string | null;
  walkdownAt: string | null;
  readyForTestingBy: string | null;
  readyForTestingAt: string | null;
  managerApprovedBy: string | null;
  managerApprovedAt: string | null;

  constructor(data: Partial<LotoStandardDto> = {}) {
    super(data);
    this.description = data.description || null;
    this.lotoPoints = data.lotoPoints?.map(point => new LotoPointDto(point)) || null;
    this.groups = data.groups?.map(group => new ValueDto(group)) || null;
    this.pointPrerequisites = data.pointPrerequisites ?? null;
    this.installPrerequisitesText = data.installPrerequisitesText ?? null;
    this.installHazardControlText = data.installHazardControlText ?? null;
    this.installProcedureText = data.installProcedureText ?? null;
    this.removalPrerequisitesText = data.removalPrerequisitesText ?? null;
    this.removalHazardControlText = data.removalHazardControlText ?? null;
    this.removalProcedureText = data.removalProcedureText ?? null;
    this.removalReversesInstallOrder = data.removalReversesInstallOrder ?? false;
    this.createdBy = data.createdBy ?? null;
    this.developmentStatus = data.developmentStatus ? new ValueDto(data.developmentStatus) : null;
    this.currentVersion = data.currentVersion ?? null;
    this.submittedForVerificationBy = data.submittedForVerificationBy ?? null;
    this.submittedForVerificationAt = data.submittedForVerificationAt ?? null;
    this.verifiedBy = data.verifiedBy ?? null;
    this.verifiedAt = data.verifiedAt ?? null;
    this.walkdownBy = data.walkdownBy ?? null;
    this.walkdownAt = data.walkdownAt ?? null;
    this.readyForTestingBy = data.readyForTestingBy ?? null;
    this.readyForTestingAt = data.readyForTestingAt ?? null;
    this.managerApprovedBy = data.managerApprovedBy ?? null;
    this.managerApprovedAt = data.managerApprovedAt ?? null;
  }

  // Serialization method
  override toJson(): any {
    return {
      ...super.toJson(),
      description: this.description,
      lotoPoints: this.lotoPoints?.map(point => point.toJson()),
      groups: this.groups?.map(group => group.toJson())
    };
  }

  // Deserialization method (static)
  static override fromJson(json: any): LotoStandardDto {
    return new LotoStandardDto({
      ...super.fromJson(json),
      description: json.description,
      lotoPoints: json.lotoPoints?.map((pointJson: any) => LotoPointDto.fromJson(pointJson)) || null,
      groups: json.groups?.map((groupJson: any) => ValueDto.fromJson(groupJson)) || null,
      pointPrerequisites: json.pointPrerequisites ?? null,
      installPrerequisitesText: json.installPrerequisitesText ?? json.prerequisitesText ?? null,
      installHazardControlText: json.installHazardControlText ?? json.hazardControlMethodsText ?? null,
      installProcedureText: json.installProcedureText ?? null,
      removalPrerequisitesText: json.removalPrerequisitesText ?? null,
      removalHazardControlText: json.removalHazardControlText ?? null,
      removalProcedureText: json.removalProcedureText ?? null,
      removalReversesInstallOrder: json.removalReversesInstallOrder ?? false,
      createdBy: json.createdBy ?? null,
      developmentStatus: json.developmentStatus ? ValueDto.fromJson(json.developmentStatus) : null,
      currentVersion: json.currentVersion ?? null,
      submittedForVerificationBy: json.submittedForVerificationBy ?? null,
      submittedForVerificationAt: json.submittedForVerificationAt ?? null,
      verifiedBy: json.verifiedBy ?? null,
      verifiedAt: json.verifiedAt ?? null,
      walkdownBy: json.walkdownBy ?? null,
      walkdownAt: json.walkdownAt ?? null,
      readyForTestingBy: json.readyForTestingBy ?? null,
      readyForTestingAt: json.readyForTestingAt ?? null,
      managerApprovedBy: json.managerApprovedBy ?? null,
      managerApprovedAt: json.managerApprovedAt ?? null,
    });
  }

  toIdDto(): LotoStandardIdDto {
    const idDto =  new LotoStandardIdDto();
    idDto.id = this.id;
    idDto.name = this.name;
    idDto.description = this.description;
    idDto.lotoPoints = this.lotoPoints?.map(point => point.id) || null;
    idDto.groups = this.groups?.map(group => group.id) || null;
    return idDto;
  }

  toFormFields(fields: LotoStandardFieldName[] = ['name','description','lotoPoints']): FormField[]{
    const allFields: {[key in LotoStandardFieldName ]: FormField} = {
      id: { name: 'id', label: 'ID', type: 'text', initialValue: this.id } as FormField,
      name: { name: 'name', label: 'Name', type: 'text', initialValue: this.name } as FormField,
      description: { name: 'description', label: 'Description', type: 'text', validators: [Validators.required], initialValue: this.description } as FormField,
      lotoPoints: { name: 'lotoPoints', label: 'Loto Points', type: 'multi-select', options: this.lotoPoints?.map(point => point.toOption()) || [] } as FormField,
      groups: { name: 'groups', label: 'Groups', type: 'multi-value-select', initialValue: this.groups || [] } as FormField,
      objectType: { name: 'objectType', label: 'Object Type', type: 'text', initialValue: 'Loto Standard' } as FormField,
      isVerified: { name: 'isVerified', label: 'Is Verified', type: 'select', options: [{}], initialValue: 'false' } as FormField
    }
    return fields.map(field => allFields[field]);
  }

  static toTableColumns(fields: LotoStandardFieldName[] = ['name', 'description', 'lotoPoints']): Column[] {
    const allColumns: { [key in LotoStandardFieldName]: Column } = {
      id: {
        id: 'id',
        header: 'ID',
        accessorKey: 'id'
      },
      name: {
        id: 'name',
        header: 'Name',
        accessorKey: 'name'
      },
      description: {
        id: 'description',
        header: 'Description',
        accessorKey: 'description'
      },
      lotoPoints: {
        id: 'lotoPoints',
        header: 'LOTO Points',
        accessorFn: (item: LotoStandardDto) => item.lotoPoints?.length.toString() || '0'
      },
      groups: {
        id: 'groups',
        header: 'Groups',
        accessorFn: (item: LotoStandardDto) => item.groups?.map(g => g.name).join(', ') || ''
      },
      objectType: {
        id: 'objectType',
        header: 'Object Type',
        accessorKey: 'objectType'
      },
      isVerified: {
        id: 'isVerified',
        header: 'Verified',
        accessorFn: (item: LotoStandardDto) => item.isVerified ? 'Yes' : 'No',
        conditionalStyling: (item: LotoStandardDto) =>
          item.isVerified ? { 'background-color': '#90EE90' } : { 'background-color': '#FFCCCB' }
      }
    };
  
    return fields.map(field => allColumns[field]);
  }
  
}