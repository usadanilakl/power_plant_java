import { Validators } from '@angular/forms';
import { FormField } from '../inputs/form-field.model';
import { Option } from '../inputs/option.model';

export interface PwaFieldListItem {
  localUuid: string;
  sharepointId?: string;
  listTypeName: string;
  statusName: string;
  title: string;
  notes: string;
  dateObserved: string;
  timeObserved: string;
  locationName: string;
  specificLocation: string;
  equipmentTag: string;
  submitterName: string;
  submitterEmail: string;
  submitterPhone: string;
}

export function fieldListFormFields(
  listTypeOptions: Option[],
  initialListType: string = '',
  presetListType: boolean = false
): FormField[] {
  return [
    {
      name: 'workAreaMap',
      label: 'Work Area',
      type: 'work-area-map',
      initialValue: null,
    },
    presetListType
      ? {
          name: 'listTypeName',
          label: 'List Type',
          type: 'text' as const,
          initialValue: initialListType,
          readonly: true,
          validators: [Validators.required],
        }
      : {
          name: 'listTypeName',
          label: 'List Type',
          type: 'select' as const,
          options: listTypeOptions,
          initialValue: initialListType,
          validators: [Validators.required],
        },
    {
      name: 'title',
      label: 'Title',
      type: 'text',
      initialValue: '',
      validators: [Validators.required],
      placeholder: 'Brief description of the observation',
    },
    {
      name: 'equipmentTag',
      label: 'Equipment / Loto Point',
      type: 'equipment-picker',
      initialValue: null,
    },
    {
      name: 'locationDetail',
      label: 'Specific Location',
      type: 'text',
      initialValue: '',
      placeholder: 'Floor, column, etc.',
    },
    {
      // Maximo plant-tree picker — emits {assetnum, location}. Optional; when set, sent to
      // Maximo as spi:location + spi:assetnum on WO/SR create. Ops assigns on triage if left blank.
      name: 'maximoPicker',
      label: 'Maximo Location / Asset (optional)',
      type: 'maximo-tree-picker',
      initialValue: null,
    },
    {
      name: 'dateObserved',
      label: 'Date Observed',
      type: 'date',
      initialValue: new Date().toISOString().split('T')[0],
    },
    {
      name: 'timeObserved',
      label: 'Time Observed',
      type: 'time',
      initialValue: '',
    },
    {
      name: 'notes',
      label: 'Notes',
      type: 'textarea',
      initialValue: '',
      placeholder: 'Detailed notes about the observation',
    },
    {
      name: 'attachments',
      label: 'Attachments',
      type: 'file',
      multiple: true,
      accept: 'image/*,.pdf,.doc,.docx',
      initialValue: null,
    },
  ];
}
