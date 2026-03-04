
import { Validators } from '@angular/forms';
import { BaseDto, BaseModel } from '../base/base.model';
import { Column } from '../column.model';
import { FormField } from '../ui/form-field.model';
import { WorkAreaDto } from './work-area.model';
import { WorkRequestDto } from './work-request.model';

export class VentingChecklist {
  personnelReadProcedure: boolean = false;
  personnelReadProcedureInitials: string = '';
  barricadeInPlace: boolean = false;
  barricadeInPlaceInitials: string = '';
  firefightingEquipment: boolean = false;
  firefightingEquipmentInitials: string = '';
  sparkProhibited: boolean = false;
  sparkProhibitedInitials: string = '';
  groundingStrapsInstalled: boolean = false;
  groundingStrapsInstalledInitials: string = '';
  combustibleGasIndicatorInPlace: boolean = false;
  combustibleGasIndicatorInPlaceInitials: string = '';
  reachedLessThan10PercentLEL: boolean = false;
  reachedLelInitials: string = '';
  indicatedPercentage: string = '';
  nonSparkingToolsUsed: boolean = false;
  nonSparkingToolsInitials: string = '';
  deviationsUnderstood: boolean = false;
  deviationsUnderstoodInitials: string = '';
  personnelNames: string = '';
  constructor(data: Partial<VentingChecklist> = {}) { Object.assign(this, data); }
}

export type VentingPermitFieldName = keyof VentingPermitModel;

export interface VentingPermitModel extends BaseModel {
  date: string | null;
  time: string | null;
  location: string | null;
  issuedTo: string | null;
  workScope: string | null;
  redTagNum: string | null;
  permitNumber: string | null;
  workArea: WorkAreaDto | null;
  plantName: string | null;
  systemName: string | null;
  requestingIndividual: string | null;
  purpose: string | null;
  timeCommence: string | null;
  timeConclude: string | null;
  individualIssuing: string | null;
  gasType: string | null;
  lel: string | null;
  uel: string | null;
  calculatedVolume: string | null;
  pressure: string | null;
  gasIndicatorModel: string | null;
  gasIndicatorSerial: string | null;
  calibrationDate: string | null;
  sdsProvided: boolean;
  sdsInitials: string | null;
  generalArrangementProvided: boolean;
  generalArrangementInitials: string | null;
  hazardousClassificationDrawing: boolean;
  hazardousClassificationInitials: string | null;
  pidWithValves: boolean;
  pidInitials: string | null;
  drawingNumbers: string | null;
  stackDescription: string | null;
  equipmentToBeDeenergized: string | null;
  lotoDescription: string | null;
  radioChannel: string | null;
  controlRoom: string | null;
  osmSupervisor: string | null;
  osmDate: string | null;
  plantManager: string | null;
  plantManagerDate: string | null;
  divisionDirector: string | null;
  divisionDirectorDate: string | null;
  checklist: VentingChecklist | null;
}

export class VentingPermitDto extends BaseDto implements VentingPermitModel {
  date: string | null;
  time: string | null;
  location: string | null;
  issuedTo: string | null;
  workScope: string | null;
  redTagNum: string | null;
  permitNumber: string | null;
  workArea: WorkAreaDto | null;
  plantName: string | null;
  systemName: string | null;
  requestingIndividual: string | null;
  purpose: string | null;
  timeCommence: string | null;
  timeConclude: string | null;
  individualIssuing: string | null;
  gasType: string | null;
  lel: string | null;
  uel: string | null;
  calculatedVolume: string | null;
  pressure: string | null;
  gasIndicatorModel: string | null;
  gasIndicatorSerial: string | null;
  calibrationDate: string | null;
  sdsProvided: boolean;
  sdsInitials: string | null;
  generalArrangementProvided: boolean;
  generalArrangementInitials: string | null;
  hazardousClassificationDrawing: boolean;
  hazardousClassificationInitials: string | null;
  pidWithValves: boolean;
  pidInitials: string | null;
  drawingNumbers: string | null;
  stackDescription: string | null;
  equipmentToBeDeenergized: string | null;
  lotoDescription: string | null;
  radioChannel: string | null;
  controlRoom: string | null;
  osmSupervisor: string | null;
  osmDate: string | null;
  plantManager: string | null;
  plantManagerDate: string | null;
  divisionDirector: string | null;
  divisionDirectorDate: string | null;
  checklist: VentingChecklist | null;

