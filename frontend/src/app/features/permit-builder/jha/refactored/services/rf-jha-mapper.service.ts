import { Injectable } from '@angular/core';
import { Validators } from '@angular/forms';
import { JhaDto, JhaFieldName } from '../../../../../models/permits/jha.model';
import { Column } from '../../../../../models/column.model';
import { RfFormField } from '../../../../../models/ui/form-field.model';

@Injectable({
  providedIn: 'root',
})
export class RfJhaMapperService {

  toTableColumns(
    fields: JhaFieldName[] = [
      'status', 'jobName', 'date', 'analysisBy', 'approvedBy',
      'submitterName', 'sharepointId', 'attachmentCount'
    ]
  ): Column[] {
    const allColumns: { [key in JhaFieldName]?: Column } = {
      id: { id: 'id', header: 'ID', accessorKey: 'id', filterable: true, sortable: true, width: 80 },
      status: {
        id: 'status', header: 'Status', accessorKey: 'permitStatus.name', formFieldKey: 'status',
        filterable: true, sortable: true, width: 100,
        accessorFn: (item: JhaDto) => item.status || 'N/A',
        conditionalStyling: (item: any) => {
          if (item.status === 'Active') return { 'background-color': 'var(--status-complete)', 'color': 'var(--primary-text)' };
          if (item.status === 'Closed') return { 'background-color': 'var(--status-not-processed)', 'color': 'var(--primary-text)' };
          if (item.status === 'Archived') return { 'background-color': 'var(--status-incomplete)', 'color': 'var(--primary-text)' };
          return { 'background-color': '', 'color': '' };
        }
      },
      jobName: { id: 'jobName', header: 'Job Name', accessorKey: 'jobName', filterable: true, sortable: true, width: 200 },
      applicability: { id: 'applicability', header: 'Applicability', accessorKey: 'applicability', filterable: true, sortable: true, width: 130 },
      analysisBy: { id: 'analysisBy', header: 'Analysis By', accessorKey: 'analysisBy', filterable: true, sortable: true, width: 130 },
      reviewedBy: { id: 'reviewedBy', header: 'Reviewed By', accessorKey: 'reviewedBy', filterable: true, sortable: true, width: 130 },
      approvedBy: { id: 'approvedBy', header: 'Approved By', accessorKey: 'approvedBy', filterable: true, sortable: true, width: 130 },
      date: { id: 'date', header: 'Date', accessorKey: 'date', filterable: true, sortable: true, width: 120 },
      ppe: { id: 'ppe', header: 'PPE', accessorKey: 'ppe', filterable: true, sortable: true, width: 120 },
      loto: { id: 'loto', header: 'LOTO', accessorKey: 'loto', filterable: true, sortable: true, width: 120 },
      confinedSpace: { id: 'confinedSpace', header: 'Confined Space', accessorKey: 'confinedSpace', filterable: true, sortable: true, width: 130 },
      hazCom: { id: 'hazCom', header: 'HazCom', accessorKey: 'hazCom', filterable: true, sortable: true, width: 120 },
      handAndPowerTools: { id: 'handAndPowerTools', header: 'Hand & Power Tools', accessorKey: 'handAndPowerTools', filterable: true, sortable: true, width: 150 },
      specialTools: { id: 'specialTools', header: 'Special Tools', accessorKey: 'specialTools', filterable: true, sortable: true, width: 130 },
      sharepointId: { id: 'sharepointId', header: 'SharePoint ID', accessorKey: 'sharepointId', filterable: true, sortable: true, width: 130 },
      workRequestId: { id: 'workRequestId', header: 'WR ID', accessorKey: 'workRequestId', filterable: true, sortable: true, width: 80 },
      attachmentCount: {
        id: 'attachmentCount', header: 'Attachments', accessorKey: 'attachmentCount', filterable: false, sortable: true, width: 110,
        accessorFn: (item: JhaDto) => item.attachmentCount ? `${item.attachmentCount}` : '0',
        conditionalStyling: (item: any) =>
          item.attachmentCount > 0 ? { 'color': 'var(--accent-color, #4a90d9)', 'cursor': 'pointer', 'text-decoration': 'underline' } : { 'color': '', 'cursor': '', 'text-decoration': '' }
      },
      submitterName: { id: 'submitterName', header: 'Submitter', accessorKey: 'submitterName', filterable: true, sortable: true, width: 140 },
      submitterEmail: { id: 'submitterEmail', header: 'Submitter Email', accessorKey: 'submitterEmail', filterable: true, sortable: true, width: 180 },
      submitterPhone: { id: 'submitterPhone', header: 'Submitter Phone', accessorKey: 'submitterPhone', filterable: true, sortable: true, width: 140 },
      submitterCompany: { id: 'submitterCompany', header: 'Submitter Company', accessorKey: 'submitterCompany', filterable: true, sortable: true, width: 150 },
      timeSubmitted: { id: 'timeSubmitted', header: 'Time Submitted', accessorKey: 'timeSubmitted', filterable: true, sortable: true, width: 150 },
      name: { id: 'name', header: 'Name', accessorKey: 'name', filterable: true, sortable: true, width: 140 },
      objectType: { id: 'objectType', header: 'Object Type', accessorKey: 'objectType', filterable: true, sortable: true, width: 120 },
      isVerified: {
        id: 'isVerified', header: 'Verified', accessorKey: 'isVerified', filterable: true, sortable: true, width: 90,
        accessorFn: (item: JhaDto) => item.isVerified ? 'Yes' : 'No',
      },
      jobSteps: { id: 'jobSteps', header: 'Job Steps', accessorKey: 'jobSteps', filterable: false, sortable: false, width: 100 },
      localUuid: { id: 'localUuid', header: 'Local UUID', accessorKey: 'localUuid', filterable: true, sortable: true, width: 150 },
      workRequestSharepointId: { id: 'workRequestSharepointId', header: 'WR SP ID', accessorKey: 'workRequestSharepointId', filterable: true, sortable: true, width: 120 },
    };

    return fields
      .map(fieldName => allColumns[fieldName])
      .filter((col): col is Column => col !== undefined);
  }

