import { Validators } from "@angular/forms";
import { FormField } from "../inputs/form-field.model";
import { BaseModel, IBaseModel } from "./base.model";
import { futureOrPresentDateValidator } from "../../shared/forms/validators/date.validators";
import { WorkRequestPa } from "./work-request-pa.model";
import { Column } from "../inputs/column.model";
import { IAttachment } from "./attachment.model";

export interface IWorkRequest extends IBaseModel {
  id: number;
  sharepointId: string;
  localUuid: string;
  submissionStatus: 'draft' | 'pending' | 'submitted' | 'failed' | 'sent via email';
  submissionMethod?: 'server' | 'powerAutomate' | 'email';
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
  jhaStatus?: string;
  attachments: IAttachment[];
}

export class WorkRequest extends BaseModel<IWorkRequest> implements IWorkRequest {
  sharepointId: string;
  localUuid: string;
  submissionStatus: 'draft' | 'pending' | 'submitted' | 'failed' | 'sent via email';
  submissionMethod?: 'server' | 'powerAutomate' | 'email';
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
  jhaStatus?: string;
  attachments: IAttachment[];

  constructor(data: Partial<IWorkRequest> = {}) {
    super(data);
    this.sharepointId = data.sharepointId ?? '';
    this.localUuid = data.localUuid ?? crypto.randomUUID();
    this.submissionStatus = data.submissionStatus ?? 'draft';
    this.submissionMethod = data.submissionMethod;
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
    this.jhaStatus = data.jhaStatus;
    this.attachments = data.attachments ?? [];
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
      { name: 'photos', label: 'Photos', type: 'file', accept: 'image/*', multiple: true, initialValue: this.getAttachmentsByType('photo'), group: { label: 'Attachments' } },
      { name: 'signature', label: 'Signature', type: 'signature', initialValue: null, group: { label: 'Attachments' } },
      { name: 'documents', label: 'Documents', type: 'file', accept: '.pdf,.doc,.docx', multiple: true, initialValue: this.getAttachmentsByType('document'), group: { label: 'Attachments' } },
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
        { id: 'jhaStatus', header: 'JHA Status', accessorKey: 'jhaStatus'  },
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
        case 'sent via email':
          return { backgroundColor: '#2196f3', color: '#fff' };
        default:
          return { backgroundColor: '#f1f1f1', color: '#000' };
      }
    }

  getAttachmentsByType(type: 'photo' | 'signature' | 'document'): IAttachment[] {
    return this.attachments.filter(a => a.type === type);
  }

  convertToPaModel(): WorkRequestPa {
    // Extract local date components (avoids UTC date shift from toISOString)
    const d = this.dateOfWork instanceof Date ? this.dateOfWork : new Date(this.dateOfWork);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    // Create local Date from date + time, convert to UTC ISO for SharePoint
    const localDate = new Date(`${dateStr}T${this.timeOfWork || '00:00'}:00`);
    const combinedDateTime = localDate.toISOString();

    return new WorkRequestPa({
      PwaId: this.localUuid,
      Company: this.company,
      DateOfWork: combinedDateTime,
      LocationOfWork: this.locationOfWork,
      WorkRequestedBy: this.workRequestedBy,
      AffectedEquipment: this.affectedEquipment,
      WorkScope: this.workScope,
      IsLOTORequired: this.isLOTORequired === 'Yes',
      IsHotWorkRequired: this.isHotWorkRequired === 'Yes',
      IsConfinedSpaceEntryRequired: this.isConfinedSpaceEntryRequired === 'Yes',
      ForemanName: this.foremanName,
      FireWatchName: this.fireWatchName,
      SpaceToBeEntered: this.spaceToBeEntered
    });
  }

  getEmailBody(): string {
    const d = this.dateOfWork instanceof Date ? this.dateOfWork : new Date(this.dateOfWork);
    const dateStr = d.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
    const timeStr = this.timeOfWork || 'Not specified';

    const lines: [string, string][] = [
      ['Company', this.company],
      ['Date of Work', dateStr],
      ['Time of Work', timeStr],
      ['Location of Work', this.locationOfWork],
      ['Work Requested By', this.workRequestedBy],
      ['Affected Equipment', this.affectedEquipment],
      ['Work Scope', this.workScope],
      ['LOTO Required', this.isLOTORequired],
      ['Hot Work Required', this.isHotWorkRequired],
      ['Foreman Name', this.foremanName],
      ['Fire Watch Name', this.fireWatchName],
      ['Confined Space Entry Required', this.isConfinedSpaceEntryRequired],
      ['Space to be Entered', this.spaceToBeEntered],
    ];

    let body = '--- Work Request ---\n\n';
    for (const [label, value] of lines) {
      if (value) {
        body += `${label}: ${value}\n`;
      }
    }

    if (this.attachments.length > 0) {
      body += `\nAttachments: ${this.attachments.length} file(s) - please download and attach separately.\n`;
    }

    return body;
  }
}
