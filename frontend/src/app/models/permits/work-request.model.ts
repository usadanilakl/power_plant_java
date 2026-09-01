
import { Validators } from '@angular/forms';
import { BaseDto, BaseModel } from '../base/base.model';
import { Option } from '../option.model';
import { FormField } from '../ui/form-field.model';
import { Column } from '../column.model';
import { ValueDto } from '../value.model';
import { WorkAreaDto } from './work-area.model';
import { SwHazards } from './safe-work.model';
import { HotWorkMeasures, HotWorkProfile, hotWorkTypeLabels } from './hot-work.model';
import { ConfinedSpaceHazards } from './confined-space.model';

/**
 * Model keys that can be rendered as a form field or a table column.
 *
 * <p>`workAreas` is excluded: it is structural data that decides how many permits get generated,
 * not something a single input or cell could show. Including it would force a meaningless entry in
 * both the field map and the column map for a value neither can render.
 *
 * <p>The submitter block is excluded for the same reason from the other direction: it is requester
 * PROVENANCE, recorded by the PWA and never edited here. Rendering it as an input would offer an
 * operator an editable field whose value `toJson()` deliberately discards.
 */
export type WorkRequestFieldName = Exclude<
  keyof WorkRequestModel,
  'workAreas' | 'timeSubmitted' | 'submitterName' | 'submitterEmail' | 'submitterPhone' | 'submitterCompany'
>;

/**
 * One work area a request covers, and what is planned there.
 *
 * <p>Wire shape of the backend `WorkRequestArea`. `workArea` above stays the primary one — this
 * decides how many Confined Space and Hot Work permits get generated.
 */
export interface WorkRequestAreaDto {
  id: number | null;
  name: string;
  primary: boolean;
  confinedSpaceEntry: boolean;
  spaceName: string | null;
  hotWork: boolean;
}

export interface WorkRequestModel extends BaseModel {
  dateOfWorkToBePerformed: string | null;
  timeOfWorkToBePerformed: string | null;
  requestedBy: string | null;
  company: string | null;
  location: string | null;
  affectedEquipment: string | null;
  workScope: string | null;
  isHotWorkRequired: boolean | null;
  foreman: string | null;
  fireWatch: string | null;
  isLotoRequired: boolean | null;
  isConfinedSpaceEntryRequired: boolean | null;
  space: string | null;
  sharepointId: string | null;
  localUuid: string | null;
  status: string | null;
  hasJha: boolean | null;
  attachmentCount: number | null;
  workCategory: ValueDto | null;
  workArea: WorkAreaDto | null;
  /** Every area covered. Empty means the single `workArea` above is the whole story. */
  workAreas: WorkRequestAreaDto[];
  dailyPermitPackageId: number | null;
  /** Derived server-side: no work area is set, so somebody has to pick one before permits. */
  areaNotSpecified: boolean | null;
  /** Job the grouping-key match suggests. Advisory — nothing is attached until an operator says so. */
  suggestedJobLogId: number | null;
  /** Hazards the requester declared on the request itself. Seeds the generated permits. */
  declaredHazards: SwHazards | null;
  declaredHotWorkMeasures: HotWorkMeasures | null;
  declaredConfinedSpaceHazards: ConfinedSpaceHazards | null;
  /** Type of hot work + Cr(VI) assessment, as declared by the requester. */
  hotWorkProfile: HotWorkProfile | null;
  /** Derived server-side: the worksheet's fume x chrome product. 0 when not assessed. */
  hotWorkExposureScore: number | null;

  /**
   * Who submitted the request and when — set by the PWA, read-only here.
   *
   * <p>Not the same as `requestedBy`/`company`, which name whoever the work is FOR. These name the
   * person who actually pressed submit, and are what an operator needs to ring somebody about it.
   */
  timeSubmitted: string | null;
  submitterName: string | null;
  submitterEmail: string | null;
  submitterPhone: string | null;
  submitterCompany: string | null;
}

