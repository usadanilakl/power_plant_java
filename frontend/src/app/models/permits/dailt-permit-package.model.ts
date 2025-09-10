
import { BaseDto, BaseModel } from '../base/base.model';
import { WorkRequestDto } from './work-request.model';
import { SafeWorkDto } from './safe-work.model';
import { HotWorkDto } from './hot-work.model';
import { ConfinedSpaceDto } from './confined-space.model';
import { LotoDto } from '../loto/loto.model';
import { Column } from '../column.model';
import { FormField } from '../ui/form-field.model';

export interface DailyPermitPackageModel extends BaseModel {
  workRequests: WorkRequestDto[];
  safeWorks: SafeWorkDto[];
  hotWorks: HotWorkDto[];
  confinedSpaces: ConfinedSpaceDto[];
  lotos: LotoDto[];
}

export class DailyPermitPackageDto extends BaseDto implements DailyPermitPackageModel {
  workRequests: WorkRequestDto[];
  safeWorks: SafeWorkDto[];
  hotWorks: HotWorkDto[];
  confinedSpaces: ConfinedSpaceDto[];
  lotos: LotoDto[];

  constructor(data: Partial<DailyPermitPackageModel> = {}) {
    super(data);
    this.workRequests = data.workRequests?.map(wr => new WorkRequestDto(wr)) ?? [];
    this.safeWorks = data.safeWorks?.map(sw => new SafeWorkDto(sw)) ?? [];
    this.hotWorks = data.hotWorks?.map(hw => new HotWorkDto(hw)) ?? [];
    this.confinedSpaces = data.confinedSpaces?.map(cs => new ConfinedSpaceDto(cs)) ?? [];
    this.lotos = data.lotos?.map(loto => new LotoDto(loto)) ?? [];
  }

  override toJson(): any {
    return {
      ...super.toJson(),
      workRequests: this.workRequests.map(wr => wr.toJson()),
      safeWorks: this.safeWorks.map(sw => sw.toJson()),
      hotWorks: this.hotWorks.map(hw => hw.toJson()),
      confinedSpaces: this.confinedSpaces.map(cs => cs.toJson()),
      lotos: this.lotos.map(loto => loto.toJson()),
    };
  }

  static override fromJson(json: any): DailyPermitPackageDto {
    return new DailyPermitPackageDto({
      ...super.fromJson(json),
      workRequests: json.workRequests?.map((wr: any) => WorkRequestDto.fromJson(wr)) ?? [],
      safeWorks: json.safeWorks?.map((sw: any) => SafeWorkDto.fromJson(sw)) ?? [],
      hotWorks: json.hotWorks?.map((hw: any) => HotWorkDto.fromJson(hw)) ?? [],
      confinedSpaces: json.confinedSpaces?.map((cs: any) => ConfinedSpaceDto.fromJson(cs)) ?? [],
      lotos: json.lotos?.map((loto: any) => LotoDto.fromJson(loto)) ?? [],
    });
  }

  static isValidKey(key: string): key is keyof DailyPermitPackageModel {
    return [
      'id', 'workRequests', 'safeWorks', 'hotWorks', 'confinedSpaces', 'lotos',
      'isVerified', 'name', 'objectType'
    ].includes(key);
  }

//   static toFormFields(
//     dto: DailyPermitPackageDto,
//     fields: (keyof DailyPermitPackageModel)[] = ['workRequests', 'safeWorks', 'hotWorks', 'confinedSpaces', 'lotos']
//   ): FormField[] {
//     const allFields: { [key in keyof DailyPermitPackageModel]: FormField } = {
//       id: { name: 'id', label: 'ID', type: 'text', initialValue: dto.id },
//       workRequests: { 
//         name: 'workRequests', 
//         label: 'Work Requests', 
//         type: 'array', 
//         initialValue: dto.workRequests,
//         validators: [Validators.required, Validators.minLength(1)]
//       },
//       safeWorks: { 
//         name: 'safeWorks', 
//         label: 'Safe Works', 
//         type: 'array', 
//         initialValue: dto.safeWorks,
//         validators: [Validators.required, Validators.minLength(1)]
//       },
//       hotWorks: { 
//         name: 'hotWorks', 
//         label: 'Hot Works', 
//         type: 'array', 
//         initialValue: dto.hotWorks 
//       },
//       confinedSpaces: { 
//         name: 'confinedSpaces', 
//         label: 'Confined Spaces', 
//         type: 'array', 
//         initialValue: dto.confinedSpaces 
//       },
//       lotos: { 
//         name: 'lotos', 
//         label: 'LOTOs', 
//         type: 'array', 
//         initialValue: dto.lotos 
//       },
//       isVerified: { 
//         name: 'isVerified', 
//         label: 'Is Verified', 
//         type: 'checkbox', 
//         initialValue: dto.isVerified 
//       },
//       name: { name: 'name', label: 'Name', type: 'text', initialValue: dto.name },
//       objectType: { name: 'objectType', label: 'Object Type', type: 'text', initialValue: dto.objectType }
//     };

//     return fields.map(fieldName => allFields[fieldName]);
//   }

  static toTableColumns(
    fields: (keyof DailyPermitPackageModel)[] = ['id', 'name', 'workRequests', 'safeWorks', 'hotWorks', 'confinedSpaces', 'lotos']
  ): Column[] {
    const allColumns: { [key in keyof DailyPermitPackageModel]: Column } = {
      id: { id: 'id', header: 'ID', accessorKey: 'id' },
      workRequests: { 
        id: 'workRequests', 
        header: 'Work Requests', 
        accessorFn: (item: DailyPermitPackageDto) => item.workRequests.length + ''
      },
      safeWorks: { 
        id: 'safeWorks', 
        header: 'Safe Works', 
        accessorFn: (item: DailyPermitPackageDto) => item.safeWorks.length  + ''
      },
      hotWorks: { 
        id: 'hotWorks', 
        header: 'Hot Works', 
        accessorFn: (item: DailyPermitPackageDto) => item.hotWorks.length  + ''
      },
      confinedSpaces: { 
        id: 'confinedSpaces', 
        header: 'Confined Spaces', 
        accessorFn: (item: DailyPermitPackageDto) => item.confinedSpaces.length  + ''
      },
      lotos: { 
        id: 'lotos', 
        header: 'LOTOs', 
        accessorFn: (item: DailyPermitPackageDto) => item.lotos.length  + ''
      },
      isVerified: { 
        id: 'isVerified', 
        header: 'Verified', 
        accessorFn: (item: DailyPermitPackageDto) => item.isVerified ? 'Yes' : 'No' 
      },
      name: { id: 'name', header: 'Name', accessorKey: 'name' },
      objectType: { id: 'objectType', header: 'Object Type', accessorKey: 'objectType' }
    };

    return fields.map(fieldName => allColumns[fieldName]);
  }
}