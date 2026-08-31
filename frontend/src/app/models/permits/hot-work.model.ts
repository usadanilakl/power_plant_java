
import { Validators } from '@angular/forms';
import { BaseDto, BaseModel } from '../base/base.model';
import { Option } from '../option.model';
import { FormField } from '../ui/form-field.model';
import { Column } from '../column.model';
import { WorkRequestDto } from './work-request.model';
import { ValueDto } from '../value.model';
import { WorkAreaDto } from './work-area.model';
import { WorkCategoryProfileDto } from './work-category-profile.model';
import { mergeHotWorkMeasures } from '../../utils/hazard-merge.util';


export class HotWorkMeasures {
  areaIsClean: boolean = true;
  flammablesAreSecured: boolean = true;
  noCombustibleDustOrDebrisPresent: boolean = true;
  radiativeHeatPreventiveMeasuresAreTaken: boolean = true;
  vesselsArePurged: boolean = true;
  openingsAreCovered: boolean = true;
  ductVentilationIsSecured: boolean = true;
  lockOutIsCompleted: boolean = true;
  communicationIsEstablished: boolean = true;
  fireWatchIsAwareOfDuties: boolean = true;
  fireExtinguisherPresent: boolean = true;
  fireProtectionIsInService: boolean = true;

  constructor(data: Partial<HotWorkMeasures> = {}) {
    Object.assign(this, data);
  }
}

/** "Work Type" checkbox group, 2026-08-27 revision. "griding" matches the printed spelling. */
export class HotWorkType {
  welding: boolean = false;
  griding: boolean = false;
  cutting: boolean = false;
  brazing: boolean = false;
  other: boolean = false;
  otherDescription: string = '';

  constructor(data: Partial<HotWorkType> = {}) {
    Object.assign(this, data);
  }
}

export type HotWorkFieldName = keyof HotWorkModel;

export interface HotWorkModel extends BaseModel {
  date: string | null;
  location: string | null;
  workScope: string | null;
  foreman: string | null;
  fireWatch: string | null;
  meterModel: string | null;
  meterNum: string | null;
  meterCalDate: string | null;
  specialInstructions: string | null;
  measures: HotWorkMeasures | null;
  isAirMonitoringRegisteredOnConfinedSpace: boolean;
  isFireWatchRequired: boolean;
  timeOfInitialTest: string;
  initialTestResult: string;
  /** NAES Red Tag number, when the permit came from that system. */
  redTagNum: string | null;
  /** This app's own permit number, from PermitNumberGenerator (D%02d-yy-MM-dd-%03d). Printed. */
  permitNumber: string | null;

  // ---- 2026-08-27 revision ----
  initialTestInitials: string | null;
  fireProtectionApprovalDateTime: string | null;
  contMeterModel: string | null;
  contMeterNum: string | null;
  contMeterCalDate: string | null;
  fireWatch1Hour: boolean;
  fireWatch30Min: boolean;
  fireWatchNotRequired: boolean;
  issuerSignature: string | null;
  approvedDate: string | null;
  approvedTime: string | null;
  actualStartTime: string | null;
  actualEndTime: string | null;
  cancelRequestorName: string | null;
  cancelRequestorSignature: string | null;
  cancelRequestorDate: string | null;
  cancelRequestorTime: string | null;
  cancelFireWatchName: string | null;
  cancelFireWatchSignature: string | null;
  cancelFireWatchDate: string | null;
  cancelFireWatchTime: string | null;
  fireMonitoringMethod: string | null;
  fireMonitorName: string | null;
  fireMonitorSignature: string | null;
  fireMonitorDate: string | null;
  fireMonitorTime: string | null;
  cancelledBy: string | null;
  cancelledDate: string | null;
  cancelledTime: string | null;
  fireProtectionInService: boolean;
  fireProtectionNotInService: boolean;
  workCompleted: boolean;
  workType: HotWorkType | null;
  permitStatus: ValueDto;
}

export class HotWorkDto extends BaseDto implements HotWorkModel {
  date: string | null;
  location: string | null;
  workScope: string | null;
  foreman: string | null;
  fireWatch: string | null;
  meterModel: string | null;
  meterNum: string | null;
  meterCalDate: string | null;
  specialInstructions: string | null;
  measures: HotWorkMeasures | null;
  isAirMonitoringRegisteredOnConfinedSpace: boolean;
  timeOfInitialTest: string;
  isFireWatchRequired: boolean;
  initialTestResult: string;
  redTagNum: string | null;
  permitNumber: string | null;
  initialTestInitials: string | null;
  fireProtectionApprovalDateTime: string | null;
  contMeterModel: string | null;
  contMeterNum: string | null;
  contMeterCalDate: string | null;
  fireWatch1Hour: boolean;
  fireWatch30Min: boolean;
  fireWatchNotRequired: boolean;
  issuerSignature: string | null;
  approvedDate: string | null;
  approvedTime: string | null;
  actualStartTime: string | null;
  actualEndTime: string | null;
  cancelRequestorName: string | null;
  cancelRequestorSignature: string | null;
  cancelRequestorDate: string | null;
  cancelRequestorTime: string | null;
  cancelFireWatchName: string | null;
  cancelFireWatchSignature: string | null;
  cancelFireWatchDate: string | null;
  cancelFireWatchTime: string | null;
  fireMonitoringMethod: string | null;
  fireMonitorName: string | null;
  fireMonitorSignature: string | null;
  fireMonitorDate: string | null;
  fireMonitorTime: string | null;
  cancelledBy: string | null;
  cancelledDate: string | null;
  cancelledTime: string | null;
  fireProtectionInService: boolean;
  fireProtectionNotInService: boolean;
  workCompleted: boolean;
  workType: HotWorkType | null;
  permitStatus: ValueDto;

