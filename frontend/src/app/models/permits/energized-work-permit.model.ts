
import { Validators } from '@angular/forms';
import { BaseDto, BaseModel } from '../base/base.model';
import { Column } from '../column.model';
import { FormField } from '../ui/form-field.model';
import { WorkAreaDto } from './work-area.model';
import { WorkRequestDto } from './work-request.model';

export class EnergizedWorkChecklist {
  // Section 2 text fields
  jobDescription: string = '';
  safeWorkPractices: string = '';
  shockHazardAnalysis: string = '';
  flashProtectionBoundary: string = '';
  meansToRestrictAccess: string = '';
  // Item 3 sub-items (shock hazard boundaries) - text values
  limitedApproachBoundary: string = '';
  restrictedApproachBoundary: string = '';
  prohibitedApproachBoundary: string = '';
  // Item 4 sub-items (flash protection) - text values
  incidentEnergy: string = '';
  arcFlashPpe: string = '';
  arcFlashBoundary: string = '';
  // Checkboxes
  jobDescriptionComplete: boolean = false;
  safeWorkPracticesComplete: boolean = false;
  shockHazardAnalysisComplete: boolean = false;
  limitedApproachBoundaryComplete: boolean = false;
  restrictedApproachBoundaryComplete: boolean = false;
  prohibitedApproachBoundaryComplete: boolean = false;
  incidentEnergyComplete: boolean = false;
  arcFlashPpeComplete: boolean = false;
  arcFlashBoundaryComplete: boolean = false;
  meansToRestrictAccessComplete: boolean = false;
  preJobBriefComplete: boolean = false;
  constructor(data: Partial<EnergizedWorkChecklist> = {}) { Object.assign(this, data); }
}

export type EnergizedWorkPermitFieldName = keyof EnergizedWorkPermitModel;

export interface EnergizedWorkPermitModel extends BaseModel {
  date: string | null;
  time: string | null;
  location: string | null;
  issuedTo: string | null;
  workScope: string | null;
  redTagNum: string | null;
  permitNumber: string | null;
  workArea: WorkAreaDto | null;
  workOrder: string | null;
  circuitDescription: string | null;
  workDescription: string | null;
  justification: string | null;
  requester: string | null;
  requesterDate: string | null;
  qualifiedPersonSignature: string | null;
  qualifiedPersonDate: string | null;
  plantManagerSignature: string | null;
  plantManagerDate: string | null;
  workCanBePerformedSafely: boolean;
  checklist: EnergizedWorkChecklist | null;
}

export class EnergizedWorkPermitDto extends BaseDto implements EnergizedWorkPermitModel {
  date: string | null;
  time: string | null;
  location: string | null;
  issuedTo: string | null;
  workScope: string | null;
  redTagNum: string | null;
  permitNumber: string | null;
  workArea: WorkAreaDto | null;
  workOrder: string | null;
  circuitDescription: string | null;
  workDescription: string | null;
  justification: string | null;
  requester: string | null;
  requesterDate: string | null;
  qualifiedPersonSignature: string | null;
  qualifiedPersonDate: string | null;
  plantManagerSignature: string | null;
  plantManagerDate: string | null;
  workCanBePerformedSafely: boolean;
  checklist: EnergizedWorkChecklist | null;