  toFormFields(
    entity: JhaDto,
    fields: JhaFieldName[] = [
      'jobName', 'applicability', 'analysisBy', 'reviewedBy', 'approvedBy',
      'date', 'ppe', 'loto', 'confinedSpace', 'hazCom',
      'handAndPowerTools', 'specialTools', 'status'
    ]
  ): RfFormField[] {
    const allFields: { [key in JhaFieldName]?: RfFormField } = {
      id: { name: 'id', label: 'ID', type: 'text', initialValue: entity.id },
      jobName: { name: 'jobName', label: 'Job Name/Title', type: 'text', validators: [Validators.required], initialValue: entity.jobName },
      applicability: { name: 'applicability', label: 'Applicability', type: 'text', initialValue: entity.applicability },
      analysisBy: { name: 'analysisBy', label: 'Analysis By', type: 'text', initialValue: entity.analysisBy },
      reviewedBy: { name: 'reviewedBy', label: 'Reviewed By', type: 'text', initialValue: entity.reviewedBy },
      approvedBy: { name: 'approvedBy', label: 'Approved By', type: 'text', initialValue: entity.approvedBy },
      date: { name: 'date', label: 'Date', type: 'date', initialValue: entity.date ?? new Date().toISOString().split('T')[0] },
      ppe: { name: 'ppe', label: 'Personal Protective Equipment (PPE)', type: 'textarea', initialValue: entity.ppe },
      loto: { name: 'loto', label: 'LOTO', type: 'textarea', initialValue: entity.loto },
      confinedSpace: { name: 'confinedSpace', label: 'Confined Space', type: 'textarea', initialValue: entity.confinedSpace },
      hazCom: { name: 'hazCom', label: 'HazCom', type: 'textarea', initialValue: entity.hazCom },
      handAndPowerTools: { name: 'handAndPowerTools', label: 'Hand and Power Tools', type: 'textarea', initialValue: entity.handAndPowerTools },
      specialTools: { name: 'specialTools', label: 'Special Tools', type: 'textarea', initialValue: entity.specialTools },
      sharepointId: { name: 'sharepointId', label: 'SharePoint ID', type: 'text', readonly: true, initialValue: entity.sharepointId },
      status: {
        name: 'status', label: 'Status', type: 'select',
        options: [
          { value: 'Active', label: 'Active' },
          { value: 'Closed', label: 'Closed' },
          { value: 'Archived', label: 'Archived' },
        ],
        initialValue: entity.status ?? 'Active',
      },
      name: { name: 'name', label: 'Name', type: 'text', initialValue: entity.name },
      objectType: { name: 'objectType', label: 'Object Type', type: 'text', initialValue: entity.objectType },
      isVerified: {
        name: 'isVerified', label: 'Verified', type: 'select',
        options: [{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }],
        initialValue: entity.isVerified?.toString(),
      },
    };

    return fields
      .map((fieldName) => allFields[fieldName])
      .filter((field): field is RfFormField => field !== undefined);
  }
}