  constructor(data: Partial<HotWorkModel> = {}) {
    super(data);
    this.date = data.date ?? null;
    this.location = data.location ?? null;
    this.workScope = data.workScope ?? null;
    this.foreman = data.foreman ?? null;
    this.fireWatch = data.fireWatch ?? null;
    this.meterModel = data.meterModel ?? "RKI GX-3R PRO";
    this.meterNum = data.meterNum ?? null;
    this.meterCalDate = data.meterCalDate ?? null;
    this.specialInstructions = data.specialInstructions ?? null;
    this.measures = data.measures ?? new HotWorkMeasures();
    this.isAirMonitoringRegisteredOnConfinedSpace = data.isAirMonitoringRegisteredOnConfinedSpace ?? false;
    this.timeOfInitialTest = data.timeOfInitialTest ?? '';
    this.isFireWatchRequired = data.isFireWatchRequired ?? true;
    this. initialTestResult = data.initialTestResult ?? '';
    this.redTagNum = data.redTagNum ?? null;
    this.permitNumber = data.permitNumber ?? null;
    this.initialTestInitials = data.initialTestInitials ?? null;
    this.fireProtectionApprovalDateTime = data.fireProtectionApprovalDateTime ?? null;
    this.contMeterModel = data.contMeterModel ?? null;
    this.contMeterNum = data.contMeterNum ?? null;
    this.contMeterCalDate = data.contMeterCalDate ?? null;
    this.fireWatch1Hour = data.fireWatch1Hour ?? false;
    this.fireWatch30Min = data.fireWatch30Min ?? false;
    this.fireWatchNotRequired = data.fireWatchNotRequired ?? false;
    this.issuerSignature = data.issuerSignature ?? null;
    this.approvedDate = data.approvedDate ?? null;
    this.approvedTime = data.approvedTime ?? null;
    this.actualStartTime = data.actualStartTime ?? null;
    this.actualEndTime = data.actualEndTime ?? null;
    this.cancelRequestorName = data.cancelRequestorName ?? null;
    this.cancelRequestorSignature = data.cancelRequestorSignature ?? null;
    this.cancelRequestorDate = data.cancelRequestorDate ?? null;
    this.cancelRequestorTime = data.cancelRequestorTime ?? null;
    this.cancelFireWatchName = data.cancelFireWatchName ?? null;
    this.cancelFireWatchSignature = data.cancelFireWatchSignature ?? null;
    this.cancelFireWatchDate = data.cancelFireWatchDate ?? null;
    this.cancelFireWatchTime = data.cancelFireWatchTime ?? null;
    this.fireMonitoringMethod = data.fireMonitoringMethod ?? null;
    this.fireMonitorName = data.fireMonitorName ?? null;
    this.fireMonitorSignature = data.fireMonitorSignature ?? null;
    this.fireMonitorDate = data.fireMonitorDate ?? null;
    this.fireMonitorTime = data.fireMonitorTime ?? null;
    this.cancelledBy = data.cancelledBy ?? null;
    this.cancelledDate = data.cancelledDate ?? null;
    this.cancelledTime = data.cancelledTime ?? null;
    this.fireProtectionInService = data.fireProtectionInService ?? false;
    this.fireProtectionNotInService = data.fireProtectionNotInService ?? false;
    this.workCompleted = data.workCompleted ?? false;
    this.workType = data.workType ? new HotWorkType(data.workType) : new HotWorkType();
    this.permitStatus = data.permitStatus ?? new ValueDto();
  }

