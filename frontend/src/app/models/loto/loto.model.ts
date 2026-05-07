import { BasePermitDto, BasePermitModel } from '../base/base-permit.model';
import { LotoPointDto } from './loto-point.model';
import { LockDto } from './lock.model';
import { LotoBoxDto } from './loto-box.model';
import { LotoIdDto } from './loto-id.model';
import { LotoSnapshotDto } from './loto-snapshot.model';
import { FormField } from '../ui/form-field.model';
import { Column } from '../column.model';
import { Validators } from '@angular/forms';
import { PersonnelSignEntry } from '../permits/dailt-permit-package.model';

export type { PersonnelSignEntry };

export interface LotoModel extends BasePermitModel {
  lotoPoints: LotoPointDto[];
  locks: LockDto[];
  lotoBox: LotoBoxDto | null;
  boxNumber: number | null;
  equipmentSystem: string;
  lotoRequestor: string;
  date: string;
  personnel: PersonnelSignEntry[];
  sourceStandardId: number | null;
  sourceStandardName: string;
  snapshots: LotoSnapshotDto[];
}

export class LotoDto extends BasePermitDto implements LotoModel {
  lotoPoints: LotoPointDto[];
  locks: LockDto[];
  lotoBox: LotoBoxDto | null;
  boxNumber: number | null;

  equipmentSystem: string;
  lotoRequestor: string;
  date: string;
  personnel: PersonnelSignEntry[];
  sourceStandardId: number | null;
  sourceStandardName: string;
  snapshots: LotoSnapshotDto[];

  constructor(data: Partial<LotoModel> = {}) {
    super(data);
    this.lotoPoints = data.lotoPoints?.map(point => new LotoPointDto(point)) ?? [];
    this.locks = data.locks?.map(lock => new LockDto(lock)) ?? [];
    this.lotoBox = data.lotoBox ? new LotoBoxDto(data.lotoBox, true) : null;
    this.boxNumber = data.boxNumber || null;
    this.equipmentSystem = data.equipmentSystem || '';
    this.lotoRequestor = data.lotoRequestor || '';
    this.date = data.date || '';
    this.personnel = data.personnel ?? [];
    this.sourceStandardId = data.sourceStandardId ?? null;
    this.sourceStandardName = data.sourceStandardName ?? '';
    this.snapshots = data.snapshots ?? [];
  }

  // Override toJson method
  override toJson(): any {
    return {
      ...super.toJson(),
      lotoPoints: this.lotoPoints.map(point => point.toJson()),
      locks: this.locks.map(lock => lock.toJson()),
      lotoBox: this.lotoBox?.toJson(),
      boxNumber : this.boxNumber,
      equipmentSystem: this.equipmentSystem,
      lotoRequestor: this.lotoRequestor,
      date: this.date,
      personnel: this.personnel,
      sourceStandardId: this.sourceStandardId,
      sourceStandardName: this.sourceStandardName
    };
  }

  // Override fromJson method
  static override fromJson(json: any): LotoDto {
    if (!json) {
      console.warn('Received null or undefined json in LotoDto.fromJson');
      return new LotoDto();
    }

    return new LotoDto({
      ...super.fromJson(json),
      lotoPoints: json.lotoPoints?.map((pointJson: any) => LotoPointDto.fromJson(pointJson)) || null,
      locks: (json.locks ?? []).map((lock: any) => LockDto.fromJson(lock)),
      lotoBox: json.lotoBox ? LotoBoxDto.fromJson(json.lotoBox, true) : null,
      boxNumber: json.boxNumber,
      equipmentSystem: json.equipmentSystem,
      lotoRequestor: json.lotoRequestor,
      date: json.date,
      personnel: json.personnel ?? [],
      sourceStandardId: json.sourceStandardId ?? null,
      sourceStandardName: json.sourceStandardName ?? '',
      snapshots: Array.isArray(json.snapshots) ? json.snapshots.map((s: any) => LotoSnapshotDto.fromJson(s)) : [],
    });
  }

