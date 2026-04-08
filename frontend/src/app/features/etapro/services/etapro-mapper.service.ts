import { Injectable } from '@angular/core';
import { Validators } from '@angular/forms';
import { Column } from '../../../models/column.model';
import { RfFormField } from '../../../models/ui/form-field.model';
import { EtaProPointDto } from '../../../models/etapro/etapro-point.model';
import { EtaProReadingDto } from '../../../models/etapro/etapro-reading.model';

@Injectable({ providedIn: 'root' })
export class EtaProMapperService {

  // ── Point table columns ───────────────────────────────────

  toPointTableColumns(): Column[] {
    return [
      {
        id: 'pointId',
        header: 'Point ID',
        accessorKey: 'pointId',
        accessorFn: (item: EtaProPointDto) => item.pointId || '',
        width: 200,
        filterable: true,
        sortable: true,
      },
      {
        id: 'description',
        header: 'Description',
        accessorKey: 'description',
        accessorFn: (item: EtaProPointDto) => item.description || '',
        width: 300,
        filterable: true,
        sortable: true,
      },
      {
        id: 'unit',
        header: 'Unit',
        accessorKey: 'unit',
        accessorFn: (item: EtaProPointDto) => item.unit || '',
        width: 100,
        filterable: true,
        sortable: true,
      },
      {
        id: 'category',
        header: 'Category',
        accessorKey: 'category',
        accessorFn: (item: EtaProPointDto) => item.category || '',
        width: 150,
        filterable: true,
        sortable: true,
      },
      {
        id: 'active',
        header: 'Active',
        accessorKey: 'active',
        accessorFn: (item: EtaProPointDto) => item.active ? 'Yes' : 'No',
        width: 80,
        filterable: true,
        sortable: true,
        conditionalStyling: (item: any) => ({
          'color': item.active ? 'var(--success-color, #4caf50)' : 'var(--error-color, #f44336)',
          'font-weight': '600',
        }),
      },
    ];
  }

  // ── Point form fields ─────────────────────────────────────

  toPointFormFields(point: EtaProPointDto): RfFormField[] {
    return [
      {
        name: 'pointId',
        label: 'Point ID',
        type: 'text',
        validators: [Validators.required],
        initialValue: point.pointId || '',
      },
      {
        name: 'description',
        label: 'Description',
        type: 'text',
        initialValue: point.description || '',
      },
      {
        name: 'unit',
        label: 'Unit',
        type: 'text',
        initialValue: point.unit || '',
      },
      {
        name: 'category',
        label: 'Category',
        type: 'text',
        initialValue: point.category || '',
      },
      {
        name: 'active',
        label: 'Active',
        type: 'checkbox',
        initialValue: point.active ?? true,
      },
    ];
  }

  // ── Reading table columns ─────────────────────────────────

  toReadingTableColumns(): Column[] {
    return [
      {
        id: 'pointId',
        header: 'Point ID',
        accessorKey: 'pointId',
        accessorFn: (item: EtaProReadingDto) => item.pointId || '',
        width: 200,
        filterable: true,
        sortable: true,
      },
      {
        id: 'readingTime',
        header: 'Timestamp',
        accessorKey: 'readingTime',
        accessorFn: (item: EtaProReadingDto) => item.readingTime ? new Date(item.readingTime).toLocaleString() : '',
        width: 200,
        sortable: true,
      },
      {
        id: 'readingValue',
        header: 'Value',
        accessorKey: 'readingValue',
        accessorFn: (item: EtaProReadingDto) => item.readingValue != null ? item.readingValue.toFixed(2) : 'N/A',
        width: 120,
        sortable: true,
      },
      {
        id: 'quality',
        header: 'Quality',
        accessorKey: 'quality',
        accessorFn: (item: EtaProReadingDto) => item.quality || '',
        width: 100,
        filterable: true,
        conditionalStyling: (item: any) => ({
          'color': item.quality === 'Good' ? 'var(--success-color, #4caf50)' : 'var(--error-color, #f44336)',
        }),
      },
    ];
  }
}