export class WorkRequestDto extends BaseDto implements WorkRequestModel {
  dateOfWorkToBePerformed: string | null;
  timeOfWorkToBePerformed: string | null;
  requestedBy: string | null;
  company: string | null;
  location: string | null;
  affectedEquipment: string | null;
  workScope: string | null;
  isHotWorkRequired: boolean | null;
  foreman: string | null;
  fireWatch: string | null;
  isLotoRequired: boolean | null;
  isConfinedSpaceEntryRequired: boolean | null;
  space: string | null;
  sharepointId: string | null;
  localUuid: string | null;
  status: string | null;
  hasJha: boolean | null;
  attachmentCount: number | null;
  workCategory: ValueDto | null;
  workArea: WorkAreaDto | null;
  /** Every area covered. Empty means the single `workArea` above is the whole story. */
  workAreas: WorkRequestAreaDto[];
  dailyPermitPackageId: number | null;
  areaNotSpecified: boolean | null;
  suggestedJobLogId: number | null;
  declaredHazards: SwHazards | null;
  declaredHotWorkMeasures: HotWorkMeasures | null;
  declaredConfinedSpaceHazards: ConfinedSpaceHazards | null;
  hotWorkProfile: HotWorkProfile | null;
  hotWorkExposureScore: number | null;
  timeSubmitted: string | null;
  submitterName: string | null;
  submitterEmail: string | null;
  submitterPhone: string | null;
  submitterCompany: string | null;

  constructor(data: Partial<WorkRequestModel> = {}) {
    super(data);
    this.dateOfWorkToBePerformed = data.dateOfWorkToBePerformed ?? null;
    this.timeOfWorkToBePerformed = data.timeOfWorkToBePerformed ?? null;
    this.requestedBy = data.requestedBy ?? null;
    this.company = data.company ?? null;
    this.location = data.location ?? null;
    this.affectedEquipment = data.affectedEquipment ?? null;
    this.workScope = data.workScope ?? null;
    this.isHotWorkRequired = data.isHotWorkRequired ?? null;
    this.foreman = data.foreman ?? null;
    this.fireWatch = data.fireWatch ?? null;
    this.isLotoRequired = data.isLotoRequired ?? null;
    this.isConfinedSpaceEntryRequired = data.isConfinedSpaceEntryRequired ?? null;
    this.space = data.space ?? null;
    this.sharepointId = data.sharepointId ?? null;
    this.localUuid = data.localUuid ?? null;
    this.status = data.status ?? null;
    this.hasJha = data.hasJha ?? null;
    this.attachmentCount = data.attachmentCount ?? null;
    this.workCategory = data.workCategory ? new ValueDto(data.workCategory) : null;
    this.workArea = data.workArea ? new WorkAreaDto(data.workArea) : null;
    this.workAreas = data.workAreas ?? [];
    this.dailyPermitPackageId = data.dailyPermitPackageId ?? null;
    this.areaNotSpecified = data.areaNotSpecified ?? null;
    this.suggestedJobLogId = data.suggestedJobLogId ?? null;
    this.declaredHazards = data.declaredHazards ? new SwHazards(data.declaredHazards) : null;
    this.declaredHotWorkMeasures = data.declaredHotWorkMeasures ? new HotWorkMeasures(data.declaredHotWorkMeasures) : null;
    this.declaredConfinedSpaceHazards = data.declaredConfinedSpaceHazards
      ? new ConfinedSpaceHazards(data.declaredConfinedSpaceHazards)
      : null;
    this.hotWorkProfile = data.hotWorkProfile ? new HotWorkProfile(data.hotWorkProfile) : null;
    this.hotWorkExposureScore = data.hotWorkExposureScore ?? null;
    this.timeSubmitted = data.timeSubmitted ?? null;
    this.submitterName = data.submitterName ?? null;
    this.submitterEmail = data.submitterEmail ?? null;
    this.submitterPhone = data.submitterPhone ?? null;
    this.submitterCompany = data.submitterCompany ?? null;
  }