  constructor(data: Partial<EnergizedWorkPermitModel> = {}) {
    super(data);
    this.date = data.date ?? null;
    this.time = data.time ?? null;
    this.location = data.location ?? null;
    this.issuedTo = data.issuedTo ?? null;
    this.workScope = data.workScope ?? null;
    this.redTagNum = data.redTagNum ?? null;
    this.permitNumber = data.permitNumber ?? null;
    this.workArea = data.workArea ? new WorkAreaDto(data.workArea) : null;
    this.workOrder = data.workOrder ?? null;
    this.circuitDescription = data.circuitDescription ?? null;
    this.workDescription = data.workDescription ?? null;
    this.justification = data.justification ?? null;
    this.requester = data.requester ?? null;
    this.requesterDate = data.requesterDate ?? null;
    this.qualifiedPersonSignature = data.qualifiedPersonSignature ?? null;
    this.qualifiedPersonDate = data.qualifiedPersonDate ?? null;
    this.plantManagerSignature = data.plantManagerSignature ?? null;
    this.plantManagerDate = data.plantManagerDate ?? null;
    this.workCanBePerformedSafely = data.workCanBePerformedSafely ?? false;
    this.checklist = data.checklist ? new EnergizedWorkChecklist(data.checklist) : null;
  }

  override toJson(): any {
    return {
      ...super.toJson(),
      date: this.date,
      time: this.time,
      location: this.location,
      issuedTo: this.issuedTo,
      workScope: this.workScope,
      redTagNum: this.redTagNum,
      permitNumber: this.permitNumber,
      workArea: this.workArea,
      workOrder: this.workOrder,
      circuitDescription: this.circuitDescription,
      workDescription: this.workDescription,
      justification: this.justification,
      requester: this.requester,
      requesterDate: this.requesterDate,
      qualifiedPersonSignature: this.qualifiedPersonSignature,
      qualifiedPersonDate: this.qualifiedPersonDate,
      plantManagerSignature: this.plantManagerSignature,
      plantManagerDate: this.plantManagerDate,
      workCanBePerformedSafely: this.workCanBePerformedSafely,
      checklist: this.checklist,
    };
  }

  static override fromJson(json: any): EnergizedWorkPermitDto {
    if (!json) return new EnergizedWorkPermitDto();
    return new EnergizedWorkPermitDto({
      ...super.fromJson(json),
      date: json.date,
      time: json.time,
      location: json.location,
      issuedTo: json.issuedTo,
      workScope: json.workScope,
      redTagNum: json.redTagNum,
      permitNumber: json.permitNumber,
      workArea: json.workArea ? WorkAreaDto.fromJson(json.workArea) : null,
      workOrder: json.workOrder,
      circuitDescription: json.circuitDescription,
      workDescription: json.workDescription,
      justification: json.justification,
      requester: json.requester,
      requesterDate: json.requesterDate,
      qualifiedPersonSignature: json.qualifiedPersonSignature,
      qualifiedPersonDate: json.qualifiedPersonDate,
      plantManagerSignature: json.plantManagerSignature,
      plantManagerDate: json.plantManagerDate,
      workCanBePerformedSafely: json.workCanBePerformedSafely ?? false,
      checklist: json.checklist ? new EnergizedWorkChecklist(json.checklist) : null,
    });
  }