  override toIdModel(): LotoIdDto {
    const baseIdModel = super.toIdModel();
    return new LotoIdDto({
      ...baseIdModel,
      lotoPoints: this.lotoPoints.map(point => point.id),
      locks: this.locks.map(lock => lock.id),
      lotoBox: this.lotoBox ? this.lotoBox.id : null,
      boxNumber: this.boxNumber,
      equipmentSystem: this.equipmentSystem,
      lotoRequestor: this.lotoRequestor,
      date: this.date
    });
  }
  static toTableColumns(): Column[] {
    return [
      { id: 'id', header: 'ID', accessorKey: 'id' },
      { id: 'permitNumber', header: 'Permit #', accessorKey: 'permitNumber' },
      { id: 'name', header: 'LOTO Number', accessorKey: 'name' },
      { id: 'permitStatus', header: 'Status', accessorKey: 'permitStatus.name' },
      { id: 'equipmentSystem', header: 'Equipment/System', accessorKey: 'equipmentSystem' },
      { id: 'lotoRequestor', header: 'Requestor', accessorKey: 'lotoRequestor' },
      { id: 'date', header: 'Date', accessorKey: 'date' },
      { id: 'boxNumber', header: 'Box #', accessorKey: 'boxNumber' },
      { id: 'pointCount', header: 'Points', accessorKey: 'lotoPoints.length' },
    ];
  }

  static toFormFields(dto: LotoDto): FormField[] {
    const fields: FormField[] = [
      {
        name: 'equipmentSystem',
        label: 'Equipment System',
        type: 'text',
        initialValue: dto.equipmentSystem,
        validators: [Validators.required]
      },
      {
        name: 'lotoRequestor',
        label: 'LOTO Requestor',
        type: 'text',
        initialValue: dto.lotoRequestor,
        validators: [Validators.required]
      },
      {
        name: 'date',
        label: 'Date',
        type: 'date',
        initialValue: dto.date || new Date().toISOString().split('T')[0],
        validators: [Validators.required]
      },
      {
        name: 'boxNumber',
        label: 'Box Number',
        type: 'number',
        initialValue: dto.boxNumber?.toString() || ''
      },
      {
        name: 'lotoBox',
        label: 'LOTO Box',
        type: 'select',
        initialValue: dto.lotoBox?.id,
        options: dto.lotoBox ? [{ value: dto.lotoBox.id, label: `Box #${dto.lotoBox.number}` }] : []
      },
      {
        name: 'isVerified',
        label: 'Is Verified',
        type: 'select',
        initialValue: (dto.isVerified ?? false).toString(),
        options: [
          { value: 'true', label: 'Yes' },
          { value: 'false', label: 'No' }
        ]
      },
      {
        name: 'locks',
        label: 'Locks',
        type: 'multi-select',
        initialValue: (dto.locks ?? []).map(l => l.id),
        options: (dto.locks ?? []).map(l => ({ value: l.id, label: `Lock #${l.number}` }))
      },
      {
        name: 'lotoPoints',
        label: 'Tags and Locks',
        type: 'form-array',
        // Flatten ValueDto -> string so the text inputs don't render "[object Object]".
        initialValue: (dto.lotoPoints ?? []).map((p: any) => ({
          ...p,
          isoPos: p?.isoPos?.name ?? p?.isoPos ?? '',
          normPos: p?.normPos?.name ?? p?.normPos ?? '',
        })),
        fields: [
          { name: 'tagNumber', label: 'Tag #', type: 'text' },
          { name: 'description', label: 'EID to be Tagged/Locked', type: 'text' },
          { name: 'specificLocation', label: 'Location', type: 'text' },
          { name: 'isoPos', label: 'LOTO Position', type: 'text' },
          { name: 'normPos', label: 'Released Position', type: 'text' },
          { name: 'hungBy', label: 'Hung By', type: 'text' },
          { name: 'verifiedBy', label: 'Verified By', type: 'text' },
          { name: 'zeroEnergyMethod', label: 'Zero Energy Verification', type: 'textarea' },
        ]
      }
    ];
    return fields;
  }
}
