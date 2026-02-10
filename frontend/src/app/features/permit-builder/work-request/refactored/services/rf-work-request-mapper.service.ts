import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { Validators } from '@angular/forms';
import { WorkRequestDto, WorkRequestFieldName } from '../../../../../models/permits/work-request.model';
import { Column } from '../../../../../models/column.model';
import { RfFormField } from '../../../../../models/ui/form-field.model';
import { Option } from '../../../../../models/option.model';
import { CurrentValueService } from '../../../../../services/current-value.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root',
})
export class RfWorkRequestMapperService {
  private valueService = inject(CurrentValueService);
  private destroyRef = inject(DestroyRef);

  locationOptions = signal<Option[]>([]);

  constructor() {
    this.loadAllOptions();
  }

  private loadAllOptions(): void {
    this.valueService
      .getOptionsByCategory('location')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((options) => {
        this.locationOptions.set(options);
      });
  }

  toTableColumns(
    fields: WorkRequestFieldName[] = [
      'status', 'dateOfWorkToBePerformed', 'requestedBy', 'company',
      'location', 'isHotWorkRequired', 'isLotoRequired', 'isConfinedSpaceEntryRequired'
    ]
  ): Column[] {
    const allColumns: { [key in WorkRequestFieldName]?: Column } = {
      id: { id: 'id', header: 'ID', accessorKey: 'id', filterable: true, sortable: true, width: 80 },
      status: {
        id: 'status', header: 'Status', accessorKey: 'permitStatus.name', formFieldKey: 'status',
        filterable: true, sortable: true, width: 100,
        accessorFn: (item: WorkRequestDto) => item.status || 'N/A',
        conditionalStyling: (item: any) => {
          if (item.status === 'Active') return { 'background-color': 'var(--status-complete)', 'color': 'var(--primary-text)' };
          if (item.status === 'Closed') return { 'background-color': 'var(--status-not-processed)', 'color': 'var(--primary-text)' };
          if (item.status === 'Archived') return { 'background-color': 'var(--status-incomplete)', 'color': 'var(--primary-text)' };
          return { 'background-color': '', 'color': '' };
        }
      },
      dateOfWorkToBePerformed: { id: 'dateOfWorkToBePerformed', header: 'Date of Work', accessorKey: 'dateOfWorkToBePerformed', filterable: true, sortable: true, width: 130 },
      timeOfWorkToBePerformed: { id: 'timeOfWorkToBePerformed', header: 'Time of Work', accessorKey: 'timeOfWorkToBePerformed', filterable: true, sortable: true, width: 110 },
      requestedBy: { id: 'requestedBy', header: 'Requested By', accessorKey: 'requestedBy', filterable: true, sortable: true, width: 140 },
      company: { id: 'company', header: 'Company', accessorKey: 'company', filterable: true, sortable: true, width: 140 },
      location: { id: 'location', header: 'Location', accessorKey: 'location', filterable: true, sortable: true, width: 140 },
      affectedEquipment: { id: 'affectedEquipment', header: 'Affected Equipment', accessorKey: 'affectedEquipment', filterable: true, sortable: true, width: 160 },
      workScope: { id: 'workScope', header: 'Work Scope', accessorKey: 'workScope', filterable: true, sortable: true, width: 200 },
      isHotWorkRequired: {
        id: 'isHotWorkRequired', header: 'Hot Work', accessorKey: 'isHotWorkRequired', filterable: true, sortable: true, width: 100,
        accessorFn: (item: WorkRequestDto) => item.isHotWorkRequired ? 'Yes' : 'No',
        conditionalStyling: (item: any) =>
          item.isHotWorkRequired ? { 'background-color': 'var(--status-attention)', 'color': 'var(--primary-text)' } : { 'background-color': '', 'color': '' }
      },
      foreman: { id: 'foreman', header: 'Foreman', accessorKey: 'foreman', filterable: true, sortable: true, width: 130 },
      fireWatch: { id: 'fireWatch', header: 'Fire Watch', accessorKey: 'fireWatch', filterable: true, sortable: true, width: 120 },
      isLotoRequired: {
        id: 'isLotoRequired', header: 'LOTO', accessorKey: 'isLotoRequired', filterable: true, sortable: true, width: 80,
        accessorFn: (item: WorkRequestDto) => item.isLotoRequired ? 'Yes' : 'No',
        conditionalStyling: (item: any) =>
          item.isLotoRequired ? { 'background-color': 'var(--status-attention)', 'color': 'var(--primary-text)' } : { 'background-color': '', 'color': '' }
      },
      isConfinedSpaceEntryRequired: {
        id: 'isConfinedSpaceEntryRequired', header: 'Confined Space', accessorKey: 'isConfinedSpaceEntryRequired', filterable: true, sortable: true, width: 120,
        accessorFn: (item: WorkRequestDto) => item.isConfinedSpaceEntryRequired ? 'Yes' : 'No',
        conditionalStyling: (item: any) =>
          item.isConfinedSpaceEntryRequired ? { 'background-color': 'var(--status-attention)', 'color': 'var(--primary-text)' } : { 'background-color': '', 'color': '' }
      },
      space: { id: 'space', header: 'Space', accessorKey: 'space', filterable: true, sortable: true, width: 120 },
      sharepointId: {
        id: 'sharepointId', header: 'SharePoint ID', accessorKey: 'sharepointId', filterable: true, sortable: true, width: 180,
        accessorFn: (item: WorkRequestDto) => {
          if (!item.sharepointId) return '';
          const ts = item.sharepointId;
          if (ts.length < 14) return ts;
          return `${ts.slice(0, 4)}-${ts.slice(4, 6)}-${ts.slice(6, 8)} ${ts.slice(8, 10)}:${ts.slice(10, 12)}:${ts.slice(12, 14)}`;
        }
      },
      isVerified: {
        id: 'isVerified', header: 'Verified', accessorKey: 'isVerified', filterable: true, sortable: true, width: 90,
        accessorFn: (item: WorkRequestDto) => item.isVerified ? 'Yes' : 'No',
        conditionalStyling: (item: any) =>
          item.isVerified ? { 'background-color': 'var(--status-complete)', 'color': 'var(--primary-text)' } : { 'background-color': 'var(--status-attention)', 'color': 'var(--primary-text)' }
      },
      name: { id: 'name', header: 'Name', accessorKey: 'name', filterable: true, sortable: true, width: 140 },
      objectType: { id: 'objectType', header: 'Object Type', accessorKey: 'objectType', filterable: true, sortable: true, width: 120 },
    };

    return fields
      .map(fieldName => allColumns[fieldName])
      .filter((col): col is Column => col !== undefined);
  }