  // Serialization method
  override toJson(): any {
    return {
      ...super.toJson(),
      dateOfWorkToBePerformed: this.dateOfWorkToBePerformed,
      timeOfWorkToBePerformed: this.timeOfWorkToBePerformed,
      requestedBy: this.requestedBy,
      company: this.company,
      location: this.location,
      affectedEquipment: this.affectedEquipment,
      workScope: this.workScope,
      isHotWorkRequired: this.isHotWorkRequired,
      foreman: this.foreman,
      fireWatch: this.fireWatch,
      isLotoRequired: this.isLotoRequired,
      isConfinedSpaceEntryRequired: this.isConfinedSpaceEntryRequired,
      space: this.space,
      sharepointId: this.sharepointId,
      localUuid: this.localUuid,
      status: this.status,
      hasJha: this.hasJha,
      attachmentCount: this.attachmentCount,
      workCategory: this.workCategory?.toJson() ?? null,
      workArea: this.workArea?.toJson() ?? null,
      workAreas: this.workAreas ?? [],
      dailyPermitPackageId: this.dailyPermitPackageId,
      // areaNotSpecified is derived server-side and never sent back — including it would invite a
      // reader to treat it as settable.
      suggestedJobLogId: this.suggestedJobLogId,
      declaredHazards: this.declaredHazards ? { ...this.declaredHazards } : null,
      declaredHotWorkMeasures: this.declaredHotWorkMeasures ? { ...this.declaredHotWorkMeasures } : null,
      declaredConfinedSpaceHazards: this.declaredConfinedSpaceHazards ? { ...this.declaredConfinedSpaceHazards } : null,
      hotWorkProfile: this.hotWorkProfile ? { ...this.hotWorkProfile } : null,
      // hotWorkExposureScore is derived server-side and never sent back.
    };
  }

  // Deserialization method (static)
  /**
   * "3 ticked" / "" for a hazard block, for table cells. Counting rather than listing keeps the
   * column narrow; the full list is on the work request detail dialog.
   */
  static countTicked(source: any): string {
    if (!source) return '';
    const count = Object.values(source).filter(v => v === true).length;
    return count > 0 ? `${count} ticked` : '';
  }

  static override fromJson(json: any): WorkRequestDto {
    return new WorkRequestDto({
      ...super.fromJson(json),
      dateOfWorkToBePerformed: json.dateOfWorkToBePerformed|| null,
      timeOfWorkToBePerformed: json.timeOfWorkToBePerformed || null,
      requestedBy: json.requestedBy || null,
      company: json.company || null,
      location: json.location || null,
      affectedEquipment: json.affectedEquipment || null,
      workScope: json.workScope || null,
      isHotWorkRequired: json.isHotWorkRequired || null,
      foreman: json.foreman || null,
      fireWatch: json.fireWatch || null,
      isLotoRequired: json.isLotoRequired || null,
      isConfinedSpaceEntryRequired: json.isConfinedSpaceEntryRequired || null,
      space: json.space || null,
      sharepointId: json.sharepointId || null,
      localUuid: json.localUuid || null,
      status: json.status || null,
      hasJha: json.hasJha ?? null,
      attachmentCount: json.attachmentCount ?? null,
      timeSubmitted: json.timeSubmitted || null,
      submitterName: json.submitterName || null,
      submitterEmail: json.submitterEmail || null,
      submitterPhone: json.submitterPhone || null,
      submitterCompany: json.submitterCompany || null,
      workCategory: json.workCategory ? ValueDto.fromJson(json.workCategory) : null,
      workArea: json.workArea ? WorkAreaDto.fromJson(json.workArea) : null,
      workAreas: json.workAreas ?? [],
      dailyPermitPackageId: json.dailyPermitPackageId ?? null,
      areaNotSpecified: json.areaNotSpecified ?? null,
      suggestedJobLogId: json.suggestedJobLogId ?? null,
      declaredHazards: json.declaredHazards ? new SwHazards(json.declaredHazards) : null,
      declaredHotWorkMeasures: json.declaredHotWorkMeasures ? new HotWorkMeasures(json.declaredHotWorkMeasures) : null,
      declaredConfinedSpaceHazards: json.declaredConfinedSpaceHazards
        ? new ConfinedSpaceHazards(json.declaredConfinedSpaceHazards)
        : null,
      hotWorkProfile: json.hotWorkProfile ? new HotWorkProfile(json.hotWorkProfile) : null,
      hotWorkExposureScore: json.hotWorkExposureScore ?? null,
    });
  }

