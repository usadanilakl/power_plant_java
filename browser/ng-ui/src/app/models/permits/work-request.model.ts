import { FormField } from "../inputs/form-field.model";

export interface IWorkRequest {
  id: number;
  sharepointId: string;
  status: string;
  company: string;
  dateOfWork: string;
  timeOfWork: string;
  locationOfWork: string;
  workRequestedBy: string;
  affectedEquipment: string;
  workScope: string;
  isLOTORequired: string;
  isHotWorkRequired: string;
  isConfinedSpaceEntryRequired: string;
  foremanName: string;
  fireWatchName: string;
  spaceToBeEntered: string;
}

export class WorkRequest implements IWorkRequest {
  id: number;
  sharepointId: string;
  status: string;
  company: string;
  dateOfWork: string;
  timeOfWork: string;
  locationOfWork: string;
  workRequestedBy: string;
  affectedEquipment: string;
  workScope: string;
  isLOTORequired: string;
  isHotWorkRequired: string;
  isConfinedSpaceEntryRequired: string;
  foremanName: string;
  fireWatchName: string;
  spaceToBeEntered: string;

  constructor(data: Partial<IWorkRequest> = {}) {
    this.id = data.id ?? 0;
    this.sharepointId = data.sharepointId ?? '';
    this.status = data.status ?? 'new';
    this.company = data.company ?? '';
    this.dateOfWork = data.dateOfWork ?? '';
    this.timeOfWork = data.timeOfWork ?? '';
    this.locationOfWork = data.locationOfWork ?? '';
    this.workRequestedBy = data.workRequestedBy ?? '';
    this.affectedEquipment = data.affectedEquipment ?? '';
    this.workScope = data.workScope ?? '';
    this.isLOTORequired = data.isLOTORequired ?? 'No';
    this.isHotWorkRequired = data.isHotWorkRequired ?? 'No';
    this.isConfinedSpaceEntryRequired = data.isConfinedSpaceEntryRequired ?? 'No';
    this.foremanName = data.foremanName ?? '';
    this.fireWatchName = data.fireWatchName ?? '';
    this.spaceToBeEntered = data.spaceToBeEntered ?? '';
  }

  toFormFields(options?: { fields?: (keyof IWorkRequest)[] }): FormField[] {
    const allFormFields: FormField[] = [
      { name: 'company', label: 'Company', type: 'text', initialValue: this.company },
      { name: 'dateOfWork', label: 'Date of Work', type: 'date', initialValue: this.dateOfWork },
      { name: 'timeOfWork', label: 'Time of Work', type: 'time', initialValue: this.timeOfWork },
      { name: 'locationOfWork', label: 'Location of Work', type: 'text', initialValue: this.locationOfWork },
      { name: 'workRequestedBy', label: 'Work Requested By', type: 'text', initialValue: this.workRequestedBy },
      { name: 'affectedEquipment', label: 'Affected Equipment', type: 'text', initialValue: this.affectedEquipment },
      { name: 'workScope', label: 'Work Scope', type: 'textarea', initialValue: this.workScope },
      { name: 'isLOTORequired', label: 'LOTO Required?', type: 'radio-group', initialValue: this.isLOTORequired, options: [{label: 'Yes', value: 'Yes'}, {label: 'No', value: 'No'}] },
      { name: 'isHotWorkRequired', label: 'Hot Work Required?', type: 'radio-group', initialValue: this.isHotWorkRequired, options: [{label: 'Yes', value: 'Yes'}, {label: 'No', value: 'No'}] },
      { name: 'isConfinedSpaceEntryRequired', label: 'Confined Space Entry Required?', type: 'radio-group', initialValue: this.isConfinedSpaceEntryRequired, options: [{label: 'Yes', value: 'Yes'}, {label: 'No', value: 'No'}] },
    ];

    if (options?.fields) {
      return allFormFields.filter(field => options.fields!.includes(field.name as keyof IWorkRequest));
    }

    return allFormFields;
  }
}