  override toJson(): any {
    return {
      ...super.toJson(),
      date: this.date,
      location: this.location,
      workScope: this.workScope,
      foreman: this.foreman,
      fireWatch: this.fireWatch,
      meterModel: this.meterModel,
      meterNum: this.meterNum,
      meterCalDate: this.meterCalDate,
      specialInstructions: this.specialInstructions,
      measures: this.measures,
      isAirMonitoringRegisteredOnConfinedSpace: this.isAirMonitoringRegisteredOnConfinedSpace,
      isFireWatchRequired: this.isFireWatchRequired,
      timeOfInitialTest: this.timeOfInitialTest,
      initialTestResult: this.initialTestResult,
      redTagNum: this.redTagNum,
      permitNumber: this.permitNumber,
      initialTestInitials: this.initialTestInitials,
      fireProtectionApprovalDateTime: this.fireProtectionApprovalDateTime,
      contMeterModel: this.contMeterModel,
      contMeterNum: this.contMeterNum,
      contMeterCalDate: this.contMeterCalDate,
      fireWatch1Hour: this.fireWatch1Hour,
      fireWatch30Min: this.fireWatch30Min,
      fireWatchNotRequired: this.fireWatchNotRequired,
      issuerSignature: this.issuerSignature,
      approvedDate: this.approvedDate,
      approvedTime: this.approvedTime,
      actualStartTime: this.actualStartTime,
      actualEndTime: this.actualEndTime,
      cancelRequestorName: this.cancelRequestorName,
      cancelRequestorSignature: this.cancelRequestorSignature,
      cancelRequestorDate: this.cancelRequestorDate,
      cancelRequestorTime: this.cancelRequestorTime,
      cancelFireWatchName: this.cancelFireWatchName,
      cancelFireWatchSignature: this.cancelFireWatchSignature,
      cancelFireWatchDate: this.cancelFireWatchDate,
      cancelFireWatchTime: this.cancelFireWatchTime,
      fireMonitoringMethod: this.fireMonitoringMethod,
      fireMonitorName: this.fireMonitorName,
      fireMonitorSignature: this.fireMonitorSignature,
      fireMonitorDate: this.fireMonitorDate,
      fireMonitorTime: this.fireMonitorTime,
      cancelledBy: this.cancelledBy,
      cancelledDate: this.cancelledDate,
      cancelledTime: this.cancelledTime,
      fireProtectionInService: this.fireProtectionInService,
      fireProtectionNotInService: this.fireProtectionNotInService,
      workCompleted: this.workCompleted,
      workType: this.workType,
      // The permit's own work area. Carried informally (the form field already reads it via a
      // cast) but it MUST survive toJson: the backend mapper resolves the area only from
      // workArea.id, so a permit generated for a non-primary area would otherwise persist with a
      // null FK and report as being in the request's primary area.
      workArea: (this as any).workArea ?? null,
      permitStatus: this.permitStatus?.toJson() ?? null,
    };
  }

  static override fromJson(json: any): HotWorkDto {
    const dto = new HotWorkDto({
      ...super.fromJson(json),
      date: json.date || null,
      location: json.location || null,
      workScope: json.workScope || null,
      foreman: json.foreman || null,
      fireWatch: json.fireWatch || null,
      meterModel: json.meterModel || "RKI GX-3R PRO",
      meterNum: json.meterNum || null,
      meterCalDate: json.meterCalDate || null,
      specialInstructions: json.specialInstructions || null,
      measures: json.measures || new HotWorkMeasures(),
      isAirMonitoringRegisteredOnConfinedSpace: json.isAirMonitoringRegisteredOnConfinedSpace ?? false,
      isFireWatchRequired: json.isFireWatchRequired ?? true,
      timeOfInitialTest: json.timeOfInitialTest ?? '',
      initialTestResult: json.initialTestResult ?? '',
      redTagNum: json.redTagNum ?? null,
      permitNumber: json.permitNumber ?? null,
      initialTestInitials: json.initialTestInitials ?? null,
      fireProtectionApprovalDateTime: json.fireProtectionApprovalDateTime ?? null,
      contMeterModel: json.contMeterModel ?? null,
      contMeterNum: json.contMeterNum ?? null,
      contMeterCalDate: json.contMeterCalDate ?? null,
      fireWatch1Hour: json.fireWatch1Hour ?? false,
      fireWatch30Min: json.fireWatch30Min ?? false,
      fireWatchNotRequired: json.fireWatchNotRequired ?? false,
      issuerSignature: json.issuerSignature ?? null,
      approvedDate: json.approvedDate ?? null,
      approvedTime: json.approvedTime ?? null,
      actualStartTime: json.actualStartTime ?? null,
      actualEndTime: json.actualEndTime ?? null,
      cancelRequestorName: json.cancelRequestorName ?? null,
      cancelRequestorSignature: json.cancelRequestorSignature ?? null,
      cancelRequestorDate: json.cancelRequestorDate ?? null,
      cancelRequestorTime: json.cancelRequestorTime ?? null,
      cancelFireWatchName: json.cancelFireWatchName ?? null,
      cancelFireWatchSignature: json.cancelFireWatchSignature ?? null,
      cancelFireWatchDate: json.cancelFireWatchDate ?? null,
      cancelFireWatchTime: json.cancelFireWatchTime ?? null,
      fireMonitoringMethod: json.fireMonitoringMethod ?? null,
      fireMonitorName: json.fireMonitorName ?? null,
      fireMonitorSignature: json.fireMonitorSignature ?? null,
      fireMonitorDate: json.fireMonitorDate ?? null,
      fireMonitorTime: json.fireMonitorTime ?? null,
      cancelledBy: json.cancelledBy ?? null,
      cancelledDate: json.cancelledDate ?? null,
      cancelledTime: json.cancelledTime ?? null,
      fireProtectionInService: json.fireProtectionInService ?? false,
      fireProtectionNotInService: json.fireProtectionNotInService ?? false,
      workCompleted: json.workCompleted ?? false,
      workType: json.workType ? new HotWorkType(json.workType) : new HotWorkType(),
      permitStatus: ValueDto.fromJson(json.permitStatus),
    });
    // Not on the Model interface (the form field reads it via a cast), so it is attached after
    // construction rather than widening the model's key set and every map derived from it.
    (dto as any).workArea = json.workArea ?? null;
    return dto;
  }

