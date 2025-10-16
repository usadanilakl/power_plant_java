import { Validators } from "@angular/forms";
import { FormField } from "../inputs/form-field.model";
import { BaseModel, IBaseModel } from "./base.model";
import { futureOrPresentDateValidator } from "../../shared/forms/validators/date.validators";
import { WorkRequestPa } from "./work-request-pa.model";

export interface IWorkRequest extends IBaseModel {
  id: number;
  sharepointId: string;
  company: string;
  dateOfWork: Date;
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

export class WorkRequest extends BaseModel<IWorkRequest> implements IWorkRequest {
  id: number;
  sharepointId: string;
  company: string;
  dateOfWork: Date;
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
    super(data);
    this.id = data.id ?? 0;
    this.sharepointId = data.sharepointId ?? '';
    this.company = data.company ?? '';
    this.dateOfWork = data.dateOfWork ? new Date(data.dateOfWork) : new Date();
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

  getFormFields(): FormField[] {
    return [
      { name: 'company', label: 'Company', type: 'text', initialValue: this.company },
      {
        name: 'dateOfWork',
        label: 'Date of Work',
        type: 'date',
        initialValue: this.dateOfWork.toISOString().split('T')[0],
        validators: [Validators.required, futureOrPresentDateValidator()]
      },
      { name: 'timeOfWork', label: 'Time of Work', type: 'time', initialValue: this.timeOfWork },
      { name: 'locationOfWork', label: 'Location of Work', type: 'text', initialValue: this.locationOfWork },
      { name: 'workRequestedBy', label: 'Work Requested By', type: 'text', initialValue: this.workRequestedBy },
      { name: 'affectedEquipment', label: 'Affected Equipment', type: 'text', initialValue: this.affectedEquipment },
      { name: 'workScope', label: 'Work Scope', type: 'textarea', initialValue: this.workScope },
      { name: 'isLOTORequired', label: 'LOTO Required?', type: 'radio-group', initialValue: this.isLOTORequired, options: [{label: 'Yes', value: 'Yes'}, {label: 'No', value: 'No'}] },
      { name: 'isHotWorkRequired', label: 'Hot Work Required?', type: 'radio-group', initialValue: this.isHotWorkRequired, options: [{label: 'Yes', value: 'Yes'}, {label: 'No', value: 'No'}] },
      {
        name: 'foremanName',
        label: 'Foreman Name',
        type: 'text',
        initialValue: this.foremanName,
        showWhen: { field: 'isHotWorkRequired', value: 'Yes' }
      },
      {
        name: 'fireWatchName',
        label: 'Fire Watch Name',
        type: 'text',
        initialValue: this.fireWatchName,
        showWhen: { field: 'isHotWorkRequired', value: 'Yes' }
      },
      { name: 'isConfinedSpaceEntryRequired', label: 'Confined Space Entry Required?', type: 'radio-group', initialValue: this.isConfinedSpaceEntryRequired, options: [{label: 'Yes', value: 'Yes'}, {label: 'No', value: 'No'}] },
      {
        name: 'spaceToBeEntered',
        label: 'Space to be Entered',
        type: 'text',
        initialValue: this.spaceToBeEntered,
        showWhen: { field: 'isConfinedSpaceEntryRequired', value: 'Yes' }
      },
    ];
  }

  convertToPaModel(): WorkRequestPa {

    return new WorkRequestPa({
      company: this.company,
      dateOfWork: this.dateOfWork.toISOString().split('T')[0],
      timeOfWork: this.timeOfWork,
      locationOfWork: this.locationOfWork,
      workRequestedBy: this.workRequestedBy,
      affectedEquipment: this.affectedEquipment,
      workScope: this.workScope,
      isLOTORequired: this.isLOTORequired,
      isHotWorkRequired: this.isHotWorkRequired,
      isConfinedSpaceEntryRequired: this.isConfinedSpaceEntryRequired,
      foremanName: this.foremanName,
      fireWatchName: this.fireWatchName,
      spaceToBeEntered: this.spaceToBeEntered
    });
  }
}