  static getChecklistFields(checklistDto: EnergizedWorkChecklist | null): { [key: string]: FormField } {
    const checklist = checklistDto || new EnergizedWorkChecklist();
    const group = { label: 'Energized Work Checklist', orientation: 'vertical' } as const;
    return {
      // 1. Job description
      'checklist.jobDescription': { name: 'checklist.jobDescription', label: 'Job Description', type: 'text', initialValue: checklist.jobDescription, group },
      'checklist.jobDescriptionComplete': { name: 'checklist.jobDescriptionComplete', label: 'Job Description Complete', type: 'checkbox', initialValue: checklist.jobDescriptionComplete, group },
      // 2. Safe work practices
      'checklist.safeWorkPractices': { name: 'checklist.safeWorkPractices', label: 'Safe Work Practices', type: 'text', initialValue: checklist.safeWorkPractices, group },
      'checklist.safeWorkPracticesComplete': { name: 'checklist.safeWorkPracticesComplete', label: 'Safe Work Practices Complete', type: 'checkbox', initialValue: checklist.safeWorkPracticesComplete, group },
      // 3. Shock hazard analysis
      'checklist.shockHazardAnalysis': { name: 'checklist.shockHazardAnalysis', label: 'Shock Hazard Analysis', type: 'text', initialValue: checklist.shockHazardAnalysis, group },
      'checklist.shockHazardAnalysisComplete': { name: 'checklist.shockHazardAnalysisComplete', label: 'Shock Hazard Analysis Complete', type: 'checkbox', initialValue: checklist.shockHazardAnalysisComplete, group },
      'checklist.limitedApproachBoundary': { name: 'checklist.limitedApproachBoundary', label: 'Limited Approach Boundary', type: 'text', initialValue: checklist.limitedApproachBoundary, group },
      'checklist.limitedApproachBoundaryComplete': { name: 'checklist.limitedApproachBoundaryComplete', label: 'Limited Approach Boundary Complete', type: 'checkbox', initialValue: checklist.limitedApproachBoundaryComplete, group },
      'checklist.restrictedApproachBoundary': { name: 'checklist.restrictedApproachBoundary', label: 'Restricted Approach Boundary', type: 'text', initialValue: checklist.restrictedApproachBoundary, group },
      'checklist.restrictedApproachBoundaryComplete': { name: 'checklist.restrictedApproachBoundaryComplete', label: 'Restricted Approach Boundary Complete', type: 'checkbox', initialValue: checklist.restrictedApproachBoundaryComplete, group },
      'checklist.prohibitedApproachBoundary': { name: 'checklist.prohibitedApproachBoundary', label: 'Prohibited Approach Boundary', type: 'text', initialValue: checklist.prohibitedApproachBoundary, group },
      'checklist.prohibitedApproachBoundaryComplete': { name: 'checklist.prohibitedApproachBoundaryComplete', label: 'Prohibited Approach Boundary Complete', type: 'checkbox', initialValue: checklist.prohibitedApproachBoundaryComplete, group },
      // 4. Flash protection boundary
      'checklist.flashProtectionBoundary': { name: 'checklist.flashProtectionBoundary', label: 'Flash Protection Boundary', type: 'text', initialValue: checklist.flashProtectionBoundary, group },
      'checklist.incidentEnergy': { name: 'checklist.incidentEnergy', label: 'Incident Energy / Arc Flash PPE Category', type: 'text', initialValue: checklist.incidentEnergy, group },
      'checklist.incidentEnergyComplete': { name: 'checklist.incidentEnergyComplete', label: 'Incident Energy Complete', type: 'checkbox', initialValue: checklist.incidentEnergyComplete, group },
      'checklist.arcFlashPpe': { name: 'checklist.arcFlashPpe', label: 'Arc Flash PPE', type: 'text', initialValue: checklist.arcFlashPpe, group },
      'checklist.arcFlashPpeComplete': { name: 'checklist.arcFlashPpeComplete', label: 'Arc Flash PPE Complete', type: 'checkbox', initialValue: checklist.arcFlashPpeComplete, group },
      'checklist.arcFlashBoundary': { name: 'checklist.arcFlashBoundary', label: 'Arc Flash Boundary', type: 'text', initialValue: checklist.arcFlashBoundary, group },
      'checklist.arcFlashBoundaryComplete': { name: 'checklist.arcFlashBoundaryComplete', label: 'Arc Flash Boundary Complete', type: 'checkbox', initialValue: checklist.arcFlashBoundaryComplete, group },
      // 5. Means to restrict access
      'checklist.meansToRestrictAccess': { name: 'checklist.meansToRestrictAccess', label: 'Means to Restrict Access', type: 'text', initialValue: checklist.meansToRestrictAccess, group },
      'checklist.meansToRestrictAccessComplete': { name: 'checklist.meansToRestrictAccessComplete', label: 'Means to Restrict Access Complete', type: 'checkbox', initialValue: checklist.meansToRestrictAccessComplete, group },
      // 6. Pre-Job Brief
      'checklist.preJobBriefComplete': { name: 'checklist.preJobBriefComplete', label: 'Pre-Job Brief Complete', type: 'checkbox', initialValue: checklist.preJobBriefComplete, group },
    };
  }