  static isValidKey(key: string): key is keyof HotWorkModel {
    return [
      'id', 'date', 'location', 'workScope', 'foreman', 'fireWatch',
      'meterModel', 'meterNum', 'meterCalDate', 'specialInstructions', 'measures',
      'isAirMonitoringRegisteredOnConfinedSpace', 'isFireWatchRequired',
      'timeOfInitialTest', 'initialTestResult', 'redTagNum', 'permitNumber',
      'initialTestInitials', 'fireProtectionApprovalDateTime', 'contMeterModel', 'contMeterNum', 'contMeterCalDate', 'fireWatch1Hour', 'fireWatch30Min', 'fireWatchNotRequired', 'issuerSignature', 'approvedDate', 'approvedTime', 'actualStartTime', 'actualEndTime', 'cancelRequestorName', 'cancelRequestorSignature', 'cancelRequestorDate', 'cancelRequestorTime', 'cancelFireWatchName', 'cancelFireWatchSignature', 'cancelFireWatchDate', 'cancelFireWatchTime', 'fireMonitoringMethod', 'fireMonitorName', 'fireMonitorSignature', 'fireMonitorDate', 'fireMonitorTime', 'cancelledBy', 'cancelledDate', 'cancelledTime', 'fireProtectionInService', 'fireProtectionNotInService', 'workCompleted', 'workType',
      'isVerified', 'name', 'objectType'
    ].includes(key);
  }

