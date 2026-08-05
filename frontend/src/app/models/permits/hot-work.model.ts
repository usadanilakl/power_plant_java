
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
      permitStatus: this.permitStatus?.toJson() ?? null,
    };
  }

  static override fromJson(json: any): HotWorkDto {
    return new HotWorkDto({
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
      permitStatus: ValueDto.fromJson(json.permitStatus),
    });
  }

  static isValidKey(key: string): key is keyof HotWorkModel {
    return [
      'id', 'date', 'location', 'workScope', 'foreman', 'fireWatch',
      'meterModel', 'meterNum', 'meterCalDate', 'specialInstructions', 'measures',
      'isAirMonitoringRegisteredOnConfinedSpace', 'isFireWatchRequired',
      'timeOfInitialTest', 'initialTestResult', 'redTagNum', 'permitNumber',
      'isVerified', 'name', 'objectType'
    ].includes(key);
  }

  static toFormFields(
    dto: HotWorkDto,
    locationOptions: Option[] = [],
    fields: (HotWorkFieldName | 'workArea')[] = [
      'location', 'date', 'workScope', 'foreman', 'fireWatch',
      'meterModel', 'meterNum', 'specialInstructions',
      ...Object.keys(HotWorkDto.getMeasureFields(null)) as HotWorkFieldName[],
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
      ...measureFields,
    };
  
    return fields.map(fieldName => allFields[fieldName]);
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