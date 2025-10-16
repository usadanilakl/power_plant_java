import { Validators } from "@angular/forms";
import { FormField } from "../inputs/form-field.model";
import { BaseModel, IBaseModel } from "./base.model";
import { futureOrPresentDateValidator } from "../../shared/forms/validators/date.validators";
import { WorkRequestPa } from "./work-request-pa.model";
import { Column } from "../inputs/column.model";

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
      { name: 'company', label: 'Company', type: 'text', initialValue: this.company, validators: [Validators.required] },
      {
        name: 'dateOfWork',
        label: 'Date of Work',
        type: 'date',
        initialValue: this.dateOfWork.toISOString().split('T')[0],
        validators: [Validators.required, futureOrPresentDateValidator()]
      },
      { name: 'timeOfWork', label: 'Time of Work', type: 'time', initialValue: this.timeOfWork, validators: [Validators.required] },
      { name: 'locationOfWork', label: 'Location of Work', type: 'text', initialValue: this.locationOfWork, validators: [Validators.required] },
      { name: 'workRequestedBy', label: 'Work Requested By', type: 'text', initialValue: this.workRequestedBy, validators: [Validators.required] },
      { name: 'affectedEquipment', label: 'Affected Equipment', type: 'text', initialValue: this.affectedEquipment, validators: [Validators.required] },
      { name: 'workScope', label: 'Work Scope', type: 'textarea', initialValue: this.workScope, validators: [Validators.required] },
      { name: 'isLOTORequired', label: 'LOTO Required?', type: 'radio-group', initialValue: this.isLOTORequired, options: [{label: 'Yes', value: 'Yes'}, {label: 'No', value: 'No'}], validators: [Validators.required] },
      { name: 'isHotWorkRequired', label: 'Hot Work Required?', type: 'radio-group', initialValue: this.isHotWorkRequired, options: [{label: 'Yes', value: 'Yes'}, {label: 'No', value: 'No'}], validators: [Validators.required] },
      {
        name: 'foremanName',
        label: 'Foreman Name',
        type: 'text',
        initialValue: this.foremanName,
        showWhen: { field: 'isHotWorkRequired', value: 'Yes' }, 
        validators: [Validators.required]
      },
      {
        name: 'fireWatchName',
        label: 'Fire Watch Name',
        type: 'text',
        initialValue: this.fireWatchName,
        showWhen: { field: 'isHotWorkRequired', value: 'Yes' }, 
        validators: [Validators.required]
      },
      { 
        name: 'isConfinedSpaceEntryRequired', 
        label: 'Confined Space Entry Required?', 
        type: 'radio-group', 
        initialValue: this.isConfinedSpaceEntryRequired, 
        options: [{label: 'Yes', value: 'Yes'}, {label: 'No', value: 'No'}], 
        validators: [Validators.required] 
      },
      {
        name: 'spaceToBeEntered',
        label: 'Space to be Entered',
        type: 'text',
        initialValue: this.spaceToBeEntered,
        showWhen: { field: 'isConfinedSpaceEntryRequired', value: 'Yes' }, 
        validators: [Validators.required]
      },
    ];
  }



    getTableColumns(): Column[] {
      return [
        { id: 'workScope', header: 'Work Scope', accessorKey: 'workScope' },
        { id: 'company', header: 'Company', accessorKey: 'company' },
        { id: 'workRequestedBy', header: 'Requested By', accessorKey: 'workRequestedBy' },
        { id: 'locationOfWork', header: 'Location', accessorKey: 'locationOfWork' },
        { id: 'affectedEquipment', header: 'Affected Equipment', accessorKey: 'affectedEquipment' },
        {
          id: 'status',
          header: 'Status',
          accessorKey: 'status',
          conditionalStyling: (item: IWorkRequest) => this.getStyleByStatus(item.status)
        },
        {
          id: 'dateOfWork',
          header: 'Date of Work',
          accessorFn: (item: IWorkRequest) => new Date(item.dateOfWork).toLocaleDateString()
        },
        { id: 'timeOfWork', header: 'Time of Work', accessorKey: 'timeOfWork' },
        { id: 'isLOTORequired', header: 'LOTO?', accessorKey: 'isLOTORequired' },
        { id: 'isHotWorkRequired', header: 'Hot Work?', accessorKey: 'isHotWorkRequired' },
        { id: 'foremanName', header: 'Foreman', accessorKey: 'foremanName' },
        { id: 'fireWatchName', header: 'Fire Watch', accessorKey: 'fireWatchName' },
        { id: 'isConfinedSpaceEntryRequired', header: 'Confined Space?', accessorKey: 'isConfinedSpaceEntryRequired' },
        { id: 'spaceToBeEntered', header: 'Space Entered', accessorKey: 'spaceToBeEntered' },
        {
          id: 'updatedAt',
          header: 'Last Updated',
          accessorFn: (item: IWorkRequest) => new Date(item.updatedAt).toLocaleDateString()
        },
      ];
    }

    getStyleByStatus(status: string): { backgroundColor: string; color: string } {
      switch (status) {
        case 'new':
          return { backgroundColor: '#f1f1f1', color: '#000' };
        case 'pending':
          return { backgroundColor: '#ffeb3b', color: '#000' };
        case 'received':
          return { backgroundColor: '#4caf50', color: '#fff' };
        case 'revoked':
          return { backgroundColor: '#f44336', color: '#fff' };
        default:
          return { backgroundColor: '#f1f1f1', color: '#000' };
      }
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
