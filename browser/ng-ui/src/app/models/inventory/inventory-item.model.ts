import { Validators } from '@angular/forms';
import { FormField } from '../inputs/form-field.model';
import { Option } from '../inputs/option.model';

export interface PwaInventoryItem {
  localUuid: string;
  sharepointId?: string;
  qrToken?: string;
  itemTypeName: string;
  statusName: string;
  title: string;
  description: string;
  serialNumber: string;
  manufacturer: string;
  model: string;
  locationName: string;
  currentLocation: string;
  submitterName: string;
  submitterEmail: string;
  submitterPhone: string;
}

export function inventoryFormFields(
  typeOptions: Option[],
  initialType: string = '',
  presetType: boolean = false
): FormField[] {
  return [
    presetType
      ? {
          name: 'itemTypeName',
          label: 'Type',
          type: 'text' as const,
          initialValue: initialType,
          readonly: true,
          validators: [Validators.required],
        }
      : {
          name: 'itemTypeName',
          label: 'Type',
          type: 'select' as const,
          options: typeOptions,
          initialValue: initialType,
          validators: [Validators.required],
        },
    {
      name: 'title',
      label: 'Name',
      type: 'text',
      initialValue: '',
      validators: [Validators.required],
      placeholder: 'e.g. Fluke Multimeter, Torque Wrench',
    },
    {
      name: 'serialNumber',
      label: 'Serial Number',
      type: 'text',
      initialValue: '',
      placeholder: 'Manufacturer serial number',
    },
    {
      name: 'manufacturer',
      label: 'Manufacturer',
      type: 'text',
      initialValue: '',
    },
    {
      name: 'model',
      label: 'Model',
      type: 'text',
      initialValue: '',
    },
    {
      name: 'locationName',
      label: 'Home Location',
      type: 'text',
      initialValue: '',
      placeholder: 'Where this item normally lives',
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      initialValue: '',
      placeholder: 'Notes, condition, accessories...',
    },
    {
      name: 'attachments',
      label: 'Photos',
      type: 'file',
      multiple: true,
      accept: 'image/*,.pdf,.doc,.docx',
      initialValue: null,
    },
  ];
}

export function inventoryUsageFormFields(): FormField[] {
  return [
    {
      name: 'eventType',
      label: 'Action',
      type: 'select',
      options: [
        { value: 'checkout', label: 'Check Out' },
        { value: 'checkin', label: 'Check In' },
      ],
      initialValue: 'checkout',
      validators: [Validators.required],
    },
    {
      name: 'location',
      label: 'Where are you taking it?',
      type: 'text',
      initialValue: '',
      validators: [Validators.required],
      placeholder: 'Unit 1 boiler, shop, truck, etc.',
    },
    {
      name: 'purpose',
      label: 'Purpose',
      type: 'text',
      initialValue: '',
      placeholder: 'What are you using it for?',
    },
    {
      name: 'comments',
      label: 'Comments',
      type: 'textarea',
      initialValue: '',
      placeholder: 'Optional additional notes',
    },
  ];
}