  // Method to check if a key is valid for this model
  static isValidKey(key: string): key is keyof WorkRequestModel {
    return [
      'id', 'dateOfWorkToBePerformed', 'timeOfWorkToBePerformed', 'requestedBy',
      'company', 'location', 'affectedEquipment', 'workScope', 'isHotWorkRequired',
      'foreman', 'fireWatch', 'isLotoRequired', 'isConfinedSpaceEntryRequired',
      'workArea',
      'space', 'sharepointId', 'localUuid', 'status', 'hasJha', 'attachmentCount', 'workCategory', 'isVerified', 'name', 'objectType'
    ].includes(key);
  }
  static toFormFields(
    dto: WorkRequestDto,
    // companyOptions: Option[],
    locationOptions: Option[],
    fields: WorkRequestFieldName[] = [
      'dateOfWorkToBePerformed', 'timeOfWorkToBePerformed', 'requestedBy',
      'company', 'location', 'affectedEquipment', 'workScope', 'isHotWorkRequired',
      'foreman', 'fireWatch', 'isLotoRequired', 'isConfinedSpaceEntryRequired', 'space'
    ]
  ): FormField[] {
    const allFields: { [key in WorkRequestFieldName]: FormField } = {
      id: { name: 'id', label: 'ID', type: 'text', initialValue: dto.id },
      dateOfWorkToBePerformed: {
        name: 'dateOfWorkToBePerformed',
        label: 'Date of Work',
        type: 'date',
        validators: [Validators.required],
        initialValue: dto.dateOfWorkToBePerformed ?? new Date().toISOString().split('T')[0]
      },
      timeOfWorkToBePerformed: {
        name: 'timeOfWorkToBePerformed',
        label: 'Time of Work',
        type: 'time',
        validators: [Validators.required],
        initialValue: dto.timeOfWorkToBePerformed ?? new Date().toTimeString().slice(0, 5)
      },
      requestedBy: {
        name: 'requestedBy',
        label: 'Requested By',
        type: 'text',
        validators: [Validators.required],
        initialValue: dto.requestedBy
      },
      company: {
        name: 'company',
        label: 'Company',
        type: 'text',
        // options: companyOptions,
        validators: [Validators.required],
        initialValue: dto.company
      },
      location: {
        name: 'location',
        label: 'Location',
        type: 'text',
        options: locationOptions,
        validators: [Validators.required],
        initialValue: dto.location
      },
      affectedEquipment: {
        name: 'affectedEquipment',
        label: 'Affected Equipment',
        type: 'text',
        validators: [Validators.required],
        initialValue: dto.affectedEquipment
      },
      workScope: {
        name: 'workScope',
        label: 'Detailed Work Scope',
        type: 'text',
        validators: [Validators.required],
        initialValue: dto.workScope
      },
      isHotWorkRequired: {
        name: 'isHotWorkRequired',
        label: 'Is Hot Work Required',
        type: 'checkbox',
        initialValue: dto.isHotWorkRequired
      },
      foreman: {
        name: 'foreman',
        label: 'Foreman Name',
        type: 'text',
        initialValue: dto.foreman
      },
      fireWatch: {
        name: 'fireWatch',
        label: 'Fire-watch Name',
        type: 'text',
        initialValue: dto.fireWatch
      },
      isLotoRequired: {
        name: 'isLotoRequired',
        label: 'Is LOTO Required',
        type: 'checkbox',
        initialValue: dto.isLotoRequired
      },
      isConfinedSpaceEntryRequired: {
        name: 'isConfinedSpaceEntryRequired',
        label: 'Is Confined Space Entry Required',
        type: 'checkbox',
        initialValue: dto.isConfinedSpaceEntryRequired
      },
      workArea: {
        name: 'workArea',
        label: 'Work Area',
        type: 'text',
        readonly: true,
        initialValue: dto.workArea?.name ?? ''
      },
      space: {
        name: 'space',
        label: 'Space to be entered',
        type: 'text',
        initialValue: dto.space
      },
      sharepointId: {
        name: 'sharepointId',
        label: 'Sharepoint ID',
        type: 'text',
        initialValue: dto.sharepointId
      },
      localUuid: {
        name: 'localUuid',
        label: 'Local UUID',
        type: 'text',
        readonly: true,
        initialValue: dto.localUuid
      },
      status: {
        name: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { value: 'Active', label: 'Active' },
          { value: 'Expired', label: 'Expired' },
          { value: 'Closed', label: 'Closed' },
          { value: 'Archived', label: 'Archived' }
        ],
        initialValue: dto.status ?? 'Active'
      },
      isVerified: {
        name: 'isVerified',
        label: 'Is Verified',
        type: 'select',
        options: [
          { value: 'true', label: 'Yes' },
          { value: 'false', label: 'No' }
        ],
        initialValue: dto.isVerified?.toString()
      },
      name: { name: 'name', label: 'Name', type: 'text', initialValue: dto.name },
      objectType: { name: 'objectType', label: 'Object Type', type: 'text', initialValue: dto.objectType },
      hasJha: { name: 'hasJha', label: 'Has JHA', type: 'checkbox', initialValue: dto.hasJha },
      attachmentCount: { name: 'attachmentCount', label: 'Attachments', type: 'text', readonly: true, initialValue: dto.attachmentCount },
      workCategory: { name: 'workCategory', label: 'Main Work Scope', type: 'text', readonly: true, initialValue: dto.workCategory?.name ?? '' },
      dailyPermitPackageId: { name: 'dailyPermitPackageId', label: 'Package ID', type: 'text', readonly: true, initialValue: dto.dailyPermitPackageId },
      // Read-only on the operator form. areaNotSpecified is derived server-side, the job suggestion
      // is resolved in the Process dialog, and the hazard blocks belong to the requester - an
      // operator edits those on the generated permits, not by rewriting what was declared.
      areaNotSpecified: { name: 'areaNotSpecified', label: 'Area Not Set', type: 'text', readonly: true, initialValue: dto.areaNotSpecified },
      suggestedJobLogId: { name: 'suggestedJobLogId', label: 'Suggested Job', type: 'text', readonly: true, initialValue: dto.suggestedJobLogId },
      declaredHazards: { name: 'declaredHazards', label: 'Declared Hazards', type: 'text', readonly: true, initialValue: dto.declaredHazards },
      declaredHotWorkMeasures: { name: 'declaredHotWorkMeasures', label: 'Declared Hot Work Precautions', type: 'text', readonly: true, initialValue: dto.declaredHotWorkMeasures },
      declaredConfinedSpaceHazards: { name: 'declaredConfinedSpaceHazards', label: 'Declared Confined Space Hazards', type: 'text', readonly: true, initialValue: dto.declaredConfinedSpaceHazards },
      hotWorkProfile: { name: 'hotWorkProfile', label: 'Hot Work Profile', type: 'text', readonly: true, initialValue: dto.hotWorkProfile },
      hotWorkExposureScore: { name: 'hotWorkExposureScore', label: 'Cr(VI) Exposure Score', type: 'text', readonly: true, initialValue: dto.hotWorkExposureScore },
    };

