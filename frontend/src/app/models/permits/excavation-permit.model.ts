
import { Validators } from '@angular/forms';
import { BaseDto, BaseModel } from '../base/base.model';
import { Column } from '../column.model';
import { FormField } from '../ui/form-field.model';
import { WorkAreaDto } from './work-area.model';
import { WorkRequestDto } from './work-request.model';

export class ExcavationTypeOfWork {
  excavation: boolean = false;
  boring: boolean = false;
  drilling: boolean = false;
  cutting: boolean = false;
  blindPenetration: boolean = false;
  constructor(data: Partial<ExcavationTypeOfWork> = {}) { Object.assign(this, data); }
}

export class ExcavationChecklist {
  // General Info
  lessThan4Ft: string = '';
  caveInPotential: string = '';
  deeperThan4Ft: string = '';
  slopingUsed: string = '';
  // Jobsite Inspection
  dailyInspection: string = '';
  competentPersonAuthority: string = '';
  surfaceEncumbrances: string = '';
  looseRockProtection: string = '';
  hardHats: string = '';
  spoilsSetBack: string = '';
  adequateBarriers: string = '';
  standAwayFromVehicles: string = '';
  warningSystem: string = '';
  noSuspendedLoads: string = '';
  // Utilities
  utilitiesMarked: string = '';
  handDigging: string = '';
  utilitiesProtected: string = '';
  // Access/Egress
  egressDistance: string = '';
  laddersExtend: string = '';
  // Wet Conditions
  precautionsForWater: string = '';
  diversionDitches: string = '';
  inspectionAfterRain: string = '';
  // Hazardous Atmosphere
  atmosphereTested: string = '';
  oxygenDeficiency: string = '';
  lowOxygen: string = '';
  combustibleGas: string = '';
  emergencyEquipment: string = '';
  ventilationProvided: string = '';
  attendantProvided: string = '';
  atmosphericMonitoring: string = '';
  safetyEquipment: string = '';
  evacuationWarning: string = '';
  // Support Systems
  supportSystemDesigned: string = '';
  materialsGoodCondition: string = '';
  membersSecured: string = '';
  timberedExcavations: string = '';
  backfillProgression: string = '';
  removalFromBottom: string = '';
  constructor(data: Partial<ExcavationChecklist> = {}) { Object.assign(this, data); }
}

export type ExcavationPermitFieldName = keyof ExcavationPermitModel;

export interface ExcavationPermitModel extends BaseModel {
  date: string | null;
  time: string | null;
  location: string | null;
  issuedTo: string | null;
  workScope: string | null;
  redTagNum: string | null;
  permitNumber: string | null;
  workArea: WorkAreaDto | null;
  supervisor: string | null;
  jobLocation: string | null;
  supervisorPhone: string | null;
  excavationDescription: string | null;
  workOrder: string | null;
  typeOfWork: ExcavationTypeOfWork | null;
  locationPipingMarked: boolean;
  supervisorApprovalDate: string | null;
  supervisorApprovalTime: string | null;
  permitClosedDate: string | null;
  permitClosedTime: string | null;
  jobStatusComplete: boolean;
  inspectionsJson: any[] | null;
  supervisorFieldInspectionName: string | null;
  supervisorFieldInspectionDate: string | null;
  supervisorFieldInspectionTime: string | null;
  facilityName: string | null;
  competentPerson: string | null;
  soilType: string | null;
  excavationDepth: string | null;
  excavationWidth: string | null;
  protectiveSystemType: string | null;
  checklist: ExcavationChecklist | null;
}

export class ExcavationPermitDto extends BaseDto implements ExcavationPermitModel {
  date: string | null;
  time: string | null;
  location: string | null;
  issuedTo: string | null;
  workScope: string | null;
  redTagNum: string | null;
  permitNumber: string | null;
  workArea: WorkAreaDto | null;
  supervisor: string | null;
  jobLocation: string | null;
  supervisorPhone: string | null;
  excavationDescription: string | null;
  workOrder: string | null;
  typeOfWork: ExcavationTypeOfWork | null;
  locationPipingMarked: boolean;
  supervisorApprovalDate: string | null;
  supervisorApprovalTime: string | null;
  permitClosedDate: string | null;
  permitClosedTime: string | null;
  jobStatusComplete: boolean;
  inspectionsJson: any[] | null;
  supervisorFieldInspectionName: string | null;
  supervisorFieldInspectionDate: string | null;
  supervisorFieldInspectionTime: string | null;
  facilityName: string | null;
  competentPerson: string | null;
  soilType: string | null;
  excavationDepth: string | null;
  excavationWidth: string | null;
  protectiveSystemType: string | null;
  checklist: ExcavationChecklist | null;

