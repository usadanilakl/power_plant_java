import { Validators } from '@angular/forms';
import { BaseDto, BaseModel } from '../base/base.model';
import { FormField } from '../ui/form-field.model';
import { LotoPointDto } from './loto-point.model';
import { LotoStandardIdDto } from './loto-standard-id.model';

export type LotoStandardFieldName = keyof LotoStandardModel;

export interface LotoStandardModel extends BaseModel {
  description: string | null;
  lotoPoints: LotoPointDto[] | null;
}

export class LotoStandardDto extends BaseDto {
  description: string | null;
  lotoPoints: LotoPointDto[] | null;

  constructor(data: Partial<LotoStandardDto> = {}) {
    super(data);
    this.description = data.description || null;
    this.lotoPoints = data.lotoPoints?.map(point => new LotoPointDto(point)) || null;
  }

  // Serialization method
  override toJson(): any {
    return {
      ...super.toJson(),
      description: this.description,
      lotoPoints: this.lotoPoints?.map(point => point.toJson())
    };
  }

  // Deserialization method (static)
  static override fromJson(json: any): LotoStandardDto {
    return new LotoStandardDto({
      ...super.fromJson(json),
      description: json.description,
      lotoPoints: json.lotoPoints?.map((pointJson: any) => LotoPointDto.fromJson(pointJson)) || null
    });
  }

  toIdDto(): LotoStandardIdDto {
    const idDto =  new LotoStandardIdDto();
    idDto.id = this.id;
    idDto.name = this.name;
    idDto.description = this.description;
    idDto.lotoPointIds = this.lotoPoints?.map(point => point.id) || null;
    return idDto;
  }

  toFormFields(fields: LotoStandardFieldName[] = ['name','description','lotoPoints']): FormField[]{
    const allFields: {[key in LotoStandardFieldName ]: FormField} = {
      id: { name: 'id', label: 'ID', type: 'text', initialValue: this.id } as FormField,
      name: { name: 'name', label: 'Name', type: 'text', initialValue: this.name } as FormField,
      description: { name: 'description', label: 'Description', type: 'text', validators: [Validators.required], initialValue: this.description } as FormField,
      lotoPoints: { name: 'lotoPoints', label: 'Loto Points', type: 'multi-select', options: this.lotoPoints?.map(point => point.toOption()) || [] } as FormField,
      objectType: { name: 'objectType', label: 'Object Type', type: 'text', initialValue: 'Loto Standard' } as FormField,
      isVerified: { name: 'isVerified', label: 'Is Verified', type: 'select', options: [{}], initialValue: 'false' } as FormField
    }
    return fields.map(field => allFields[field]);
  }
  
}