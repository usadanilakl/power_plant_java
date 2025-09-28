
import { BaseDto, BaseModel } from '../base/base.model';
import { WorkRequestDto } from './work-request.model';
import { SafeWorkDto } from './safe-work.model';
import { HotWorkDto } from './hot-work.model';
import { ConfinedSpaceDto } from './confined-space.model';
import { LotoDto } from '../loto/loto.model';
import { Column } from '../column.model';

export interface DailyPermitPackageModel extends BaseModel {
  workRequests: WorkRequestDto[];
  safeWorks: SafeWorkDto[];
  hotWorks: HotWorkDto[];
  confinedSpaces: ConfinedSpaceDto[];
  lotos: LotoDto[];
  safeWorkIds: number[];
  hotWorkIds: number[];
  lotoIds: number[];
  workRequestIds: number[];
  confinedSpaceIds: number[];
}

export class DailyPermitPackageDto extends BaseDto implements DailyPermitPackageModel {
  workRequests: WorkRequestDto[];
  safeWorks: SafeWorkDto[];
  hotWorks: HotWorkDto[];
  confinedSpaces: ConfinedSpaceDto[];
  lotos: LotoDto[];
  safeWorkIds: number[];
  hotWorkIds: number[]; 
  lotoIds: number[];
  workRequestIds: number[];
  confinedSpaceIds: number[];

  constructor(data: Partial<DailyPermitPackageModel> = {}) {
    super(data);
    this.workRequests = data.workRequests?.map(wr => new WorkRequestDto(wr)) ?? [];
    this.safeWorks = data.safeWorks?.map(sw => new SafeWorkDto(sw)) ?? [];
    this.hotWorks = data.hotWorks?.map(hw => new HotWorkDto(hw)) ?? [];
    this.confinedSpaces = data.confinedSpaces?.map(cs => new ConfinedSpaceDto(cs)) ?? [];
    this.lotos = data.lotos?.map(loto => new LotoDto(loto)) ?? [];
    this.safeWorkIds = data.safeWorkIds?? [];
    this.hotWorkIds = data.hotWorkIds?? [];
    this.lotoIds = data.lotoIds?? [];
    this.workRequestIds = data.workRequestIds?? [];
    this.confinedSpaceIds = data.confinedSpaceIds?? [];
  }

  override toJson(): any {
    return {
      ...super.toJson(),
      workRequests: this.workRequests.map(wr => wr.toJson()),
      safeWorks: this.safeWorks.map(sw => sw.toJson()),
      hotWorks: this.hotWorks.map(hw => hw.toJson()),
      confinedSpaces: this.confinedSpaces.map(cs => cs.toJson()),
      lotos: this.lotos.map(loto => loto.toJson()),
      safeWorkIds: this.safeWorkIds,
      hotWorkIds: this.hotWorkIds,
      lotoIds: this.lotoIds,
      workRequestIds: this.workRequestIds,
      confinedSpaceIds: this.confinedSpaceIds,
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
      safeWorkIds: json.safeWorkIds,
      hotWorkIds: json.hotWorkIds,
      lotoIds: json.lotoIds,
      workRequestIds: json.workRequestIds,
      confinedSpaceIds: json.confinedSpaceIds,
    });
  }
  static toIdModel(permitPackage: DailyPermitPackageDto) {
    return new DailyPermitPackageDto({
      ...permitPackage, 
      lotoIds: this.combineIdArrays(permitPackage.lotos, permitPackage.lotoIds), 
      lotos:[],
      workRequestIds: this.combineIdArrays(permitPackage.workRequests, permitPackage.workRequestIds), 
      workRequests: [],
      hotWorkIds: this.combineIdArrays(permitPackage.hotWorks, permitPackage.hotWorkIds), 
      hotWorks: [],
      confinedSpaceIds: this.combineIdArrays(permitPackage.confinedSpaces, permitPackage.confinedSpaceIds), 
      confinedSpaces: [],
    })
  }

  private static combineIdArrays(entities: any[], ids: number[]): number[] {
    const uniqueIds = new Set<number>();
    entities.forEach(entity => {
      if (entity.id) {
        uniqueIds.add(entity.id);
      }
    });
    ids.forEach(id => {
      uniqueIds.add(id);
    });
    return Array.from(uniqueIds);
  }

  static isValidKey(key: string): key is keyof DailyPermitPackageModel {
    return [
      'id', 'workRequests', 'safeWorks', 'hotWorks', 'confinedSpaces', 'lotos',
      'isVerified', 'name', 'objectType'
    ].includes(key);
  }

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
      objectType: { id: 'objectType', header: 'Object Type', accessorKey: 'objectType' },
      safeWorkIds: { id: 'workRequestIds', header: 'Work Request IDs', accessorFn: (item: DailyPermitPackageDto) => item.workRequestIds.join(', ') },
      workRequestIds: { id: 'workRequestIds', header: 'Work Request IDs', accessorFn: (item: DailyPermitPackageDto) => item.workRequestIds.join(', ') },
      hotWorkIds: { id: 'hotWorkIds', header: 'Hot Work IDs', accessorFn: (item: DailyPermitPackageDto) => item.hotWorkIds.join(', ') },
      confinedSpaceIds: { id: 'confinedSpaceIds', header: 'Confined Space IDs', accessorFn: (item: DailyPermitPackageDto) => item.confinedSpaceIds.join(', ') },
      lotoIds: { id: 'lotoIds', header: 'LOTO IDs', accessorFn: (item: DailyPermitPackageDto) => item.lotoIds.join(', ') }
    };

    return fields.map(fieldName => allColumns[fieldName]);
  }
}