  toFormFields(
    entity: WorkRequestDto,
    fields: WorkRequestFieldName[] = [
      'dateOfWorkToBePerformed', 'timeOfWorkToBePerformed', 'requestedBy',
      'company', 'location', 'affectedEquipment', 'workScope', 'isHotWorkRequired',
      'foreman', 'fireWatch', 'isLotoRequired', 'isConfinedSpaceEntryRequired', 'space', 'status'
    ]
  ): RfFormField[] {
    const allFields: { [key in WorkRequestFieldName]?: RfFormField } = {
      id: { name: 'id', label: 'ID', type: 'text', initialValue: entity.id },
      dateOfWorkToBePerformed: {
        name: 'dateOfWorkToBePerformed',
        label: 'Date of Work',
        type: 'date',
        validators: [Validators.required],
        initialValue: entity.dateOfWorkToBePerformed ?? new Date().toISOString().split('T')[0],
      },
      timeOfWorkToBePerformed: {
        name: 'timeOfWorkToBePerformed',
        label: 'Time of Work',
        type: 'time',
        validators: [Validators.required],
        initialValue: entity.timeOfWorkToBePerformed ?? new Date().toTimeString().slice(0, 5),
      },
      requestedBy: {
        name: 'requestedBy',
        label: 'Requested By',
        type: 'text',
        validators: [Validators.required],
        initialValue: entity.requestedBy,
      },
      company: {
        name: 'company',
        label: 'Company',
        type: 'text',
        validators: [Validators.required],
        initialValue: entity.company,
      },
      location: {
        name: 'location',
        label: 'Location',
        type: 'text',
        options: this.locationOptions,
        validators: [Validators.required],
        initialValue: entity.location,
      },
      affectedEquipment: {
        name: 'affectedEquipment',
        label: 'Affected Equipment',
        type: 'text',
        validators: [Validators.required],
        initialValue: entity.affectedEquipment,
      },
      workScope: {
        name: 'workScope',
        label: 'Work Scope',
        type: 'textarea',
        validators: [Validators.required],
        initialValue: entity.workScope,
      },
      isHotWorkRequired: {
        name: 'isHotWorkRequired',
        label: 'Hot Work Required',
        type: 'checkbox',
        initialValue: entity.isHotWorkRequired ?? false,
      },
      foreman: {
        name: 'foreman',
        label: 'Foreman Name',
        type: 'text',
        initialValue: entity.foreman,
      },
      fireWatch: {
        name: 'fireWatch',
        label: 'Fire-watch Name',
        type: 'text',
        initialValue: entity.fireWatch,
      },
      isLotoRequired: {
        name: 'isLotoRequired',
        label: 'LOTO Required',
        type: 'checkbox',
        initialValue: entity.isLotoRequired ?? false,
      },
      isConfinedSpaceEntryRequired: {
        name: 'isConfinedSpaceEntryRequired',
        label: 'Confined Space Entry Required',
        type: 'checkbox',
        initialValue: entity.isConfinedSpaceEntryRequired ?? false,
      },
      space: {
        name: 'space',
        label: 'Space to be entered',
        type: 'text',
        initialValue: entity.space,
      },
      sharepointId: {
        name: 'sharepointId',
        label: 'SharePoint ID',
        type: 'text',
        readonly: true,
        initialValue: entity.sharepointId,
      },
      status: {
        name: 'status',
        label: 'Status',
        type: 'select',
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
        name: 'isVerified',
        label: 'Verified',
        type: 'select',
        options: [
          { value: 'true', label: 'Yes' },
          { value: 'false', label: 'No' },
        ],
        initialValue: entity.isVerified?.toString(),
      },
    };

    return fields
      .map((fieldName) => allFields[fieldName])
      .filter((field): field is RfFormField => field !== undefined);
  }
}
