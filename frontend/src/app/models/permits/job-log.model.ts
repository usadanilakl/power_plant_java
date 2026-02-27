
import { BaseDto, BaseModel } from '../base/base.model';
import { Column } from '../column.model';
import { FormField } from '../ui/form-field.model';
import { DailyPermitPackageDto } from './dailt-permit-package.model';
import { WorkRequestDto } from './work-request.model';
import { WorkAreaDto } from './work-area.model';
import { ValueDto } from '../value.model';

export type JobLogFieldName = keyof JobLogModel;

export interface JobLogModel extends BaseModel {
  packages: DailyPermitPackageDto[];
  workScope: string | null;
  company: string | null;
  foreman: string | null;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  permitNumber: string | null;
  jobStatus: ValueDto | null;
  originatingWorkRequest: WorkRequestDto | null;
  workArea: WorkAreaDto | null;
}

export class JobLogDto extends BaseDto implements JobLogModel {
  packages: DailyPermitPackageDto[];
  workScope: string | null;
  company: string | null;
  foreman: string | null;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  permitNumber: string | null;
  jobStatus: ValueDto | null;
  originatingWorkRequest: WorkRequestDto | null;
  workArea: WorkAreaDto | null;

  constructor(data: Partial<JobLogModel> = {}) {
    super(data);
    this.packages = data.packages?.map(p => new DailyPermitPackageDto(p)) ?? [];
    this.workScope = data.workScope ?? null;
    this.company = data.company ?? null;
    this.foreman = data.foreman ?? null;
    this.location = data.location ?? null;
    this.startDate = data.startDate ?? null;
    this.endDate = data.endDate ?? null;
    this.permitNumber = data.permitNumber ?? null;
    this.jobStatus = data.jobStatus ? new ValueDto(data.jobStatus) : null;
    this.originatingWorkRequest = data.originatingWorkRequest ? new WorkRequestDto(data.originatingWorkRequest) : null;
    this.workArea = data.workArea ? new WorkAreaDto(data.workArea) : null;
  }

  override toJson(): any {
    return {
      ...super.toJson(),
      packages: this.packages.map(p => p.toJson()),
      workScope: this.workScope,
      company: this.company,
      foreman: this.foreman,
      location: this.location,
      startDate: this.startDate,
      endDate: this.endDate,
      permitNumber: this.permitNumber,
      jobStatus: this.jobStatus?.toJson() ?? null,
      originatingWorkRequest: this.originatingWorkRequest?.toJson() ?? null,
      workArea: this.workArea?.toJson() ?? null,
    };
  }

  static override fromJson(json: any): JobLogDto {
    if (!json) return new JobLogDto();
    return new JobLogDto({
      ...super.fromJson(json),
      packages: json.packages?.map((p: any) => DailyPermitPackageDto.fromJson(p)) ?? [],
      workScope: json.workScope,
      company: json.company,
      foreman: json.foreman,
      location: json.location,
      startDate: json.startDate,
      endDate: json.endDate,
      permitNumber: json.permitNumber,
      jobStatus: json.jobStatus ? ValueDto.fromJson(json.jobStatus) : null,
      originatingWorkRequest: json.originatingWorkRequest ? WorkRequestDto.fromJson(json.originatingWorkRequest) : null,
      workArea: json.workArea ? WorkAreaDto.fromJson(json.workArea) : null,
    });
  }

  static toFormFields(
    fields: JobLogFieldName[] = ['company', 'foreman', 'location', 'startDate', 'endDate', 'workScope']
  ): FormField[] {
    const allFields: { [key in JobLogFieldName]?: FormField } = {
      company: { name: 'company', label: 'Company', type: 'text' },
      foreman: { name: 'foreman', label: 'Foreman', type: 'text' },
      location: { name: 'location', label: 'Location', type: 'text' },
      startDate: { name: 'startDate', label: 'Start Date', type: 'date' },
      endDate: { name: 'endDate', label: 'End Date', type: 'date' },
      workScope: { name: 'workScope', label: 'Work Scope', type: 'textarea' },
      permitNumber: { name: 'permitNumber', label: 'Job #', type: 'text', readonly: true },
    };
    return fields.map(f => allFields[f]).filter((f): f is FormField => f !== undefined);
  }

  static toTableColumns(
    fields: JobLogFieldName[] = ['id', 'permitNumber', 'company', 'foreman', 'location', 'startDate', 'jobStatus']
  ): Column[] {
    const allColumns: { [key in JobLogFieldName]?: Column } = {
      id: { id: 'id', header: 'ID', accessorKey: 'id' },
      name: { id: 'name', header: 'Name', accessorKey: 'name' },
      permitNumber: { id: 'permitNumber', header: 'Job #', accessorKey: 'permitNumber' },
      company: { id: 'company', header: 'Company', accessorKey: 'company' },
      foreman: { id: 'foreman', header: 'Foreman', accessorKey: 'foreman' },
      location: { id: 'location', header: 'Location', accessorKey: 'location' },
      startDate: { id: 'startDate', header: 'Start Date', accessorKey: 'startDate' },
      endDate: { id: 'endDate', header: 'End Date', accessorKey: 'endDate' },
      workScope: { id: 'workScope', header: 'Work Scope', accessorKey: 'workScope' },
      jobStatus: {
        id: 'jobStatus',
        header: 'Status',
        accessorFn: (item: JobLogDto) => item.jobStatus?.name ?? ''
      },
      packages: {
        id: 'packages',
        header: 'Packages',
        accessorFn: (item: JobLogDto) => item.packages.length + ''
      },
      originatingWorkRequest: {
        id: 'originatingWorkRequest',
        header: 'Work Request',
        accessorFn: (item: JobLogDto) => item.originatingWorkRequest?.name ?? ''
      },
      workArea: {
        id: 'workArea',
        header: 'Work Area',
        accessorFn: (item: JobLogDto) => item.workArea?.name ?? ''
      },
    };
    return fields.map(f => allColumns[f]).filter((c): c is Column => c !== undefined);
  }

  static isValidKey(key: string): key is keyof JobLogModel {
    return ['id', 'name', 'objectType', 'isVerified', 'packages', 'workScope', 'company',
      'foreman', 'location', 'startDate', 'endDate', 'permitNumber', 'jobStatus',
      'originatingWorkRequest', 'workArea'].includes(key);
  }
}
