import { Validators } from '@angular/forms';
import { BaseDto, BaseModel } from '../base/base.model';
import { FormField } from '../ui/form-field.model';
import { LotoPointDto } from './loto-point.model';
import { LotoStandardIdDto } from './loto-standard-id.model';
import { Column } from '../column.model';

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