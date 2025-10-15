import { BasePermitDto, BasePermitModel } from '../base/base-permit.model';
import { LotoPointDto } from './loto-point.model';
import { LockDto } from './lock.model';
import { LotoBoxDto } from './loto-box.model';
import { LotoIdDto } from './loto-id.model';
import { FormField } from '../ui/form-field.model';
import { Validators } from '@angular/forms';

export interface LotoModel extends BasePermitModel {
  lotoPoints: LotoPointDto[];
  locks: LockDto[];
  lotoBox: LotoBoxDto | null;
  boxNumber: number | null;
  equipmentSystem: string;
  lotoRequestor: string;
  date: string;
}

export class LotoDto extends BasePermitDto implements LotoModel {
  lotoPoints: LotoPointDto[];
  locks: LockDto[];
  lotoBox: LotoBoxDto | null;
  boxNumber: number | null;
  
  equipmentSystem: string;
  lotoRequestor: string;
  date: string;

  constructor(data: Partial<LotoModel> = {}) {
    super(data);
    this.lotoPoints = data.lotoPoints?.map(point => new LotoPointDto(point)) ?? [];
    this.locks = data.locks?.map(lock => new LockDto(lock)) ?? [];
    this.lotoBox = data.lotoBox ? new LotoBoxDto(data.lotoBox, true) : null;
    this.boxNumber = data.boxNumber || null;
    this.equipmentSystem = data.equipmentSystem || '';
    this.lotoRequestor = data.lotoRequestor || '';
    this.date = data.date || '';
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
      date: this.date
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
      date: json.date
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
        name: 'lotoPoints',
        label: 'LOTO Points',
        type: 'multi-select',
        initialValue: dto.lotoPoints.map(p => p.id),
        options: dto.lotoPoints.map(p => ({ value: p.id, label: `${p.tagNumber} - ${p.description}` }))
      },
      {
        name: 'locks',
        label: 'Locks',
        type: 'multi-select',
        initialValue: dto.locks.map(l => l.id),
        options: dto.locks.map(l => ({ value: l.id, label: `Lock #${l.number}` }))
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
        initialValue: dto.isVerified.toString(),
        options: [
          { value: 'true', label: 'Yes' },
          { value: 'false', label: 'No' }
        ]
      }, 
      {
        name: 'boxNumber',
        label: 'Box Number',
        type: 'number',
        initialValue: dto.boxNumber?.toString() || ''
      }
    ];
    return fields;
  }
}