  static toFormFields(
    dto: HotWorkDto,
    locationOptions: Option[] = [],
    fields: (HotWorkFieldName | 'workArea' | string)[] = [
      // Order drives the web SmartForm layout; it also gates which seeded paper-form containers
      // get their options merged in (see hot-work-paper-form.component.ts), so every bound cell
      // on the printed form MUST appear here or it renders without options.
      'permitNumber', 'location', 'date',
      'workType.welding', 'workType.griding', 'workType.cutting', 'workType.brazing',
      'workType.other', 'workType.otherDescription',
      ...Object.keys(HotWorkDto.getMeasureFields(null)) as HotWorkFieldName[],
      'fireProtectionInService', 'fireProtectionNotInService', 'fireProtectionApprovalDateTime',
      'meterModel', 'meterNum', 'meterCalDate', 'timeOfInitialTest',
      'initialTestInitials', 'initialTestResult',
      'contMeterModel', 'contMeterNum', 'contMeterCalDate',
      'isAirMonitoringRegisteredOnConfinedSpace', 'fireWatch1Hour', 'fireWatch30Min', 'fireWatchNotRequired',
      'foreman', 'fireWatch', 'specialInstructions', 'workScope',
      'issuerSignature', 'approvedDate', 'approvedTime',
      'actualStartTime', 'actualEndTime',
      'cancelRequestorName', 'cancelRequestorSignature', 'cancelRequestorDate', 'cancelRequestorTime',
      'cancelFireWatchName', 'cancelFireWatchSignature', 'cancelFireWatchDate', 'cancelFireWatchTime',
      'fireMonitoringMethod',
      'fireMonitorName', 'fireMonitorSignature', 'fireMonitorDate', 'fireMonitorTime',
      'workCompleted', 'cancelledBy', 'cancelledDate', 'cancelledTime',
    ]
  ): FormField[] {
    const measureFields = HotWorkDto.getMeasureFields(dto.measures);
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
        initialValue: dto.date ?? new Date().toISOString().split('T')[0]
      },
      location: {
        name: 'location',
        label: 'Location',
        type: 'text',
        options: locationOptions,
        validators: [Validators.required],
        initialValue: dto.location
      },
      workScope: { 
        name: 'workScope', 
        label: 'Work Scope', 
        type: 'textarea', 
        validators: [Validators.required], 
        initialValue: dto.workScope 
      },
      foreman: { 
        name: 'foreman', 
        label: 'Foreman', 
        type: 'text', 
        validators: [Validators.required], 
        initialValue: dto.foreman 
      },
      fireWatch: { 
        name: 'fireWatch', 
        label: 'Fire Watch', 
        type: 'text', 
        validators: [Validators.required], 
        initialValue: dto.fireWatch 
      },
      meterModel: { 
        name: 'meterModel', 
        label: 'Meter Model', 
        type: 'text', 
        initialValue: dto.meterModel 
      },
      meterNum: { 
        name: 'meterNum', 
        label: 'Meter Number', 
        type: 'text', 
        initialValue: dto.meterNum 
      },
      meterCalDate: {
        name: 'meterCalDate',
        label: 'Meter Cal Date',
        type: 'date',
        initialValue: dto.meterCalDate
      },
      specialInstructions: { 
        name: 'specialInstructions', 
        label: 'Special Instructions', 
        type: 'textarea', 
        initialValue: dto.specialInstructions 
      },
      name: { name: 'name', label: 'Name', type: 'text', initialValue: dto.name },
      objectType: { name: 'objectType', label: 'Object Type', type: 'text', initialValue: dto.objectType },
      isAirMonitoringRegisteredOnConfinedSpace: { 
        name: 'isAirMonitoringRegisteredOnConfinedSpace', 
        label: 'Air Monitoring Registered on Confined Space', 
        type: 'select', 
        options: [
          { value: 'true', label: 'Yes' },
          { value: 'false', label: 'No' }
        ], 
        initialValue: dto.isAirMonitoringRegisteredOnConfinedSpace?.toString() 
      },
      isFireWatchRequired: { 
        name: 'isFireWatchRequired', 
        label: 'Fire Watch Required', 
        type: 'select', 
        options: [
          { value: 'true', label: 'Yes' },
          { value: 'false', label: 'No' }
        ], 
        initialValue: dto.isFireWatchRequired?.toString() 
      },
      timeOfInitialTest: { 
        name: 'timeOfInitialTest', 
        label: 'Time of Initial Test', 
        type: 'time', 
        initialValue: dto.timeOfInitialTest 
      },
      initialTestResult: { 
        name: 'initialTestResult', 
        label: 'Initial Test Result', 
        type: 'text', 
        initialValue: dto.initialTestResult 
      },
      redTagNum: {
        name: 'redTagNum',
        label: 'Red Tag #',
        type: 'text',
        initialValue: dto.redTagNum
      },
      permitNumber: {
        name: 'permitNumber',
        label: 'Permit #',
        type: 'text',
        initialValue: dto.permitNumber
      },
      // ---- 2026-08-27 revision ----
      initialTestInitials: { name: 'initialTestInitials', label: 'Initial Test Initials', type: 'text', initialValue: dto.initialTestInitials },
      fireProtectionApprovalDateTime: { name: 'fireProtectionApprovalDateTime', label: 'Fire Protection Approval Date Time', type: 'date', initialValue: dto.fireProtectionApprovalDateTime },
      contMeterModel: { name: 'contMeterModel', label: 'Cont Meter Model', type: 'text', initialValue: dto.contMeterModel },
      contMeterNum: { name: 'contMeterNum', label: 'Cont Meter Num', type: 'text', initialValue: dto.contMeterNum },
      contMeterCalDate: { name: 'contMeterCalDate', label: 'Cont Meter Cal Date', type: 'date', initialValue: dto.contMeterCalDate },
      fireWatch1Hour: { name: 'fireWatch1Hour', label: 'Fire Watch 1 Hour', type: 'checkbox', initialValue: dto.fireWatch1Hour },
      fireWatch30Min: { name: 'fireWatch30Min', label: 'Fire Watch 30 Min', type: 'checkbox', initialValue: dto.fireWatch30Min },
      fireWatchNotRequired: { name: 'fireWatchNotRequired', label: 'Fire Watch Not Required', type: 'checkbox', initialValue: dto.fireWatchNotRequired },
      issuerSignature: { name: 'issuerSignature', label: 'Issuer Signature', type: 'text', initialValue: dto.issuerSignature },
      approvedDate: { name: 'approvedDate', label: 'Approved Date', type: 'date', initialValue: dto.approvedDate },
      approvedTime: { name: 'approvedTime', label: 'Approved Time', type: 'time', initialValue: dto.approvedTime },
      actualStartTime: { name: 'actualStartTime', label: 'Actual Start Time', type: 'time', initialValue: dto.actualStartTime },
      actualEndTime: { name: 'actualEndTime', label: 'Actual End Time', type: 'time', initialValue: dto.actualEndTime },
      cancelRequestorName: { name: 'cancelRequestorName', label: 'Cancel Requestor Name', type: 'text', initialValue: dto.cancelRequestorName },
      cancelRequestorSignature: { name: 'cancelRequestorSignature', label: 'Cancel Requestor Signature', type: 'text', initialValue: dto.cancelRequestorSignature },
      cancelRequestorDate: { name: 'cancelRequestorDate', label: 'Cancel Requestor Date', type: 'date', initialValue: dto.cancelRequestorDate },
      cancelRequestorTime: { name: 'cancelRequestorTime', label: 'Cancel Requestor Time', type: 'time', initialValue: dto.cancelRequestorTime },
      cancelFireWatchName: { name: 'cancelFireWatchName', label: 'Cancel Fire Watch Name', type: 'text', initialValue: dto.cancelFireWatchName },
      cancelFireWatchSignature: { name: 'cancelFireWatchSignature', label: 'Cancel Fire Watch Signature', type: 'text', initialValue: dto.cancelFireWatchSignature },
      cancelFireWatchDate: { name: 'cancelFireWatchDate', label: 'Cancel Fire Watch Date', type: 'date', initialValue: dto.cancelFireWatchDate },
      cancelFireWatchTime: { name: 'cancelFireWatchTime', label: 'Cancel Fire Watch Time', type: 'time', initialValue: dto.cancelFireWatchTime },
      fireMonitoringMethod: { name: 'fireMonitoringMethod', label: 'Fire Monitoring Method', type: 'text', initialValue: dto.fireMonitoringMethod },
      fireMonitorName: { name: 'fireMonitorName', label: 'Fire Monitor Name', type: 'text', initialValue: dto.fireMonitorName },
      fireMonitorSignature: { name: 'fireMonitorSignature', label: 'Fire Monitor Signature', type: 'text', initialValue: dto.fireMonitorSignature },
      fireMonitorDate: { name: 'fireMonitorDate', label: 'Fire Monitor Date', type: 'date', initialValue: dto.fireMonitorDate },
      fireMonitorTime: { name: 'fireMonitorTime', label: 'Fire Monitor Time', type: 'time', initialValue: dto.fireMonitorTime },
      cancelledBy: { name: 'cancelledBy', label: 'Cancelled By', type: 'text', initialValue: dto.cancelledBy },
      cancelledDate: { name: 'cancelledDate', label: 'Cancelled Date', type: 'date', initialValue: dto.cancelledDate },
      cancelledTime: { name: 'cancelledTime', label: 'Cancelled Time', type: 'time', initialValue: dto.cancelledTime },
      fireProtectionInService: { name: 'fireProtectionInService', label: 'Fire Protection In Service', type: 'checkbox', initialValue: dto.fireProtectionInService },
      fireProtectionNotInService: { name: 'fireProtectionNotInService', label: 'Fire Protection NOT In Service', type: 'checkbox', initialValue: dto.fireProtectionNotInService },
      workCompleted: { name: 'workCompleted', label: 'Work Completed', type: 'checkbox', initialValue: dto.workCompleted },
      'workType.welding': { name: 'workType.welding', label: 'Welding', type: 'checkbox', initialValue: dto.workType?.welding ?? false },
      'workType.griding': { name: 'workType.griding', label: 'Griding', type: 'checkbox', initialValue: dto.workType?.griding ?? false },
      'workType.cutting': { name: 'workType.cutting', label: 'Cutting', type: 'checkbox', initialValue: dto.workType?.cutting ?? false },
      'workType.brazing': { name: 'workType.brazing', label: 'Brazing', type: 'checkbox', initialValue: dto.workType?.brazing ?? false },
      'workType.other': { name: 'workType.other', label: 'Other', type: 'checkbox', initialValue: dto.workType?.other ?? false },
      'workType.otherDescription': { name: 'workType.otherDescription', label: 'Other (describe)', type: 'text', initialValue: dto.workType?.otherDescription ?? '' },
      ...measureFields,
    };
  
    return fields.map(fieldName => allFields[fieldName]).filter(Boolean);
  }

  static toTableColumns(fields: HotWorkFieldName[] = ['date', 'location', 'workScope', 'foreman', 'fireWatch']): Column[] {
    const allColumns: { [key in HotWorkFieldName]: Column } = {
      id: { id: 'id', header: 'ID', accessorKey: 'id' },
      date: { id: 'date', header: 'Date', accessorKey: 'date' },
      location: { id: 'location', header: 'Location', accessorKey: 'location' },
      workScope: { id: 'workScope', header: 'Work Scope', accessorKey: 'workScope' },
      foreman: { id: 'foreman', header: 'Foreman', accessorKey: 'foreman' },
      fireWatch: { id: 'fireWatch', header: 'Fire Watch', accessorKey: 'fireWatch' },
      meterModel: { id: 'meterModel', header: 'Meter Model', accessorKey: 'meterModel' },
      meterNum: { id: 'meterNum', header: 'Meter Number', accessorKey: 'meterNum' },
      meterCalDate: { id: 'meterCalDate', header: 'Meter Cal Date', accessorKey: 'meterCalDate' },
      redTagNum: { id: 'redTagNum', header: 'Red Tag #', accessorKey: 'redTagNum' },
      permitNumber: { id: 'permitNumber', header: 'Permit #', accessorKey: 'permitNumber' },
      initialTestInitials: { id: 'initialTestInitials', header: 'Initial Test Initials', accessorKey: 'initialTestInitials' },
      fireProtectionApprovalDateTime: { id: 'fireProtectionApprovalDateTime', header: 'Fire Protection Approval Date Time', accessorKey: 'fireProtectionApprovalDateTime' },
      contMeterModel: { id: 'contMeterModel', header: 'Cont Meter Model', accessorKey: 'contMeterModel' },
      contMeterNum: { id: 'contMeterNum', header: 'Cont Meter Num', accessorKey: 'contMeterNum' },
      contMeterCalDate: { id: 'contMeterCalDate', header: 'Cont Meter Cal Date', accessorKey: 'contMeterCalDate' },
      fireWatch1Hour: { id: 'fireWatch1Hour', header: 'Fire Watch 1 Hour', accessorKey: 'fireWatch1Hour' },
      fireWatch30Min: { id: 'fireWatch30Min', header: 'Fire Watch 30 Min', accessorKey: 'fireWatch30Min' },
      fireWatchNotRequired: { id: 'fireWatchNotRequired', header: 'Fire Watch Not Required', accessorKey: 'fireWatchNotRequired' },
      issuerSignature: { id: 'issuerSignature', header: 'Issuer Signature', accessorKey: 'issuerSignature' },
      approvedDate: { id: 'approvedDate', header: 'Approved Date', accessorKey: 'approvedDate' },
      approvedTime: { id: 'approvedTime', header: 'Approved Time', accessorKey: 'approvedTime' },
      actualStartTime: { id: 'actualStartTime', header: 'Actual Start Time', accessorKey: 'actualStartTime' },
      actualEndTime: { id: 'actualEndTime', header: 'Actual End Time', accessorKey: 'actualEndTime' },
      cancelRequestorName: { id: 'cancelRequestorName', header: 'Cancel Requestor Name', accessorKey: 'cancelRequestorName' },
      cancelRequestorSignature: { id: 'cancelRequestorSignature', header: 'Cancel Requestor Signature', accessorKey: 'cancelRequestorSignature' },
      cancelRequestorDate: { id: 'cancelRequestorDate', header: 'Cancel Requestor Date', accessorKey: 'cancelRequestorDate' },
      cancelRequestorTime: { id: 'cancelRequestorTime', header: 'Cancel Requestor Time', accessorKey: 'cancelRequestorTime' },
      cancelFireWatchName: { id: 'cancelFireWatchName', header: 'Cancel Fire Watch Name', accessorKey: 'cancelFireWatchName' },
      cancelFireWatchSignature: { id: 'cancelFireWatchSignature', header: 'Cancel Fire Watch Signature', accessorKey: 'cancelFireWatchSignature' },
      cancelFireWatchDate: { id: 'cancelFireWatchDate', header: 'Cancel Fire Watch Date', accessorKey: 'cancelFireWatchDate' },
      cancelFireWatchTime: { id: 'cancelFireWatchTime', header: 'Cancel Fire Watch Time', accessorKey: 'cancelFireWatchTime' },
      fireMonitoringMethod: { id: 'fireMonitoringMethod', header: 'Fire Monitoring Method', accessorKey: 'fireMonitoringMethod' },
      fireMonitorName: { id: 'fireMonitorName', header: 'Fire Monitor Name', accessorKey: 'fireMonitorName' },
      fireMonitorSignature: { id: 'fireMonitorSignature', header: 'Fire Monitor Signature', accessorKey: 'fireMonitorSignature' },
      fireMonitorDate: { id: 'fireMonitorDate', header: 'Fire Monitor Date', accessorKey: 'fireMonitorDate' },
      fireMonitorTime: { id: 'fireMonitorTime', header: 'Fire Monitor Time', accessorKey: 'fireMonitorTime' },
      cancelledBy: { id: 'cancelledBy', header: 'Cancelled By', accessorKey: 'cancelledBy' },
      cancelledDate: { id: 'cancelledDate', header: 'Cancelled Date', accessorKey: 'cancelledDate' },
      cancelledTime: { id: 'cancelledTime', header: 'Cancelled Time', accessorKey: 'cancelledTime' },
      fireProtectionInService: { id: 'fireProtectionInService', header: 'Fire Protection In Service', accessorKey: 'fireProtectionInService' },
      fireProtectionNotInService: { id: 'fireProtectionNotInService', header: 'Fire Protection NOT In Service', accessorKey: 'fireProtectionNotInService' },
      workCompleted: { id: 'workCompleted', header: 'Work Completed', accessorKey: 'workCompleted' },
      workType: { id: 'workType', header: 'Work Type', accessorKey: 'workType' },
      specialInstructions: { id: 'specialInstructions', header: 'Special Instructions', accessorKey: 'specialInstructions' },
      measures: { 
        id: 'measures', 
        header: 'Safety Measures', 
        accessorFn: (item: HotWorkDto) => item.measures ? 'Yes' : 'No'
      },
      name: { id: 'name', header: 'Name', accessorKey: 'name' },
      objectType: { id: 'objectType', header: 'Object Type', accessorKey: 'objectType' },
      isVerified: {
        id: 'isVerified',
        header: 'Verified',
        accessorFn: (item: HotWorkDto) => item.isVerified ? 'Yes' : 'No',
        conditionalStyling: (item: any, column: Column) => 
            item.isVerified ? { 'background-color': '#90EE90' } : { 'background-color': '#FFCCCB' }
      },
      isAirMonitoringRegisteredOnConfinedSpace: {
        id: 'isAirMonitoringRegisteredOnConfinedSpace',
        header: 'Air Mon. on CS',
        accessorFn: (item: HotWorkDto) => item.isAirMonitoringRegisteredOnConfinedSpace ? 'Yes' : 'No'
      },
      isFireWatchRequired: {
        id: 'isFireWatchRequired',
        header: 'Fire Watch Req.',
        accessorFn: (item: HotWorkDto) => item.isFireWatchRequired ? 'Yes' : 'No'
      },
      timeOfInitialTest: {
        id: 'timeOfInitialTest',
        header: 'Initial Test Time',
        accessorKey: 'timeOfInitialTest'
      },
      initialTestResult: {
        id: 'initialTestResult',
        header: 'Initial Test Result',
        accessorKey: 'initialTestResult'
      },
      permitStatus: {
        id: 'permitStatus',
        header: 'Status',
        accessorFn: (item: HotWorkDto) => item.permitStatus?.name || ''
      }
    };

    return fields.map(fieldName => allColumns[fieldName]);
  }
  
    static generatePermitFromRequest(request: WorkRequestDto, workArea?: WorkAreaDto | null, categoryProfile?: WorkCategoryProfileDto | null): HotWorkDto{
      const dto = new HotWorkDto({
        date: request.dateOfWorkToBePerformed?.split('T')[0],
        foreman: request.requestedBy,
        location: request.location,
        workScope: request.workScope,
        fireWatch: request.fireWatch
      });
      // Merge measures: category standard measures + work area constant measures (OR-union)
      dto.measures = mergeHotWorkMeasures(categoryProfile?.standardHotWorkMeasures, workArea?.constantHotWorkMeasures);
      return dto;
    }

    static formatLabel(key: string): string {
      const result = key.replace(/([A-Z])/g, ' $1');
      return result.charAt(0).toUpperCase() + result.slice(1);
    }
  
    static getHwMeasuresOptions(measures: HotWorkMeasures | null): Option[] {
      if(!measures) return [];
      // Get all keys from the hazards object in a type-safe way
      const hazardKeys = Object.keys(measures) as (keyof HotWorkMeasures)[];
  
      // Map over the keys to create the desired FormOption structure
      return hazardKeys.map(key => {
        return {
          label: this.formatLabel(key), // 'highTemp' -> 'High Temp'
          key:key,
          value: measures[key]    // The boolean value (true/false)
        };
      });
    }

  static getMeasureFields(measuresDto: HotWorkMeasures | null): { [key: string]: FormField } {
    const measures = measuresDto || new HotWorkMeasures();
    const group = { label: 'Safety Measures', orientation: 'vertical' } as const;
    return {
      'measures.areaIsClean': { name: 'measures.areaIsClean', label: 'Area is Clean', type: 'checkbox', initialValue: measures.areaIsClean, group: group },
      'measures.flammablesAreSecured': { name: 'measures.flammablesAreSecured', label: 'Flammables are Secured', type: 'checkbox', initialValue: measures.flammablesAreSecured, group: group },
      'measures.noCombustibleDustOrDebrisPresent': { name: 'measures.noCombustibleDustOrDebrisPresent', label: 'No Combustible Dust/Debris', type: 'checkbox', initialValue: measures.noCombustibleDustOrDebrisPresent, group: group },
      'measures.radiativeHeatPreventiveMeasuresAreTaken': { name: 'measures.radiativeHeatPreventiveMeasuresAreTaken', label: 'Radiative Heat Prevention Taken', type: 'checkbox', initialValue: measures.radiativeHeatPreventiveMeasuresAreTaken, group: group },
      'measures.vesselsArePurged': { name: 'measures.vesselsArePurged', label: 'Vessels are Purged', type: 'checkbox', initialValue: measures.vesselsArePurged, group: group },
      'measures.openingsAreCovered': { name: 'measures.openingsAreCovered', label: 'Openings are Covered', type: 'checkbox', initialValue: measures.openingsAreCovered, group: group },
      'measures.ductVentilationIsSecured': { name: 'measures.ductVentilationIsSecured', label: 'Duct Ventilation Secured', type: 'checkbox', initialValue: measures.ductVentilationIsSecured, group: group },
      'measures.lockOutIsCompleted': { name: 'measures.lockOutIsCompleted', label: 'Lock-Out Completed', type: 'checkbox', initialValue: measures.lockOutIsCompleted, group: group },
      'measures.communicationIsEstablished': { name: 'measures.communicationIsEstablished', label: 'Communication Established', type: 'checkbox', initialValue: measures.communicationIsEstablished, group: group },
      'measures.fireWatchIsAwareOfDuties': { name: 'measures.fireWatchIsAwareOfDuties', label: 'Fire Watch Aware of Duties', type: 'checkbox', initialValue: measures.fireWatchIsAwareOfDuties, group: group },
      'measures.fireExtinguisherPresent': { name: 'measures.fireExtinguisherPresent', label: 'Fire Extinguisher Present', type: 'checkbox', initialValue: measures.fireExtinguisherPresent, group: group },
      'measures.fireProtectionIsInService': { name: 'measures.fireProtectionIsInService', label: 'Fire Protection in Service', type: 'checkbox', initialValue: measures.fireProtectionIsInService, group: group },
    };
  }
}