  static toFormFields(
    dto: EnergizedWorkPermitDto,
    fields: (EnergizedWorkPermitFieldName | 'workArea')[] = [
      'workArea', 'date', 'workOrder', 'circuitDescription', 'workDescription',
      'justification', 'requester', 'requesterDate',
      ...Object.keys(EnergizedWorkPermitDto.getChecklistFields(null)) as EnergizedWorkPermitFieldName[],
      'workCanBePerformedSafely',
      'qualifiedPersonSignature', 'qualifiedPersonDate',
      'plantManagerSignature', 'plantManagerDate',
    ]
  ): FormField[] {
    const checklistFields = EnergizedWorkPermitDto.getChecklistFields(dto.checklist);
    const allFields: { [key: string]: FormField } = {
      id: { name: 'id', label: 'ID', type: 'text', initialValue: dto.id },
      workArea: {
        name: 'workArea',
        label: 'Work Area',
        type: 'work-area-select',
        initialValue: (dto as any).workArea?.id ?? null,
        context: { viewMode: 'map', fallbackText: dto.location },
      },
      date: {
        name: 'date',
        label: 'Date',
        type: 'date',
        validators: [Validators.required],
        initialValue: dto.date ?? new Date().toISOString().split('T')[0],
      },
      time: { name: 'time', label: 'Time', type: 'time', initialValue: dto.time },
      location: { name: 'location', label: 'Location', type: 'text', initialValue: dto.location },
      issuedTo: { name: 'issuedTo', label: 'Issued To', type: 'text', initialValue: dto.issuedTo },
      workScope: { name: 'workScope', label: 'Work Scope', type: 'textarea', initialValue: dto.workScope },
      redTagNum: { name: 'redTagNum', label: 'Red Tag #', type: 'text', initialValue: dto.redTagNum },
      permitNumber: { name: 'permitNumber', label: 'Permit Number', type: 'text', readonly: true, initialValue: dto.permitNumber },
      workOrder: { name: 'workOrder', label: 'Work Order', type: 'text', initialValue: dto.workOrder },
      circuitDescription: { name: 'circuitDescription', label: 'Circuit Description', type: 'textarea', initialValue: dto.circuitDescription },
      workDescription: { name: 'workDescription', label: 'Work Description', type: 'textarea', initialValue: dto.workDescription },
      justification: { name: 'justification', label: 'Justification', type: 'textarea', initialValue: dto.justification },
      requester: { name: 'requester', label: 'Requester', type: 'text', initialValue: dto.requester },
      requesterDate: { name: 'requesterDate', label: 'Requester Date', type: 'date', initialValue: dto.requesterDate },
      qualifiedPersonSignature: { name: 'qualifiedPersonSignature', label: 'Qualified Person Signature', type: 'text', initialValue: dto.qualifiedPersonSignature },
      qualifiedPersonDate: { name: 'qualifiedPersonDate', label: 'Qualified Person Date', type: 'date', initialValue: dto.qualifiedPersonDate },
      plantManagerSignature: { name: 'plantManagerSignature', label: 'Plant Manager Signature', type: 'text', initialValue: dto.plantManagerSignature },
      plantManagerDate: { name: 'plantManagerDate', label: 'Plant Manager Date', type: 'date', initialValue: dto.plantManagerDate },
      workCanBePerformedSafely: {
        name: 'workCanBePerformedSafely',
        label: 'Work Can Be Performed Safely',
        type: 'select',
        options: [
          { value: 'true', label: 'Yes' },
          { value: 'false', label: 'No' },
        ],
        initialValue: dto.workCanBePerformedSafely?.toString(),
      },
      name: { name: 'name', label: 'Name', type: 'text', initialValue: dto.name },
      objectType: { name: 'objectType', label: 'Object Type', type: 'text', initialValue: dto.objectType },
      ...checklistFields,
    };
    return fields.map(f => allFields[f]).filter((f): f is FormField => f !== undefined);
  }

