
import { BaseDto, BaseModel } from '../base/base.model';
import { WorkRequestDto } from './work-request.model';
import { SafeWorkDto } from './safe-work.model';
import { HotWorkDto } from './hot-work.model';
import { ConfinedSpaceDto } from './confined-space.model';
import { EnergizedWorkPermitDto } from './energized-work-permit.model';
import { ExcavationPermitDto } from './excavation-permit.model';
import { VentingPermitDto } from './venting-permit.model';
import { LotoDto } from '../loto/loto.model';
import { ValueDto } from '../value.model';
import { Column } from '../column.model';

export interface PackageModification {
  timestamp: string;
  action: string;
  permitType: string | null;
  permitId: number | null;
  fieldName: string | null;
  oldValue: string | null;
  newValue: string | null;
  performedBy: string | null;
  description: string | null;
}

export interface DailyPermitPackageModel extends BaseModel {
  workRequests: WorkRequestDto[];
  safeWorks: SafeWorkDto[];
  hotWorks: HotWorkDto[];
  confinedSpaces: ConfinedSpaceDto[];
  lotos: LotoDto[];
  energizedWorkPermits: EnergizedWorkPermitDto[];
  excavationPermits: ExcavationPermitDto[];
  ventingPermits: VentingPermitDto[];
  safeWorkIds: number[];
  hotWorkIds: number[];
  lotoIds: number[];
  workRequestIds: number[];
  confinedSpaceIds: number[];
  energizedWorkPermitIds: number[];
  excavationPermitIds: number[];
  ventingPermitIds: number[];

  companyName: string | null;
  personName: string | null;
  date: string | null;
  time: string | null;
  permitNumber: string | null;
  packageStatus: ValueDto | null;
  modifications: PackageModification[];
}

export class DailyPermitPackageDto extends BaseDto implements DailyPermitPackageModel {
  workRequests: WorkRequestDto[];
  safeWorks: SafeWorkDto[];
  hotWorks: HotWorkDto[];
  confinedSpaces: ConfinedSpaceDto[];
  lotos: LotoDto[];
  energizedWorkPermits: EnergizedWorkPermitDto[];
  excavationPermits: ExcavationPermitDto[];
  ventingPermits: VentingPermitDto[];
  safeWorkIds: number[];
  hotWorkIds: number[];
  lotoIds: number[];
  workRequestIds: number[];
  confinedSpaceIds: number[];
  energizedWorkPermitIds: number[];
  excavationPermitIds: number[];
  ventingPermitIds: number[];

  companyName: string | null;
  personName: string | null;
  date: string | null;
  time: string | null;
  permitNumber: string | null;
  packageStatus: ValueDto | null;
  modifications: PackageModification[];

  constructor(data: Partial<DailyPermitPackageModel> = {}) {
    super(data);
    this.workRequests = data.workRequests?.map(wr => new WorkRequestDto(wr)) ?? [];
    this.safeWorks = data.safeWorks?.map(sw => new SafeWorkDto(sw)) ?? [];
    this.hotWorks = data.hotWorks?.map(hw => new HotWorkDto(hw)) ?? [];
    this.confinedSpaces = data.confinedSpaces?.map(cs => new ConfinedSpaceDto(cs)) ?? [];
    this.lotos = data.lotos?.map(loto => new LotoDto(loto)) ?? [];
    this.energizedWorkPermits = data.energizedWorkPermits?.map(e => new EnergizedWorkPermitDto(e)) ?? [];
    this.excavationPermits = data.excavationPermits?.map(e => new ExcavationPermitDto(e)) ?? [];
    this.ventingPermits = data.ventingPermits?.map(v => new VentingPermitDto(v)) ?? [];
    this.safeWorkIds = data.safeWorkIds?? [];
    this.hotWorkIds = data.hotWorkIds?? [];
    this.lotoIds = data.lotoIds?? [];
    this.workRequestIds = data.workRequestIds?? [];
    this.confinedSpaceIds = data.confinedSpaceIds?? [];
    this.energizedWorkPermitIds = data.energizedWorkPermitIds ?? [];
    this.excavationPermitIds = data.excavationPermitIds ?? [];
    this.ventingPermitIds = data.ventingPermitIds ?? [];
    this.companyName = data.companyName ?? null;
    this.personName = data.personName ?? null;
    this.date = data.date ?? null;
    this.time = data.time ?? null;
    this.permitNumber = data.permitNumber ?? null;
    this.packageStatus = data.packageStatus ? new ValueDto(data.packageStatus) : null;
    this.modifications = data.modifications ?? [];
  }