  constructor(data: Partial<VentingPermitModel> = {}) {
    super(data);
    this.date = data.date ?? null;
    this.time = data.time ?? null;
    this.location = data.location ?? null;
    this.issuedTo = data.issuedTo ?? null;
    this.workScope = data.workScope ?? null;
    this.redTagNum = data.redTagNum ?? null;
    this.permitNumber = data.permitNumber ?? null;
    this.workArea = data.workArea ? new WorkAreaDto(data.workArea) : null;
    this.plantName = data.plantName ?? null;
    this.systemName = data.systemName ?? null;
    this.requestingIndividual = data.requestingIndividual ?? null;
    this.purpose = data.purpose ?? null;
    this.timeCommence = data.timeCommence ?? null;
    this.timeConclude = data.timeConclude ?? null;
    this.individualIssuing = data.individualIssuing ?? null;
    this.gasType = data.gasType ?? null;
    this.lel = data.lel ?? null;
    this.uel = data.uel ?? null;
    this.calculatedVolume = data.calculatedVolume ?? null;
    this.pressure = data.pressure ?? null;
    this.gasIndicatorModel = data.gasIndicatorModel ?? null;
    this.gasIndicatorSerial = data.gasIndicatorSerial ?? null;
    this.calibrationDate = data.calibrationDate ?? null;
    this.sdsProvided = data.sdsProvided ?? false;
    this.sdsInitials = data.sdsInitials ?? null;
    this.generalArrangementProvided = data.generalArrangementProvided ?? false;
    this.generalArrangementInitials = data.generalArrangementInitials ?? null;
    this.hazardousClassificationDrawing = data.hazardousClassificationDrawing ?? false;
    this.hazardousClassificationInitials = data.hazardousClassificationInitials ?? null;
    this.pidWithValves = data.pidWithValves ?? false;
    this.pidInitials = data.pidInitials ?? null;
    this.drawingNumbers = data.drawingNumbers ?? null;
    this.stackDescription = data.stackDescription ?? null;
    this.equipmentToBeDeenergized = data.equipmentToBeDeenergized ?? null;
    this.lotoDescription = data.lotoDescription ?? null;
    this.radioChannel = data.radioChannel ?? null;
    this.controlRoom = data.controlRoom ?? null;
    this.osmSupervisor = data.osmSupervisor ?? null;
    this.osmDate = data.osmDate ?? null;
    this.plantManager = data.plantManager ?? null;
    this.plantManagerDate = data.plantManagerDate ?? null;
    this.divisionDirector = data.divisionDirector ?? null;
    this.divisionDirectorDate = data.divisionDirectorDate ?? null;
    this.checklist = data.checklist ? new VentingChecklist(data.checklist) : null;
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
      plantName: this.plantName,
      systemName: this.systemName,
      requestingIndividual: this.requestingIndividual,
      purpose: this.purpose,
      timeCommence: this.timeCommence,
      timeConclude: this.timeConclude,
      individualIssuing: this.individualIssuing,
      gasType: this.gasType,
      lel: this.lel,
      uel: this.uel,
      calculatedVolume: this.calculatedVolume,
      pressure: this.pressure,
      gasIndicatorModel: this.gasIndicatorModel,
      gasIndicatorSerial: this.gasIndicatorSerial,
      calibrationDate: this.calibrationDate,
      sdsProvided: this.sdsProvided,
      sdsInitials: this.sdsInitials,
      generalArrangementProvided: this.generalArrangementProvided,
      generalArrangementInitials: this.generalArrangementInitials,
      hazardousClassificationDrawing: this.hazardousClassificationDrawing,
      hazardousClassificationInitials: this.hazardousClassificationInitials,
      pidWithValves: this.pidWithValves,
      pidInitials: this.pidInitials,
      drawingNumbers: this.drawingNumbers,
      stackDescription: this.stackDescription,
      equipmentToBeDeenergized: this.equipmentToBeDeenergized,
      lotoDescription: this.lotoDescription,
      radioChannel: this.radioChannel,
      controlRoom: this.controlRoom,
      osmSupervisor: this.osmSupervisor,
      osmDate: this.osmDate,
      plantManager: this.plantManager,
      plantManagerDate: this.plantManagerDate,
      divisionDirector: this.divisionDirector,
      divisionDirectorDate: this.divisionDirectorDate,
      checklist: this.checklist,
    };
  }

  static override fromJson(json: any): VentingPermitDto {
    if (!json) return new VentingPermitDto();
    return new VentingPermitDto({
      ...super.fromJson(json),
      date: json.date,
      time: json.time,
      location: json.location,
      issuedTo: json.issuedTo,
      workScope: json.workScope,
      redTagNum: json.redTagNum,
      permitNumber: json.permitNumber,
      workArea: json.workArea ? WorkAreaDto.fromJson(json.workArea) : null,
      plantName: json.plantName,
      systemName: json.systemName,
      requestingIndividual: json.requestingIndividual,
      purpose: json.purpose,
      timeCommence: json.timeCommence,
      timeConclude: json.timeConclude,
      individualIssuing: json.individualIssuing,
      gasType: json.gasType,
      lel: json.lel,
      uel: json.uel,
      calculatedVolume: json.calculatedVolume,
      pressure: json.pressure,
      gasIndicatorModel: json.gasIndicatorModel,
      gasIndicatorSerial: json.gasIndicatorSerial,
      calibrationDate: json.calibrationDate,
      sdsProvided: json.sdsProvided ?? false,
      sdsInitials: json.sdsInitials,
      generalArrangementProvided: json.generalArrangementProvided ?? false,
      generalArrangementInitials: json.generalArrangementInitials,
      hazardousClassificationDrawing: json.hazardousClassificationDrawing ?? false,
      hazardousClassificationInitials: json.hazardousClassificationInitials,
      pidWithValves: json.pidWithValves ?? false,
      pidInitials: json.pidInitials,
      drawingNumbers: json.drawingNumbers,
      stackDescription: json.stackDescription,
      equipmentToBeDeenergized: json.equipmentToBeDeenergized,
      lotoDescription: json.lotoDescription,
      radioChannel: json.radioChannel,
      controlRoom: json.controlRoom,
      osmSupervisor: json.osmSupervisor,
      osmDate: json.osmDate,
      plantManager: json.plantManager,
      plantManagerDate: json.plantManagerDate,
      divisionDirector: json.divisionDirector,
      divisionDirectorDate: json.divisionDirectorDate,
      checklist: json.checklist ? new VentingChecklist(json.checklist) : null,
    });
  }

  static getDocumentationFields(dto: VentingPermitDto): { [key: string]: FormField } {
    const group = { label: 'Documentation Provided', orientation: 'vertical' } as const;
    return {
      'sdsProvided': { name: 'sdsProvided', label: 'SDS Provided', type: 'checkbox', initialValue: dto.sdsProvided, group },
      'sdsInitials': { name: 'sdsInitials', label: 'SDS Initials', type: 'text', initialValue: dto.sdsInitials, showWhen: { field: 'sdsProvided', value: true } },
      'generalArrangementProvided': { name: 'generalArrangementProvided', label: 'General Arrangement Provided', type: 'checkbox', initialValue: dto.generalArrangementProvided, group },
      'generalArrangementInitials': { name: 'generalArrangementInitials', label: 'General Arrangement Initials', type: 'text', initialValue: dto.generalArrangementInitials, showWhen: { field: 'generalArrangementProvided', value: true } },
      'hazardousClassificationDrawing': { name: 'hazardousClassificationDrawing', label: 'Hazardous Classification Drawing', type: 'checkbox', initialValue: dto.hazardousClassificationDrawing, group },
      'hazardousClassificationInitials': { name: 'hazardousClassificationInitials', label: 'Hazardous Classification Initials', type: 'text', initialValue: dto.hazardousClassificationInitials, showWhen: { field: 'hazardousClassificationDrawing', value: true } },
      'pidWithValves': { name: 'pidWithValves', label: 'P&ID with Valves', type: 'checkbox', initialValue: dto.pidWithValves, group },
      'pidInitials': { name: 'pidInitials', label: 'P&ID Initials', type: 'text', initialValue: dto.pidInitials, showWhen: { field: 'pidWithValves', value: true } },
    };
  }

  static getChecklistFields(checklistDto: VentingChecklist | null): { [key: string]: FormField } {
    const checklist = checklistDto || new VentingChecklist();
    const group = { label: 'Venting Checklist', orientation: 'vertical' } as const;
    return {
      'checklist.personnelReadProcedure': { name: 'checklist.personnelReadProcedure', label: 'Personnel Read Procedure', type: 'checkbox', initialValue: checklist.personnelReadProcedure, group },
      'checklist.personnelReadProcedureInitials': { name: 'checklist.personnelReadProcedureInitials', label: 'Initials', type: 'text', initialValue: checklist.personnelReadProcedureInitials },
      'checklist.barricadeInPlace': { name: 'checklist.barricadeInPlace', label: 'Barricade in Place', type: 'checkbox', initialValue: checklist.barricadeInPlace, group },
      'checklist.barricadeInPlaceInitials': { name: 'checklist.barricadeInPlaceInitials', label: 'Initials', type: 'text', initialValue: checklist.barricadeInPlaceInitials },
      'checklist.firefightingEquipment': { name: 'checklist.firefightingEquipment', label: 'Firefighting Equipment', type: 'checkbox', initialValue: checklist.firefightingEquipment, group },
      'checklist.firefightingEquipmentInitials': { name: 'checklist.firefightingEquipmentInitials', label: 'Initials', type: 'text', initialValue: checklist.firefightingEquipmentInitials },
      'checklist.sparkProhibited': { name: 'checklist.sparkProhibited', label: 'Spark Prohibited', type: 'checkbox', initialValue: checklist.sparkProhibited, group },
      'checklist.sparkProhibitedInitials': { name: 'checklist.sparkProhibitedInitials', label: 'Initials', type: 'text', initialValue: checklist.sparkProhibitedInitials },
      'checklist.groundingStrapsInstalled': { name: 'checklist.groundingStrapsInstalled', label: 'Grounding Straps Installed', type: 'checkbox', initialValue: checklist.groundingStrapsInstalled, group },
      'checklist.groundingStrapsInstalledInitials': { name: 'checklist.groundingStrapsInstalledInitials', label: 'Initials', type: 'text', initialValue: checklist.groundingStrapsInstalledInitials },
      'checklist.combustibleGasIndicatorInPlace': { name: 'checklist.combustibleGasIndicatorInPlace', label: 'Combustible Gas Indicator in Place', type: 'checkbox', initialValue: checklist.combustibleGasIndicatorInPlace, group },
      'checklist.combustibleGasIndicatorInPlaceInitials': { name: 'checklist.combustibleGasIndicatorInPlaceInitials', label: 'Initials', type: 'text', initialValue: checklist.combustibleGasIndicatorInPlaceInitials },
      'checklist.reachedLessThan10PercentLEL': { name: 'checklist.reachedLessThan10PercentLEL', label: 'Reached < 10% LEL', type: 'checkbox', initialValue: checklist.reachedLessThan10PercentLEL, group },
      'checklist.reachedLelInitials': { name: 'checklist.reachedLelInitials', label: 'Initials', type: 'text', initialValue: checklist.reachedLelInitials },
      'checklist.indicatedPercentage': { name: 'checklist.indicatedPercentage', label: 'Indicated Percentage', type: 'text', initialValue: checklist.indicatedPercentage },
      'checklist.nonSparkingToolsUsed': { name: 'checklist.nonSparkingToolsUsed', label: 'Non-Sparking Tools Used', type: 'checkbox', initialValue: checklist.nonSparkingToolsUsed, group },
      'checklist.nonSparkingToolsInitials': { name: 'checklist.nonSparkingToolsInitials', label: 'Initials', type: 'text', initialValue: checklist.nonSparkingToolsInitials },
      'checklist.deviationsUnderstood': { name: 'checklist.deviationsUnderstood', label: 'Deviations Understood', type: 'checkbox', initialValue: checklist.deviationsUnderstood, group },
      'checklist.deviationsUnderstoodInitials': { name: 'checklist.deviationsUnderstoodInitials', label: 'Initials', type: 'text', initialValue: checklist.deviationsUnderstoodInitials },
      'checklist.personnelNames': { name: 'checklist.personnelNames', label: 'Personnel Names', type: 'textarea', initialValue: checklist.personnelNames },
    };
  }

  static toFormFields(
    dto: VentingPermitDto,
    fields: (VentingPermitFieldName | 'workArea')[] = [
      'workArea', 'date', 'plantName', 'systemName', 'requestingIndividual',
      'purpose', 'timeCommence', 'timeConclude', 'gasType', 'lel', 'uel',
      'calculatedVolume', 'pressure', 'gasIndicatorModel', 'gasIndicatorSerial',
      'calibrationDate', 'stackDescription', 'equipmentToBeDeenergized',
      'lotoDescription', 'radioChannel', 'controlRoom',
      ...Object.keys(VentingPermitDto.getDocumentationFields(new VentingPermitDto())) as VentingPermitFieldName[],
      ...Object.keys(VentingPermitDto.getChecklistFields(null)) as VentingPermitFieldName[],
    ]
  ): FormField[] {
    const documentationFields = VentingPermitDto.getDocumentationFields(dto);
    const checklistFields = VentingPermitDto.getChecklistFields(dto.checklist);
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
      plantName: { name: 'plantName', label: 'Plant Name', type: 'text', initialValue: dto.plantName },
      systemName: { name: 'systemName', label: 'System Name', type: 'text', validators: [Validators.required], initialValue: dto.systemName },
      requestingIndividual: { name: 'requestingIndividual', label: 'Requesting Individual', type: 'text', validators: [Validators.required], initialValue: dto.requestingIndividual },
      purpose: { name: 'purpose', label: 'Purpose', type: 'textarea', validators: [Validators.required], initialValue: dto.purpose },
      timeCommence: { name: 'timeCommence', label: 'Time Commence', type: 'time', initialValue: dto.timeCommence },
      timeConclude: { name: 'timeConclude', label: 'Time Conclude', type: 'time', initialValue: dto.timeConclude },
      individualIssuing: { name: 'individualIssuing', label: 'Individual Issuing', type: 'text', initialValue: dto.individualIssuing },
      gasType: { name: 'gasType', label: 'Gas Type', type: 'text', initialValue: dto.gasType },
      lel: { name: 'lel', label: 'LEL', type: 'text', initialValue: dto.lel },
      uel: { name: 'uel', label: 'UEL', type: 'text', initialValue: dto.uel },
      calculatedVolume: { name: 'calculatedVolume', label: 'Calculated Volume', type: 'text', initialValue: dto.calculatedVolume },
      pressure: { name: 'pressure', label: 'Pressure', type: 'text', initialValue: dto.pressure },
      gasIndicatorModel: { name: 'gasIndicatorModel', label: 'Gas Indicator Model', type: 'text', initialValue: dto.gasIndicatorModel },
      gasIndicatorSerial: { name: 'gasIndicatorSerial', label: 'Gas Indicator Serial', type: 'text', initialValue: dto.gasIndicatorSerial },
      calibrationDate: { name: 'calibrationDate', label: 'Calibration Date', type: 'date', initialValue: dto.calibrationDate },
      drawingNumbers: { name: 'drawingNumbers', label: 'Drawing Numbers', type: 'text', initialValue: dto.drawingNumbers },
      stackDescription: { name: 'stackDescription', label: 'Stack Description', type: 'textarea', initialValue: dto.stackDescription },
      equipmentToBeDeenergized: { name: 'equipmentToBeDeenergized', label: 'Equipment to be De-energized', type: 'textarea', initialValue: dto.equipmentToBeDeenergized },
      lotoDescription: { name: 'lotoDescription', label: 'LOTO Description', type: 'textarea', initialValue: dto.lotoDescription },
      radioChannel: { name: 'radioChannel', label: 'Radio Channel', type: 'text', initialValue: dto.radioChannel },
      controlRoom: { name: 'controlRoom', label: 'Control Room', type: 'text', initialValue: dto.controlRoom },
      osmSupervisor: { name: 'osmSupervisor', label: 'OSM/Supervisor', type: 'text', initialValue: dto.osmSupervisor },
      osmDate: { name: 'osmDate', label: 'OSM Date', type: 'date', initialValue: dto.osmDate },
      plantManager: { name: 'plantManager', label: 'Plant Manager', type: 'text', initialValue: dto.plantManager },
      plantManagerDate: { name: 'plantManagerDate', label: 'Plant Manager Date', type: 'date', initialValue: dto.plantManagerDate },
      divisionDirector: { name: 'divisionDirector', label: 'Division Director', type: 'text', initialValue: dto.divisionDirector },
      divisionDirectorDate: { name: 'divisionDirectorDate', label: 'Division Director Date', type: 'date', initialValue: dto.divisionDirectorDate },
      name: { name: 'name', label: 'Name', type: 'text', initialValue: dto.name },
      objectType: { name: 'objectType', label: 'Object Type', type: 'text', initialValue: dto.objectType },
      ...documentationFields,
      ...checklistFields,
    };
    return fields.map(f => allFields[f]).filter((f): f is FormField => f !== undefined);
  }

  static toTableColumns(
    fields: VentingPermitFieldName[] = ['permitNumber', 'date', 'systemName', 'requestingIndividual', 'purpose']
  ): Column[] {
    const allColumns: { [key in VentingPermitFieldName]?: Column } = {
      id: { id: 'id', header: 'ID', accessorKey: 'id' },
      name: { id: 'name', header: 'Name', accessorKey: 'name' },
      date: { id: 'date', header: 'Date', accessorKey: 'date' },
      time: { id: 'time', header: 'Time', accessorKey: 'time' },
      location: { id: 'location', header: 'Location', accessorKey: 'location' },
      issuedTo: { id: 'issuedTo', header: 'Issued To', accessorKey: 'issuedTo' },
      workScope: { id: 'workScope', header: 'Work Scope', accessorKey: 'workScope' },
      permitNumber: { id: 'permitNumber', header: 'Permit #', accessorKey: 'permitNumber' },
      plantName: { id: 'plantName', header: 'Plant Name', accessorKey: 'plantName' },
      systemName: { id: 'systemName', header: 'System Name', accessorKey: 'systemName' },
      requestingIndividual: { id: 'requestingIndividual', header: 'Requester', accessorKey: 'requestingIndividual' },
      purpose: { id: 'purpose', header: 'Purpose', accessorKey: 'purpose' },
      timeCommence: { id: 'timeCommence', header: 'Commence', accessorKey: 'timeCommence' },
      timeConclude: { id: 'timeConclude', header: 'Conclude', accessorKey: 'timeConclude' },
      individualIssuing: { id: 'individualIssuing', header: 'Issued By', accessorKey: 'individualIssuing' },
      gasType: { id: 'gasType', header: 'Gas Type', accessorKey: 'gasType' },
      lel: { id: 'lel', header: 'LEL', accessorKey: 'lel' },
      uel: { id: 'uel', header: 'UEL', accessorKey: 'uel' },
      calculatedVolume: { id: 'calculatedVolume', header: 'Volume', accessorKey: 'calculatedVolume' },
      pressure: { id: 'pressure', header: 'Pressure', accessorKey: 'pressure' },
      gasIndicatorModel: { id: 'gasIndicatorModel', header: 'Indicator Model', accessorKey: 'gasIndicatorModel' },
      gasIndicatorSerial: { id: 'gasIndicatorSerial', header: 'Indicator Serial', accessorKey: 'gasIndicatorSerial' },
      calibrationDate: { id: 'calibrationDate', header: 'Calibration Date', accessorKey: 'calibrationDate' },
      sdsProvided: {
        id: 'sdsProvided',
        header: 'SDS',
        accessorFn: (item: VentingPermitDto) => item.sdsProvided ? 'Yes' : 'No',
      },
      generalArrangementProvided: {
        id: 'generalArrangementProvided',
        header: 'Gen. Arrangement',
        accessorFn: (item: VentingPermitDto) => item.generalArrangementProvided ? 'Yes' : 'No',
      },
      hazardousClassificationDrawing: {
        id: 'hazardousClassificationDrawing',
        header: 'Haz. Classification',
        accessorFn: (item: VentingPermitDto) => item.hazardousClassificationDrawing ? 'Yes' : 'No',
      },
      pidWithValves: {
        id: 'pidWithValves',
        header: 'P&ID',
        accessorFn: (item: VentingPermitDto) => item.pidWithValves ? 'Yes' : 'No',
      },
      stackDescription: { id: 'stackDescription', header: 'Stack Description', accessorKey: 'stackDescription' },
      equipmentToBeDeenergized: { id: 'equipmentToBeDeenergized', header: 'Equipment De-energized', accessorKey: 'equipmentToBeDeenergized' },
      lotoDescription: { id: 'lotoDescription', header: 'LOTO', accessorKey: 'lotoDescription' },
      radioChannel: { id: 'radioChannel', header: 'Radio Channel', accessorKey: 'radioChannel' },
      controlRoom: { id: 'controlRoom', header: 'Control Room', accessorKey: 'controlRoom' },
      osmSupervisor: { id: 'osmSupervisor', header: 'OSM/Supervisor', accessorKey: 'osmSupervisor' },
      osmDate: { id: 'osmDate', header: 'OSM Date', accessorKey: 'osmDate' },
      plantManager: { id: 'plantManager', header: 'Plant Manager', accessorKey: 'plantManager' },
      plantManagerDate: { id: 'plantManagerDate', header: 'PM Date', accessorKey: 'plantManagerDate' },
      divisionDirector: { id: 'divisionDirector', header: 'Division Director', accessorKey: 'divisionDirector' },
      divisionDirectorDate: { id: 'divisionDirectorDate', header: 'DD Date', accessorKey: 'divisionDirectorDate' },
      checklist: {
        id: 'checklist',
        header: 'Checklist',
        accessorFn: (item: VentingPermitDto) => item.checklist ? 'Complete' : 'N/A',
      },
    };
    return fields.map(f => allColumns[f]).filter((c): c is Column => c !== undefined);
  }

  static generatePermitFromRequest(request: WorkRequestDto): VentingPermitDto {
    return new VentingPermitDto({
      date: request.dateOfWorkToBePerformed?.split('T')[0] ?? null,
      location: request.location,
      workScope: request.workScope,
      requestingIndividual: request.requestedBy,
    });
  }

  static isValidKey(key: string): key is keyof VentingPermitModel {
    return ['id', 'name', 'objectType', 'isVerified', 'date', 'time', 'location',
      'issuedTo', 'workScope', 'redTagNum', 'permitNumber', 'workArea',
      'plantName', 'systemName', 'requestingIndividual', 'purpose',
      'timeCommence', 'timeConclude', 'individualIssuing',
      'gasType', 'lel', 'uel', 'calculatedVolume', 'pressure',
      'gasIndicatorModel', 'gasIndicatorSerial', 'calibrationDate',
      'sdsProvided', 'sdsInitials', 'generalArrangementProvided', 'generalArrangementInitials',
      'hazardousClassificationDrawing', 'hazardousClassificationInitials', 'pidWithValves', 'pidInitials',
      'drawingNumbers', 'stackDescription', 'equipmentToBeDeenergized', 'lotoDescription',
      'radioChannel', 'controlRoom',
      'osmSupervisor', 'osmDate', 'plantManager', 'plantManagerDate',
      'divisionDirector', 'divisionDirectorDate', 'checklist'].includes(key);
  }
}