/**
 * What kind of hot work a requester declared, plus the hexavalent chromium (Cr(VI)) assessment.
 *
 * Mirrors the Java `HotWorkProfile` POJO. Declared by the requester on the work request, read here
 * by the operator building the permits — this side never writes it.
 */
export class HotWorkProfile {
  welding: boolean = false;
  grinding: boolean = false;
  torchCutting: boolean = false;
  plasmaCutting: boolean = false;
  arcGouging: boolean = false;
  brazingSoldering: boolean = false;
  openFlameHeating: boolean = false;
  other: boolean = false;
  otherDescription: string = '';

  fumeLevel: string = '';
  chromeContent: string = '';

  constructor(data: Partial<HotWorkProfile> = {}) {
    Object.assign(this, data ?? {});
  }
}

/** Readable labels for the hot work types this profile has ticked. */
export function hotWorkTypeLabels(p: HotWorkProfile | null | undefined): string[] {
  if (!p) return [];
  const labels: [keyof HotWorkProfile, string][] = [
    ['welding', 'Welding'],
    ['grinding', 'Grinding'],
    ['torchCutting', 'Torch cutting'],
    ['plasmaCutting', 'Plasma cutting'],
    ['arcGouging', 'Arc gouging'],
    ['brazingSoldering', 'Brazing / soldering'],
    ['openFlameHeating', 'Open flame / heating'],
  ];
  const out = labels.filter(([k]) => p[k] === true).map(([, l]) => l);
  if (p.other) out.push(p.otherDescription ? `Other: ${p.otherDescription}` : 'Other');
  return out;
}

/** Worksheet tier as a readable phrase, e.g. "High (9)". Empty when unanswered. */
export function hotWorkTierLabel(tier: string | null | undefined): string {
  switch ((tier ?? '').toUpperCase()) {
    case 'HIGH': return 'High (9)';
    case 'MEDIUM': return 'Medium (3)';
    case 'LOW': return 'Low (1)';
    default: return '';
  }
}