  static toTableColumns(
    fields: EnergizedWorkPermitFieldName[] = ['permitNumber', 'date', 'location', 'workOrder', 'requester', 'workCanBePerformedSafely']
  ): Column[] {
    const allColumns: { [key in EnergizedWorkPermitFieldName]?: Column } = {
      id: { id: 'id', header: 'ID', accessorKey: 'id' },
      name: { id: 'name', header: 'Name', accessorKey: 'name' },
      date: { id: 'date', header: 'Date', accessorKey: 'date' },
      time: { id: 'time', header: 'Time', accessorKey: 'time' },
      location: { id: 'location', header: 'Location', accessorKey: 'location' },
      issuedTo: { id: 'issuedTo', header: 'Issued To', accessorKey: 'issuedTo' },
      workScope: { id: 'workScope', header: 'Work Scope', accessorKey: 'workScope' },
      permitNumber: { id: 'permitNumber', header: 'Permit #', accessorKey: 'permitNumber' },
      workOrder: { id: 'workOrder', header: 'Work Order', accessorKey: 'workOrder' },
      circuitDescription: { id: 'circuitDescription', header: 'Circuit Description', accessorKey: 'circuitDescription' },
      workDescription: { id: 'workDescription', header: 'Work Description', accessorKey: 'workDescription' },
      justification: { id: 'justification', header: 'Justification', accessorKey: 'justification' },
      requester: { id: 'requester', header: 'Requester', accessorKey: 'requester' },
      requesterDate: { id: 'requesterDate', header: 'Requester Date', accessorKey: 'requesterDate' },
      qualifiedPersonSignature: { id: 'qualifiedPersonSignature', header: 'Qualified Person', accessorKey: 'qualifiedPersonSignature' },
      qualifiedPersonDate: { id: 'qualifiedPersonDate', header: 'Qualified Person Date', accessorKey: 'qualifiedPersonDate' },
      plantManagerSignature: { id: 'plantManagerSignature', header: 'Plant Manager', accessorKey: 'plantManagerSignature' },
      plantManagerDate: { id: 'plantManagerDate', header: 'Plant Manager Date', accessorKey: 'plantManagerDate' },
      workCanBePerformedSafely: {
        id: 'workCanBePerformedSafely',
        header: 'Safe to Perform',
        accessorFn: (item: EnergizedWorkPermitDto) => item.workCanBePerformedSafely ? 'Yes' : 'No',
      },
      checklist: {
        id: 'checklist',
        header: 'Checklist',
        accessorFn: (item: EnergizedWorkPermitDto) => item.checklist ? 'Complete' : 'N/A',
      },
    };
    return fields.map(f => allColumns[f]).filter((c): c is Column => c !== undefined);
  }

  static generatePermitFromRequest(request: WorkRequestDto): EnergizedWorkPermitDto {
    return new EnergizedWorkPermitDto({
      date: request.dateOfWorkToBePerformed?.split('T')[0] ?? null,
      location: request.location,
      workScope: request.workScope,
      workDescription: request.workScope,
      requester: request.requestedBy,
      requesterDate: request.dateOfWorkToBePerformed?.split('T')[0] ?? null,
    });
  }

  static isValidKey(key: string): key is keyof EnergizedWorkPermitModel {
    return ['id', 'name', 'objectType', 'isVerified', 'date', 'time', 'location',
      'issuedTo', 'workScope', 'redTagNum', 'permitNumber', 'workArea',
      'workOrder', 'circuitDescription', 'workDescription', 'justification',
      'requester', 'requesterDate', 'qualifiedPersonSignature', 'qualifiedPersonDate',
      'plantManagerSignature', 'plantManagerDate', 'workCanBePerformedSafely', 'checklist'].includes(key);
  }
}
