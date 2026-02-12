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
        initialValue: `${this.dateOfWork.getFullYear()}-${String(this.dateOfWork.getMonth() + 1).padStart(2, '0')}-${String(this.dateOfWork.getDate()).padStart(2, '0')}`,
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
      { name: 'files', label: 'Attachments', type: 'file', accept: 'image/*,.pdf,.doc,.docx', multiple: true, initialValue: this.attachments.filter(a => a.type !== 'signature'), group: { label: 'Attachments' } },
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
          accessorFn: (item: IWorkRequest) => new Date(item.updatedAt).toLocaleString('en-US', { timeZone: 'America/Chicago', dateStyle: 'short', timeStyle: 'short' })
        },
        { id: 'jhaStatus', header: 'JHA Status', accessorKey: 'jhaStatus'  },
        {
          id: 'attachments',
          header: 'Attachments',
          accessorFn: (item: IWorkRequest) => {
            if (!item.attachments?.length) return '';
            return item.attachments.map(a => a.fileName || a.type).join(', ');
          },
          conditionalStyling: (item: IWorkRequest): { [key: string]: string } => {
            if (item.attachments?.length) {
              return { color: '#1976d2', cursor: 'pointer', textDecoration: 'underline' };
            }
            return {};
          },
          onCellClick: (item: IWorkRequest, event: MouseEvent) => {
            if (!item.attachments?.length) return;
            event.stopPropagation();
            const blobUrls: { url: string; fileName: string; contentType: string }[] = [];
            for (const att of item.attachments) {
              const byteChars = atob(att.base64Content);
              const byteArray = new Uint8Array(byteChars.length);
              for (let i = 0; i < byteChars.length; i++) {
                byteArray[i] = byteChars.charCodeAt(i);
              }
              const blob = new Blob([byteArray], { type: att.contentType });
              blobUrls.push({ url: URL.createObjectURL(blob), fileName: att.fileName, contentType: att.contentType });
            }
            const htmlParts = blobUrls.map(b => {
              if (b.contentType.startsWith('image/')) {
                return `<div style="margin-bottom:1rem"><h3>${b.fileName}</h3><img src="${b.url}" style="max-width:100%;border:1px solid #ccc;border-radius:4px"></div>`;
              } else if (b.contentType === 'application/pdf') {
                return `<div style="margin-bottom:1rem"><h3>${b.fileName}</h3><iframe src="${b.url}" style="width:100%;height:600px;border:1px solid #ccc;border-radius:4px"></iframe></div>`;
              } else {
                return `<div style="margin-bottom:1rem"><h3><a href="${b.url}" download="${b.fileName}">${b.fileName}</a> (click to download)</h3></div>`;
              }
            });
            const html = `<!DOCTYPE html><html><head><title>Attachments</title><style>body{font-family:sans-serif;max-width:900px;margin:2rem auto;padding:0 1rem}h3{margin:0.5rem 0}</style></head><body><h2>Attachments (${blobUrls.length})</h2>${htmlParts.join('')}</body></html>`;
            const pageBlob = new Blob([html], { type: 'text/html' });
            window.open(URL.createObjectURL(pageBlob), '_blank');
          }
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
        case 'sent via email':
          return { backgroundColor: '#2196f3', color: '#fff' };
        default:
          return { backgroundColor: '#f1f1f1', color: '#000' };
      }
    }

  getAttachmentsByType(type: 'photo' | 'signature' | 'document'): IAttachment[] {
    return this.attachments.filter(a => a.type === type);
  }

  getSignatureDataUrl(): string | null {
    const sig = this.attachments.find(a => a.type === 'signature');
    if (!sig?.base64Content) return null;
    return `data:${sig.contentType || 'image/png'};base64,${sig.base64Content}`;
  }

  convertToPaModel(): WorkRequestPa {
    // Extract local date components (avoids UTC date shift from toISOString)
    const d = this.dateOfWork instanceof Date ? this.dateOfWork : new Date(this.dateOfWork);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    // Combine as naive local datetime (Central Time) — no UTC conversion
    const combinedDateTime = `${dateStr}T${this.timeOfWork || '00:00'}:00`;

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