    return fields.map(fieldName => allFields[fieldName]);
  }

  static toTableColumns(fields: WorkRequestFieldName[] = ['status', 'dateOfWorkToBePerformed', 'requestedBy', 'company', 'location', 'isHotWorkRequired', 'isLotoRequired', 'isConfinedSpaceEntryRequired']): Column[] {
    const allColumns: { [key in WorkRequestFieldName]: Column } = {
      id: { id: 'id', header: 'ID', accessorKey: 'id' },
      dateOfWorkToBePerformed: { id: 'dateOfWorkToBePerformed', header: 'Date of Work', accessorKey: 'dateOfWorkToBePerformed' },
      timeOfWorkToBePerformed: { id: 'timeOfWorkToBePerformed', header: 'Time of Work', accessorKey: 'timeOfWorkToBePerformed' },
      requestedBy: { id: 'requestedBy', header: 'Requested By', accessorKey: 'requestedBy' },
      company: { id: 'company', header: 'Company', accessorKey: 'company' },
      location: { id: 'location', header: 'Location', accessorKey: 'location' },
      affectedEquipment: { id: 'affectedEquipment', header: 'Affected Equipment', accessorKey: 'affectedEquipment' },
      workScope: { id: 'workScope', header: 'Detailed Work Scope', accessorKey: 'workScope' },
        isHotWorkRequired: {
        id: 'isHotWorkRequired',
        header: 'Hot Work Required',
        accessorFn: (item: WorkRequestDto) => item.isHotWorkRequired ? 'Yes' : 'No',
        conditionalStyling: (item: any, column: Column) =>
            item.isHotWorkRequired ? { 'background-color': 'var(--status-attention)', 'color': 'var(--primary-text)' } : { 'background-color': '', 'color': '' }
        },
      foreman: { id: 'foreman', header: 'Foreman', accessorKey: 'foreman' },
      fireWatch: { id: 'fireWatch', header: 'Fire Watch', accessorKey: 'fireWatch' },
        isLotoRequired: {
        id: 'isLotoRequired',
        header: 'LOTO Required',
        accessorFn: (item: WorkRequestDto) => item.isLotoRequired ? 'Yes' : 'No',
        conditionalStyling: (item: any, column: Column) =>
            item.isLotoRequired ? { 'background-color': 'var(--status-attention)', 'color': 'var(--primary-text)' } : { 'background-color': '', 'color': '' }
        },
        isConfinedSpaceEntryRequired: {
        id: 'isConfinedSpaceEntryRequired',
        header: 'Confined Space Entry',
        accessorFn: (item: WorkRequestDto) => item.isConfinedSpaceEntryRequired ? 'Yes' : 'No',
        conditionalStyling: (item: any, column: Column) =>
            item.isConfinedSpaceEntryRequired ? { 'background-color': 'var(--status-attention)', 'color': 'var(--primary-text)' } : { 'background-color': '', 'color': '' }
        },
      workArea: {
        id: 'workArea',
        header: 'Work Area',
        accessorFn: (item: WorkRequestDto) => item.workArea?.name ?? '',
      },
      space: { id: 'space', header: 'Space', accessorKey: 'space' },
      sharepointId: {
        id: 'sharepointId',
        header: 'Sharepoint ID',
        accessorFn: (item: WorkRequestDto) => {
          if (!item.sharepointId) return '';
          const timestamp = item.sharepointId;
          const year = timestamp.slice(0, 4);
          const month = timestamp.slice(4, 6);
          const day = timestamp.slice(6, 8);
          const hour = timestamp.slice(8, 10);
          const minute = timestamp.slice(10, 12);
          const second = timestamp.slice(12, 14);
          return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
        }
      },
      localUuid: { id: 'localUuid', header: 'Local UUID', accessorKey: 'localUuid' },
      status: {
        id: 'status',
        header: 'Status',
        accessorKey: 'status',
        conditionalStyling: (item: any, column: Column) => {
          if (item.status === 'Active') return { 'background-color': 'var(--status-complete)', 'color': 'var(--primary-text)' };
          if (item.status === 'Expired') return { 'background-color': 'var(--status-attention)', 'color': 'var(--primary-text)' };
          if (item.status === 'Closed') return { 'background-color': 'var(--status-not-processed)', 'color': 'var(--primary-text)' };
          if (item.status === 'Archived') return { 'background-color': 'var(--status-incomplete)', 'color': 'var(--primary-text)' };
          return { 'background-color': '', 'color': '' };
        }
      },
      name: { id: 'name', header: 'Name', accessorKey: 'name' },
      objectType: { id: 'objectType', header: 'Object Type', accessorKey: 'objectType' },
        isVerified: {
        id: 'isVerified',
        header: 'Verified',
        accessorFn: (item: WorkRequestDto) => item.isVerified ? 'Yes' : 'No',
        conditionalStyling: (item: any, column: Column) =>
            item.isVerified ? { 'background-color': 'var(--status-complete)', 'color': 'var(--primary-text)' } : { 'background-color': 'var(--status-attention)', 'color': 'var(--primary-text)' }
        },
      hasJha: {
        id: 'hasJha', header: 'JHA', accessorKey: 'hasJha',
        accessorFn: (item: WorkRequestDto) => item.hasJha ? 'Yes' : 'No',
      },
      attachmentCount: {
        id: 'attachmentCount', header: 'Attachments', accessorKey: 'attachmentCount',
        accessorFn: (item: WorkRequestDto) => item.attachmentCount ? `${item.attachmentCount}` : '0',
      },
      workCategory: {
        id: 'workCategory', header: 'Main Work Scope',
        accessorFn: (item: WorkRequestDto) => item.workCategory?.name ?? '',
      },
      dailyPermitPackageId: { id: 'dailyPermitPackageId', header: 'Package ID', accessorKey: 'dailyPermitPackageId' },
      areaNotSpecified: {
        id: 'areaNotSpecified',
        header: 'Area Set?',
        accessorFn: (item: WorkRequestDto) => (item.areaNotSpecified ? 'Not set' : 'Set'),
        conditionalStyling: (item: any) =>
          item.areaNotSpecified
            ? { 'background-color': 'var(--status-attention)', 'color': 'var(--primary-text)' }
            : { 'background-color': '', 'color': '' }
      },
      suggestedJobLogId: { id: 'suggestedJobLogId', header: 'Suggested Job', accessorKey: 'suggestedJobLogId' },
      declaredHazards: {
        id: 'declaredHazards',
        header: 'Declared Hazards',
        accessorFn: (item: WorkRequestDto) => WorkRequestDto.countTicked(item.declaredHazards),
      },
      declaredHotWorkMeasures: {
        id: 'declaredHotWorkMeasures',
        header: 'Declared Hot Work Precautions',
        accessorFn: (item: WorkRequestDto) => WorkRequestDto.countTicked(item.declaredHotWorkMeasures),
      },
      declaredConfinedSpaceHazards: {
        id: 'declaredConfinedSpaceHazards',
        header: 'Declared Confined Space Hazards',
        accessorFn: (item: WorkRequestDto) => WorkRequestDto.countTicked(item.declaredConfinedSpaceHazards),
      },
      hotWorkProfile: {
        id: 'hotWorkProfile',
        header: 'Hot Work Type',
        accessorFn: (item: WorkRequestDto) => hotWorkTypeLabels(item.hotWorkProfile).join(', '),
      },
      hotWorkExposureScore: {
        id: 'hotWorkExposureScore',
        header: 'Cr(VI) Score',
        accessorFn: (item: WorkRequestDto) => (item.hotWorkExposureScore ? String(item.hotWorkExposureScore) : ''),
      },
    };

    return fields.map(fieldName => allColumns[fieldName]);
  }

  getDate(): string {
    if (!this.dateOfWorkToBePerformed) {
      return '';
    }
    // Split the ISO string at 'T' and take the first part (date)
    return this.dateOfWorkToBePerformed.split('T')[0];
  }

}
