import { Validators } from '@angular/forms';
import { FormField } from '../inputs/form-field.model';

export interface PwaSdsChemical {
  localUuid: string;
  sharepointId?: string;
  names: string;
  locations: string;
  statusName: string;
  notes: string;
  processedByName: string;
  processedByEmail: string;
  submitterName: string;
  submitterEmail: string;
  submitterPhone: string;
}

export function sdsChemicalFormFields(): FormField[] {
  return [
    {
      name: 'names',
      label: 'Chemical Names / Aliases (one per line)',
      type: 'textarea',
      initialValue: '',
      validators: [Validators.required],
      placeholder: 'Primary name on the first line, aliases below',
    },
    {
      name: 'locations',
      label: 'Storage Locations (one per line)',
      type: 'textarea',
      initialValue: '',
      placeholder: 'Where the chemical is stored',
    },
    {
      name: 'notes',
      label: 'Notes',
      type: 'textarea',
      initialValue: '',
      placeholder: 'Any additional details',
    },
    {
      name: 'attachments',
      label: 'SDS Document (PDF)',
      type: 'file',
      multiple: true,
      accept: 'application/pdf,image/*,.pdf,.doc,.docx',
      initialValue: null,
    },
  ];
}