  constructor(data: Partial<ExcavationPermitModel> = {}) {
    super(data);
    this.date = data.date ?? null;
    this.time = data.time ?? null;
    this.location = data.location ?? null;
    this.issuedTo = data.issuedTo ?? null;
    this.workScope = data.workScope ?? null;
    this.redTagNum = data.redTagNum ?? null;
    this.permitNumber = data.permitNumber ?? null;
    this.workArea = data.workArea ? new WorkAreaDto(data.workArea) : null;
    this.supervisor = data.supervisor ?? null;
    this.jobLocation = data.jobLocation ?? null;
    this.supervisorPhone = data.supervisorPhone ?? null;
    this.excavationDescription = data.excavationDescription ?? null;
    this.workOrder = data.workOrder ?? null;
    this.typeOfWork = data.typeOfWork ? new ExcavationTypeOfWork(data.typeOfWork) : null;
    this.locationPipingMarked = data.locationPipingMarked ?? false;
    this.supervisorApprovalDate = data.supervisorApprovalDate ?? null;
    this.supervisorApprovalTime = data.supervisorApprovalTime ?? null;
    this.permitClosedDate = data.permitClosedDate ?? null;
    this.permitClosedTime = data.permitClosedTime ?? null;
    this.jobStatusComplete = data.jobStatusComplete ?? false;
    this.inspectionsJson = data.inspectionsJson ?? [];
    this.supervisorFieldInspectionName = data.supervisorFieldInspectionName ?? null;
    this.supervisorFieldInspectionDate = data.supervisorFieldInspectionDate ?? null;
    this.supervisorFieldInspectionTime = data.supervisorFieldInspectionTime ?? null;
    this.facilityName = data.facilityName ?? null;
    this.competentPerson = data.competentPerson ?? null;
    this.soilType = data.soilType ?? null;
    this.excavationDepth = data.excavationDepth ?? null;
    this.excavationWidth = data.excavationWidth ?? null;
    this.protectiveSystemType = data.protectiveSystemType ?? null;
    this.checklist = data.checklist ? new ExcavationChecklist(data.checklist) : null;
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
      supervisor: this.supervisor,
      jobLocation: this.jobLocation,
      supervisorPhone: this.supervisorPhone,
      excavationDescription: this.excavationDescription,
      workOrder: this.workOrder,
      typeOfWork: this.typeOfWork,
      locationPipingMarked: this.locationPipingMarked,
      supervisorApprovalDate: this.supervisorApprovalDate,
      supervisorApprovalTime: this.supervisorApprovalTime,
      permitClosedDate: this.permitClosedDate,
      permitClosedTime: this.permitClosedTime,
      jobStatusComplete: this.jobStatusComplete,
      inspectionsJson: this.inspectionsJson ? JSON.stringify(this.inspectionsJson) : null,
      supervisorFieldInspectionName: this.supervisorFieldInspectionName,
      supervisorFieldInspectionDate: this.supervisorFieldInspectionDate,
      supervisorFieldInspectionTime: this.supervisorFieldInspectionTime,
      facilityName: this.facilityName,
      competentPerson: this.competentPerson,
      soilType: this.soilType,
      excavationDepth: this.excavationDepth,
      excavationWidth: this.excavationWidth,
      protectiveSystemType: this.protectiveSystemType,
      checklist: this.checklist,
    };
  }

  static override fromJson(json: any): ExcavationPermitDto {
    if (!json) return new ExcavationPermitDto();
    return new ExcavationPermitDto({
      ...super.fromJson(json),
      date: json.date,
      time: json.time,
      location: json.location,
      issuedTo: json.issuedTo,
      workScope: json.workScope,
      redTagNum: json.redTagNum,
      permitNumber: json.permitNumber,
      workArea: json.workArea ? WorkAreaDto.fromJson(json.workArea) : null,
      supervisor: json.supervisor,
      jobLocation: json.jobLocation,
      supervisorPhone: json.supervisorPhone,
      excavationDescription: json.excavationDescription,
      workOrder: json.workOrder,
      typeOfWork: json.typeOfWork ? new ExcavationTypeOfWork(json.typeOfWork) : null,
      locationPipingMarked: json.locationPipingMarked ?? false,
      supervisorApprovalDate: json.supervisorApprovalDate,
      supervisorApprovalTime: json.supervisorApprovalTime,
      permitClosedDate: json.permitClosedDate,
      permitClosedTime: json.permitClosedTime,
      jobStatusComplete: json.jobStatusComplete ?? false,
      inspectionsJson: json.inspectionsJson ? (typeof json.inspectionsJson === 'string' ? JSON.parse(json.inspectionsJson) : json.inspectionsJson) : [],
      supervisorFieldInspectionName: json.supervisorFieldInspectionName,
      supervisorFieldInspectionDate: json.supervisorFieldInspectionDate,
      supervisorFieldInspectionTime: json.supervisorFieldInspectionTime,
      facilityName: json.facilityName,
      competentPerson: json.competentPerson,
      soilType: json.soilType,
      excavationDepth: json.excavationDepth,
      excavationWidth: json.excavationWidth,
      protectiveSystemType: json.protectiveSystemType,
      checklist: json.checklist ? new ExcavationChecklist(json.checklist) : null,
    });
  }

  static getTypeOfWorkFields(typeOfWorkDto: ExcavationTypeOfWork | null): { [key: string]: FormField } {
    const typeOfWork = typeOfWorkDto || new ExcavationTypeOfWork();
    const group = { label: 'Type of Work', orientation: 'horizontal' } as const;
    return {
      'typeOfWork.excavation': { name: 'typeOfWork.excavation', label: 'Excavation', type: 'checkbox', initialValue: typeOfWork.excavation, group },
      'typeOfWork.boring': { name: 'typeOfWork.boring', label: 'Boring', type: 'checkbox', initialValue: typeOfWork.boring, group },
      'typeOfWork.drilling': { name: 'typeOfWork.drilling', label: 'Drilling', type: 'checkbox', initialValue: typeOfWork.drilling, group },
      'typeOfWork.cutting': { name: 'typeOfWork.cutting', label: 'Cutting', type: 'checkbox', initialValue: typeOfWork.cutting, group },
      'typeOfWork.blindPenetration': { name: 'typeOfWork.blindPenetration', label: 'Blind Penetration', type: 'checkbox', initialValue: typeOfWork.blindPenetration, group },
    };
  }

  static getChecklistFields(checklistDto: ExcavationChecklist | null): { [key: string]: FormField } {
    const checklist = checklistDto || new ExcavationChecklist();
    const yesNoNaOptions = [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
      { value: 'na', label: 'N/A' },
    ];

    const generalGroup = { label: 'General Info', orientation: 'vertical' } as const;
    const jobsiteGroup = { label: 'Jobsite Inspection', orientation: 'vertical' } as const;
    const utilitiesGroup = { label: 'Utilities', orientation: 'vertical' } as const;
    const egressGroup = { label: 'Access/Egress', orientation: 'vertical' } as const;
    const wetGroup = { label: 'Wet Conditions', orientation: 'vertical' } as const;
    const hazAtmoGroup = { label: 'Hazardous Atmosphere', orientation: 'vertical' } as const;
    const supportGroup = { label: 'Support Systems', orientation: 'vertical' } as const;

    return {
      // General Info
      'checklist.lessThan4Ft': { name: 'checklist.lessThan4Ft', label: 'Less Than 4 Ft', type: 'select', options: yesNoNaOptions, initialValue: checklist.lessThan4Ft, group: generalGroup },
      'checklist.caveInPotential': { name: 'checklist.caveInPotential', label: 'Cave-In Potential', type: 'select', options: yesNoNaOptions, initialValue: checklist.caveInPotential, group: generalGroup },
      'checklist.deeperThan4Ft': { name: 'checklist.deeperThan4Ft', label: 'Deeper Than 4 Ft', type: 'select', options: yesNoNaOptions, initialValue: checklist.deeperThan4Ft, group: generalGroup },
      'checklist.slopingUsed': { name: 'checklist.slopingUsed', label: 'Sloping Used', type: 'select', options: yesNoNaOptions, initialValue: checklist.slopingUsed, group: generalGroup },
      // Jobsite Inspection
      'checklist.dailyInspection': { name: 'checklist.dailyInspection', label: 'Daily Inspection', type: 'select', options: yesNoNaOptions, initialValue: checklist.dailyInspection, group: jobsiteGroup },
      'checklist.competentPersonAuthority': { name: 'checklist.competentPersonAuthority', label: 'Competent Person Authority', type: 'select', options: yesNoNaOptions, initialValue: checklist.competentPersonAuthority, group: jobsiteGroup },
      'checklist.surfaceEncumbrances': { name: 'checklist.surfaceEncumbrances', label: 'Surface Encumbrances', type: 'select', options: yesNoNaOptions, initialValue: checklist.surfaceEncumbrances, group: jobsiteGroup },
      'checklist.looseRockProtection': { name: 'checklist.looseRockProtection', label: 'Loose Rock Protection', type: 'select', options: yesNoNaOptions, initialValue: checklist.looseRockProtection, group: jobsiteGroup },
      'checklist.hardHats': { name: 'checklist.hardHats', label: 'Hard Hats', type: 'select', options: yesNoNaOptions, initialValue: checklist.hardHats, group: jobsiteGroup },
      'checklist.spoilsSetBack': { name: 'checklist.spoilsSetBack', label: 'Spoils Set Back', type: 'select', options: yesNoNaOptions, initialValue: checklist.spoilsSetBack, group: jobsiteGroup },
      'checklist.adequateBarriers': { name: 'checklist.adequateBarriers', label: 'Adequate Barriers', type: 'select', options: yesNoNaOptions, initialValue: checklist.adequateBarriers, group: jobsiteGroup },
      'checklist.standAwayFromVehicles': { name: 'checklist.standAwayFromVehicles', label: 'Stand Away From Vehicles', type: 'select', options: yesNoNaOptions, initialValue: checklist.standAwayFromVehicles, group: jobsiteGroup },
      'checklist.warningSystem': { name: 'checklist.warningSystem', label: 'Warning System', type: 'select', options: yesNoNaOptions, initialValue: checklist.warningSystem, group: jobsiteGroup },
      'checklist.noSuspendedLoads': { name: 'checklist.noSuspendedLoads', label: 'No Suspended Loads', type: 'select', options: yesNoNaOptions, initialValue: checklist.noSuspendedLoads, group: jobsiteGroup },
      // Utilities
      'checklist.utilitiesMarked': { name: 'checklist.utilitiesMarked', label: 'Utilities Marked', type: 'select', options: yesNoNaOptions, initialValue: checklist.utilitiesMarked, group: utilitiesGroup },
      'checklist.handDigging': { name: 'checklist.handDigging', label: 'Hand Digging', type: 'select', options: yesNoNaOptions, initialValue: checklist.handDigging, group: utilitiesGroup },
      'checklist.utilitiesProtected': { name: 'checklist.utilitiesProtected', label: 'Utilities Protected', type: 'select', options: yesNoNaOptions, initialValue: checklist.utilitiesProtected, group: utilitiesGroup },
      // Access/Egress
      'checklist.egressDistance': { name: 'checklist.egressDistance', label: 'Egress Distance', type: 'select', options: yesNoNaOptions, initialValue: checklist.egressDistance, group: egressGroup },
      'checklist.laddersExtend': { name: 'checklist.laddersExtend', label: 'Ladders Extend', type: 'select', options: yesNoNaOptions, initialValue: checklist.laddersExtend, group: egressGroup },
      // Wet Conditions
      'checklist.precautionsForWater': { name: 'checklist.precautionsForWater', label: 'Precautions for Water', type: 'select', options: yesNoNaOptions, initialValue: checklist.precautionsForWater, group: wetGroup },
      'checklist.diversionDitches': { name: 'checklist.diversionDitches', label: 'Diversion Ditches', type: 'select', options: yesNoNaOptions, initialValue: checklist.diversionDitches, group: wetGroup },
      'checklist.inspectionAfterRain': { name: 'checklist.inspectionAfterRain', label: 'Inspection After Rain', type: 'select', options: yesNoNaOptions, initialValue: checklist.inspectionAfterRain, group: wetGroup },
      // Hazardous Atmosphere
      'checklist.atmosphereTested': { name: 'checklist.atmosphereTested', label: 'Atmosphere Tested', type: 'select', options: yesNoNaOptions, initialValue: checklist.atmosphereTested, group: hazAtmoGroup },
      'checklist.oxygenDeficiency': { name: 'checklist.oxygenDeficiency', label: 'Oxygen Deficiency', type: 'select', options: yesNoNaOptions, initialValue: checklist.oxygenDeficiency, group: hazAtmoGroup },
      'checklist.lowOxygen': { name: 'checklist.lowOxygen', label: 'Low Oxygen', type: 'select', options: yesNoNaOptions, initialValue: checklist.lowOxygen, group: hazAtmoGroup },
      'checklist.combustibleGas': { name: 'checklist.combustibleGas', label: 'Combustible Gas', type: 'select', options: yesNoNaOptions, initialValue: checklist.combustibleGas, group: hazAtmoGroup },
      'checklist.emergencyEquipment': { name: 'checklist.emergencyEquipment', label: 'Emergency Equipment', type: 'select', options: yesNoNaOptions, initialValue: checklist.emergencyEquipment, group: hazAtmoGroup },
      'checklist.ventilationProvided': { name: 'checklist.ventilationProvided', label: 'Ventilation Provided', type: 'select', options: yesNoNaOptions, initialValue: checklist.ventilationProvided, group: hazAtmoGroup },
      'checklist.attendantProvided': { name: 'checklist.attendantProvided', label: 'Attendant Provided', type: 'select', options: yesNoNaOptions, initialValue: checklist.attendantProvided, group: hazAtmoGroup },
      'checklist.atmosphericMonitoring': { name: 'checklist.atmosphericMonitoring', label: 'Atmospheric Monitoring', type: 'select', options: yesNoNaOptions, initialValue: checklist.atmosphericMonitoring, group: hazAtmoGroup },
      'checklist.safetyEquipment': { name: 'checklist.safetyEquipment', label: 'Safety Equipment', type: 'select', options: yesNoNaOptions, initialValue: checklist.safetyEquipment, group: hazAtmoGroup },
      'checklist.evacuationWarning': { name: 'checklist.evacuationWarning', label: 'Evacuation Warning', type: 'select', options: yesNoNaOptions, initialValue: checklist.evacuationWarning, group: hazAtmoGroup },
      // Support Systems
      'checklist.supportSystemDesigned': { name: 'checklist.supportSystemDesigned', label: 'Support System Designed', type: 'select', options: yesNoNaOptions, initialValue: checklist.supportSystemDesigned, group: supportGroup },
      'checklist.materialsGoodCondition': { name: 'checklist.materialsGoodCondition', label: 'Materials Good Condition', type: 'select', options: yesNoNaOptions, initialValue: checklist.materialsGoodCondition, group: supportGroup },
      'checklist.membersSecured': { name: 'checklist.membersSecured', label: 'Members Secured', type: 'select', options: yesNoNaOptions, initialValue: checklist.membersSecured, group: supportGroup },
      'checklist.timberedExcavations': { name: 'checklist.timberedExcavations', label: 'Timbered Excavations', type: 'select', options: yesNoNaOptions, initialValue: checklist.timberedExcavations, group: supportGroup },
      'checklist.backfillProgression': { name: 'checklist.backfillProgression', label: 'Backfill Progression', type: 'select', options: yesNoNaOptions, initialValue: checklist.backfillProgression, group: supportGroup },
      'checklist.removalFromBottom': { name: 'checklist.removalFromBottom', label: 'Removal From Bottom', type: 'select', options: yesNoNaOptions, initialValue: checklist.removalFromBottom, group: supportGroup },
    };
  }

  static toFormFields(
    dto: ExcavationPermitDto,
    fields: (ExcavationPermitFieldName | 'workArea')[] = [
      'workArea', 'date', 'time', 'workOrder', 'supervisor', 'jobLocation',
      'supervisorPhone', 'excavationDescription', 'locationPipingMarked',
      ...Object.keys(ExcavationPermitDto.getTypeOfWorkFields(null)) as ExcavationPermitFieldName[],
      'inspectionsJson' as ExcavationPermitFieldName,
      'facilityName', 'competentPerson', 'soilType', 'excavationDepth',
      'excavationWidth', 'protectiveSystemType',
      ...Object.keys(ExcavationPermitDto.getChecklistFields(null)) as ExcavationPermitFieldName[],
    ]
  ): FormField[] {
    const typeOfWorkFields = ExcavationPermitDto.getTypeOfWorkFields(dto.typeOfWork);
    const checklistFields = ExcavationPermitDto.getChecklistFields(dto.checklist);
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
      supervisor: { name: 'supervisor', label: 'Supervisor', type: 'text', validators: [Validators.required], initialValue: dto.supervisor },
      jobLocation: { name: 'jobLocation', label: 'Job Location', type: 'text', validators: [Validators.required], initialValue: dto.jobLocation },
      supervisorPhone: { name: 'supervisorPhone', label: 'Supervisor Phone', type: 'text', initialValue: dto.supervisorPhone },
      excavationDescription: { name: 'excavationDescription', label: 'Excavation Description', type: 'textarea', initialValue: dto.excavationDescription },
      workOrder: { name: 'workOrder', label: 'Work Order', type: 'text', initialValue: dto.workOrder },
      locationPipingMarked: {
        name: 'locationPipingMarked',
        label: 'Location/Piping Marked',
        type: 'select',
        options: [
          { value: 'true', label: 'Yes' },
          { value: 'false', label: 'No' },
        ],
        initialValue: dto.locationPipingMarked?.toString(),
      },
      supervisorApprovalDate: { name: 'supervisorApprovalDate', label: 'Supervisor Approval Date', type: 'date', initialValue: dto.supervisorApprovalDate },
      supervisorApprovalTime: { name: 'supervisorApprovalTime', label: 'Supervisor Approval Time', type: 'time', initialValue: dto.supervisorApprovalTime },
      permitClosedDate: { name: 'permitClosedDate', label: 'Permit Closed Date', type: 'date', initialValue: dto.permitClosedDate },
      permitClosedTime: { name: 'permitClosedTime', label: 'Permit Closed Time', type: 'time', initialValue: dto.permitClosedTime },
      jobStatusComplete: {
        name: 'jobStatusComplete',
        label: 'Job Status Complete',
        type: 'select',
        options: [
          { value: 'true', label: 'Yes' },
          { value: 'false', label: 'No' },
        ],
        initialValue: dto.jobStatusComplete?.toString(),
      },
      supervisorFieldInspectionName: { name: 'supervisorFieldInspectionName', label: 'Field Inspection Name', type: 'text', initialValue: dto.supervisorFieldInspectionName },
      supervisorFieldInspectionDate: { name: 'supervisorFieldInspectionDate', label: 'Field Inspection Date', type: 'date', initialValue: dto.supervisorFieldInspectionDate },
      supervisorFieldInspectionTime: { name: 'supervisorFieldInspectionTime', label: 'Field Inspection Time', type: 'time', initialValue: dto.supervisorFieldInspectionTime },
      facilityName: { name: 'facilityName', label: 'Facility Name', type: 'text', initialValue: dto.facilityName },
      competentPerson: { name: 'competentPerson', label: 'Competent Person', type: 'text', initialValue: dto.competentPerson },
      soilType: { name: 'soilType', label: 'Soil Type', type: 'text', initialValue: dto.soilType },
      excavationDepth: { name: 'excavationDepth', label: 'Excavation Depth', type: 'text', initialValue: dto.excavationDepth },
      excavationWidth: { name: 'excavationWidth', label: 'Excavation Width', type: 'text', initialValue: dto.excavationWidth },
      protectiveSystemType: { name: 'protectiveSystemType', label: 'Protective System Type', type: 'text', initialValue: dto.protectiveSystemType },
      inspectionsJson: {
        name: 'inspectionsJson',
        label: 'Site Inspections',
        type: 'form-array',
        initialValue: dto.inspectionsJson || [],
        fields: [
          { name: 'date', label: 'Date', type: 'date' },
          { name: 'time', label: 'Time', type: 'text' },
          { name: 'inspector', label: 'Inspector', type: 'text' },
          { name: 'comments', label: 'Comments', type: 'text' },
        ],
      },
      name: { name: 'name', label: 'Name', type: 'text', initialValue: dto.name },
      objectType: { name: 'objectType', label: 'Object Type', type: 'text', initialValue: dto.objectType },
      ...typeOfWorkFields,
      ...checklistFields,
    };
    return fields.map(f => allFields[f]).filter((f): f is FormField => f !== undefined);
  }

  static toTableColumns(
    fields: ExcavationPermitFieldName[] = ['permitNumber', 'date', 'supervisor', 'jobLocation', 'excavationDescription']
  ): Column[] {
    const allColumns: { [key in ExcavationPermitFieldName]?: Column } = {
      id: { id: 'id', header: 'ID', accessorKey: 'id' },
      name: { id: 'name', header: 'Name', accessorKey: 'name' },
      date: { id: 'date', header: 'Date', accessorKey: 'date' },
      time: { id: 'time', header: 'Time', accessorKey: 'time' },
      location: { id: 'location', header: 'Location', accessorKey: 'location' },
      issuedTo: { id: 'issuedTo', header: 'Issued To', accessorKey: 'issuedTo' },
      workScope: { id: 'workScope', header: 'Work Scope', accessorKey: 'workScope' },
      permitNumber: { id: 'permitNumber', header: 'Permit #', accessorKey: 'permitNumber' },
      supervisor: { id: 'supervisor', header: 'Supervisor', accessorKey: 'supervisor' },
      jobLocation: { id: 'jobLocation', header: 'Job Location', accessorKey: 'jobLocation' },
      supervisorPhone: { id: 'supervisorPhone', header: 'Supervisor Phone', accessorKey: 'supervisorPhone' },
      excavationDescription: { id: 'excavationDescription', header: 'Description', accessorKey: 'excavationDescription' },
      workOrder: { id: 'workOrder', header: 'Work Order', accessorKey: 'workOrder' },
      typeOfWork: {
        id: 'typeOfWork',
        header: 'Type of Work',
        accessorFn: (item: ExcavationPermitDto) => {
          if (!item.typeOfWork) return '';
          const types = [];
          if (item.typeOfWork.excavation) types.push('Excavation');
          if (item.typeOfWork.boring) types.push('Boring');
          if (item.typeOfWork.drilling) types.push('Drilling');
          if (item.typeOfWork.cutting) types.push('Cutting');
          if (item.typeOfWork.blindPenetration) types.push('Blind Penetration');
          return types.join(', ');
        },
      },
      locationPipingMarked: {
        id: 'locationPipingMarked',
        header: 'Piping Marked',
        accessorFn: (item: ExcavationPermitDto) => item.locationPipingMarked ? 'Yes' : 'No',
      },
      jobStatusComplete: {
        id: 'jobStatusComplete',
        header: 'Job Complete',
        accessorFn: (item: ExcavationPermitDto) => item.jobStatusComplete ? 'Yes' : 'No',
      },
      facilityName: { id: 'facilityName', header: 'Facility', accessorKey: 'facilityName' },
      competentPerson: { id: 'competentPerson', header: 'Competent Person', accessorKey: 'competentPerson' },
      soilType: { id: 'soilType', header: 'Soil Type', accessorKey: 'soilType' },
      excavationDepth: { id: 'excavationDepth', header: 'Depth', accessorKey: 'excavationDepth' },
      excavationWidth: { id: 'excavationWidth', header: 'Width', accessorKey: 'excavationWidth' },
      protectiveSystemType: { id: 'protectiveSystemType', header: 'Protective System', accessorKey: 'protectiveSystemType' },
      checklist: {
        id: 'checklist',
        header: 'Checklist',
        accessorFn: (item: ExcavationPermitDto) => item.checklist ? 'Complete' : 'N/A',
      },
    };
    return fields.map(f => allColumns[f]).filter((c): c is Column => c !== undefined);
  }

  static generatePermitFromRequest(request: WorkRequestDto): ExcavationPermitDto {
    return new ExcavationPermitDto({
      date: request.dateOfWorkToBePerformed?.split('T')[0] ?? null,
      jobLocation: request.location,
      excavationDescription: request.workScope,
      supervisor: request.foreman || null,
    });
  }

  static isValidKey(key: string): key is keyof ExcavationPermitModel {
    return ['id', 'name', 'objectType', 'isVerified', 'date', 'time', 'location',
      'issuedTo', 'workScope', 'redTagNum', 'permitNumber', 'workArea',
      'supervisor', 'jobLocation', 'supervisorPhone', 'excavationDescription', 'workOrder',
      'typeOfWork', 'locationPipingMarked', 'supervisorApprovalDate', 'supervisorApprovalTime',
      'permitClosedDate', 'permitClosedTime', 'jobStatusComplete', 'inspectionsJson',
      'supervisorFieldInspectionName', 'supervisorFieldInspectionDate', 'supervisorFieldInspectionTime',
      'facilityName', 'competentPerson', 'soilType', 'excavationDepth', 'excavationWidth',
      'protectiveSystemType', 'checklist'].includes(key);
  }
}