  override toJson(): any {
    return {
      ...super.toJson(),
      workRequests: this.workRequests.map(wr => wr.toJson()),
      safeWorks: this.safeWorks.map(sw => sw.toJson()),
      hotWorks: this.hotWorks.map(hw => hw.toJson()),
      confinedSpaces: this.confinedSpaces.map(cs => cs.toJson()),
      lotos: this.lotos.map(loto => loto.toJson()),
      energizedWorkPermits: this.energizedWorkPermits.map(e => e.toJson()),
      excavationPermits: this.excavationPermits.map(e => e.toJson()),
      ventingPermits: this.ventingPermits.map(v => v.toJson()),
      safeWorkIds: this.safeWorkIds,
      hotWorkIds: this.hotWorkIds,
      lotoIds: this.lotoIds,
      workRequestIds: this.workRequestIds,
      confinedSpaceIds: this.confinedSpaceIds,
      energizedWorkPermitIds: this.energizedWorkPermitIds,
      excavationPermitIds: this.excavationPermitIds,
      ventingPermitIds: this.ventingPermitIds,
      companyName: this.companyName,
      personName: this.personName,
      date: this.date,
      time: this.time,
      permitNumber: this.permitNumber,
      packageStatus: this.packageStatus?.toJson() ?? null,
      modifications: this.modifications,
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
      energizedWorkPermits: json.energizedWorkPermits?.map((e: any) => EnergizedWorkPermitDto.fromJson(e)) ?? [],
      excavationPermits: json.excavationPermits?.map((e: any) => ExcavationPermitDto.fromJson(e)) ?? [],
      ventingPermits: json.ventingPermits?.map((v: any) => VentingPermitDto.fromJson(v)) ?? [],
      safeWorkIds: json.safeWorkIds,
      hotWorkIds: json.hotWorkIds,
      lotoIds: json.lotoIds,
      workRequestIds: json.workRequestIds,
      confinedSpaceIds: json.confinedSpaceIds,
      energizedWorkPermitIds: json.energizedWorkPermitIds,
      excavationPermitIds: json.excavationPermitIds,
      ventingPermitIds: json.ventingPermitIds,
      companyName: json.companyName,
      personName: json.personName,
      date: json.date,
      time: json.time,
      permitNumber: json.permitNumber,
      packageStatus: json.packageStatus ? ValueDto.fromJson(json.packageStatus) : null,
      modifications: json.modifications ?? [],
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
      energizedWorkPermitIds: this.combineIdArrays(permitPackage.energizedWorkPermits, permitPackage.energizedWorkPermitIds),
      energizedWorkPermits: [],
      excavationPermitIds: this.combineIdArrays(permitPackage.excavationPermits, permitPackage.excavationPermitIds),
      excavationPermits: [],
      ventingPermitIds: this.combineIdArrays(permitPackage.ventingPermits, permitPackage.ventingPermitIds),
      ventingPermits: [],
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
      'energizedWorkPermits', 'excavationPermits', 'ventingPermits',
      'isVerified', 'name', 'objectType', 'companyName', 'personName', 'date', 'time',
      'permitNumber', 'packageStatus', 'modifications'
    ].includes(key);
  }

  static toTableColumns(
    fields: (keyof DailyPermitPackageModel)[] = ['id', 'name', 'permitNumber', 'workRequests', 'safeWorks', 'hotWorks', 'confinedSpaces', 'lotos']
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
      energizedWorkPermits: {
        id: 'energizedWorkPermits',
        header: 'Energized',
        accessorFn: (item: DailyPermitPackageDto) => item.energizedWorkPermits.length + ''
      },
      excavationPermits: {
        id: 'excavationPermits',
        header: 'Excavation',
        accessorFn: (item: DailyPermitPackageDto) => item.excavationPermits.length + ''
      },
      ventingPermits: {
        id: 'ventingPermits',
        header: 'Venting',
        accessorFn: (item: DailyPermitPackageDto) => item.ventingPermits.length + ''
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
      lotoIds: { id: 'lotoIds', header: 'LOTO IDs', accessorFn: (item: DailyPermitPackageDto) => item.lotoIds.join(', ') },
      energizedWorkPermitIds: { id: 'energizedWorkPermitIds', header: 'Energized IDs', accessorFn: (item: DailyPermitPackageDto) => item.energizedWorkPermitIds.join(', ') },
      excavationPermitIds: { id: 'excavationPermitIds', header: 'Excavation IDs', accessorFn: (item: DailyPermitPackageDto) => item.excavationPermitIds.join(', ') },
      ventingPermitIds: { id: 'ventingPermitIds', header: 'Venting IDs', accessorFn: (item: DailyPermitPackageDto) => item.ventingPermitIds.join(', ') },
      companyName: { id: 'companyName', header: 'Company Name', accessorKey: 'companyName' },
      personName: { id: 'personName', header: 'Person Name', accessorKey: 'personName' },
      date: { id: 'date', header: 'Date', accessorKey: 'date' },
      time: { id: 'time', header: 'Time', accessorKey: 'time' },
      permitNumber: { id: 'permitNumber', header: 'Permit #', accessorKey: 'permitNumber' },
      packageStatus: { id: 'packageStatus', header: 'Status', accessorFn: (item: DailyPermitPackageDto) => item.packageStatus?.name ?? '' },
      modifications: { id: 'modifications', header: 'Changes', accessorFn: (item: DailyPermitPackageDto) => item.modifications.length + '' },
    };

    return fields.map(fieldName => allColumns[fieldName]);
  }
}
