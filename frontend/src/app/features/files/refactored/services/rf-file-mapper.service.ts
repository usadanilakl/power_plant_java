
import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { Validators } from '@angular/forms';
import { FileDto } from '../../../../models/file/file.model';
import { Column } from '../../../../models/column.model';
import { RfFormField } from '../../../../models/ui/form-field.model';
import { Option } from '../../../../models/option.model';
import { CurrentValueService } from '../../../../services/current-value.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root',
})
export class FileMapperService {
  valueService = inject(CurrentValueService);
  destroyRef = inject(DestroyRef);

  fileTypeOptions = signal<Option[]>([]);
  systemOptions = signal<Option[]>([]);
  vendorOptions = signal<Option[]>([]);

  constructor() {
    this.loadAllOptions();
  }

  private loadAllOptions() {
    this.loadOptions('fileType', this.fileTypeOptions);
    this.loadOptions('system', this.systemOptions);
    this.loadOptions('vendor', this.vendorOptions);
  }

  private loadOptions(
    category: string,
    optionsSignal: ReturnType<typeof signal<Option[]>>
  ) {
    this.valueService
      .getOptionsByCategory(category)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((options) => {
        optionsSignal.set(options);
      });
  }

  /**
   * Maps FileDto fields to table columns
   * @param fields - Array of field names to include in columns
   * @returns Array of Column objects configured for File display
   */
  toTableColumns(
    fields: (keyof FileDto)[] = [
      'isVerified',
      'name',
      'fileType',
      'fileNumber',
      'system',
      'vendor',
      'extension',
      'folder',
      'objectType',
      'docNum',
    ]
  ): Column[] {
    const allColumns: { [key in keyof FileDto]?: Column } = {
      id: {
        id: 'id',
        header: 'ID',
        accessorKey: 'id',
        width: 80,
        filterable: true,
        sortable: true,
      },
      isVerified: {
        id: 'isVerified',
        header: 'Verified',
        accessorFn: (item: FileDto) => (item.isVerified ? 'Yes' : 'No'),
        width: 80,
        filterable: true,
        sortable: true,
        conditionalStyling: (item: any, column: Column) =>
          item.isVerified
            ? { 'background-color': 'var(--success-background, #c8e6c9)' }
            : { 'background-color': 'var(--error-background, #ffcdd2)' },
      },
      name: {
        id: 'name',
        header: 'File Name',
        accessorKey: 'name',
        width: 250,
        filterable: true,
        sortable: true,
      },
      fileType: {
        id: 'fileType',
        header: 'File Type',
        accessorKey: 'fileType.name',
        accessorFn: (item: FileDto) => item.fileType?.name || 'N/A',
        width: 150,
        filterable: true,
        sortable: true,
      },
      fileNumber: {
        id: 'fileNumber',
        header: 'File Number',
        accessorFn: (item: FileDto) => this.formatFileNumbers(item.fileNumber),
        width: 200,
        filterable: true,
        sortable: false,
      },
      system: {
        id: 'system',
        header: 'System',
        accessorKey: 'system.name',
        accessorFn: (item: FileDto) => item.system?.name || 'N/A',
        width: 150,
        filterable: true,
        sortable: true,
      },
      relatedSystems: {
        id: 'relatedSystems',
        header: 'Related Systems',
        accessorFn: (item: FileDto) =>
          this.formatRelatedSystems(item.relatedSystems),
        width: 200,
        filterable: true,
        sortable: false,
      },
      vendor: {
        id: 'vendor',
        header: 'Vendor',
        accessorKey: 'vendor.name',
        accessorFn: (item: FileDto) => item.vendor?.name || 'N/A',
        width: 150,
        filterable: true,
        sortable: true,
      },
      extension: {
        id: 'extension',
        header: 'Extension',
        accessorKey: 'extension',
        width: 100,
        filterable: true,
        sortable: true,
      },
      extensions: {
        id: 'extensions',
        header: 'Available Extensions',
        accessorFn: (item: FileDto) =>
          this.formatExtensions(item.extensions),
        width: 180,
        filterable: false,
        sortable: false,
      },
      folder: {
        id: 'folder',
        header: 'Folder',
        accessorKey: 'folder',
        width: 150,
        filterable: true,
        sortable: true,
      },
      fileLink: {
        id: 'fileLink',
        header: 'File Link',
        accessorKey: 'fileLink',
        width: 250,
        filterable: false,
        sortable: false,
      },
      baseLink: {
        id: 'baseLink',
        header: 'Base Link',
        accessorKey: 'baseLink',
        width: 200,
        filterable: false,
        sortable: false,
      },
      objectType: {
        id: 'objectType',
        header: 'Object Type',
        accessorKey: 'objectType',
        width: 130,
        filterable: true,
        sortable: true,
      },
      docNum: {
        id: 'docNum',
        header: 'Document Number',
        accessorKey: 'docNum',
        width: 130,
        filterable: true,
        sortable: true,
      },
      bulkEditStep: {
        id: 'bulkEditStep',
        header: 'Bulk Edit Step',
        accessorKey: 'bulkEditStep',
        width: 130,
        filterable: true,
        sortable: true,
      },
      points: {
        id: 'points',
        header: 'LOTO Points',
        accessorFn: (item: FileDto) => this.formatPoints(item.points),
        width: 150,
        filterable: false,
        sortable: false,
      },
    };

    return fields
      .map((fieldName) => allColumns[fieldName])
      .filter((column): column is Column => column !== undefined);
  }

  /**
   * Maps File to form fields
   * @param file - The FileDto to map
   * @param fields - Array of field names to include (defaults to all fields)
   * @returns Array of FormField objects
   */
  toFormFields(
    file: FileDto,
    fields: (keyof FileDto)[] = [
      'name',
      'fileType',
      'fileNumber',
      'system',
      'relatedSystems',
      'vendor',
      'extension',
      'extensions',
      'folder',
      'fileLink',
      'baseLink',
      'objectType',
      'docNum',
      'bulkEditStep',
    ]
  ): RfFormField[] {
    const allFields: { [key in keyof FileDto]?: RfFormField } = {
      name: {
        name: 'name',
        label: 'File Name',
        type: 'text',
        validators: [Validators.required],
        initialValue: file.name || '',
      },
      fileType: {
        name: 'fileType',
        label: 'File Type',
        type: 'select',
        options: this.fileTypeOptions(),
        validators: [Validators.required],
        initialValue: file.fileType?.id || null,
      },
      fileNumber: {
        name: 'fileNumber',
        label: 'File Number',
        type: 'multi-select',
        validators: [Validators.required],
        initialValue: file.fileNumber || [],
      },
      system: {
        name: 'system',
        label: 'System',
        type: 'select',
        options: this.systemOptions(),
        validators: [Validators.required],
        initialValue: file.system?.id || null,
      },
      relatedSystems: {
        name: 'relatedSystems',
        label: 'Related Systems',
        type: 'multi-select',
        initialValue: file.relatedSystems || [],
      },
      vendor: {
        name: 'vendor',
        label: 'Vendor',
        type: 'select',
        options: this.vendorOptions(),
        initialValue: file.vendor?.id || null,
      },
      extension: {
        name: 'extension',
        label: 'Current Extension',
        type: 'text',
        validators: [Validators.required],
        initialValue: file.extension || '',
      },
      extensions: {
        name: 'extensions',
        label: 'Available Extensions',
        type: 'multi-select',
        initialValue: file.extensions || [],
      },
      folder: {
        name: 'folder',
        label: 'Folder',
        type: 'text',
        validators: [Validators.required],
        initialValue: file.folder || '',
      },
      fileLink: {
        name: 'fileLink',
        label: 'File Link',
        type: 'text',
        validators: [Validators.required],
        initialValue: file.fileLink || '',
      },
      baseLink: {
        name: 'baseLink',
        label: 'Base Link',
        type: 'text',
        initialValue: file.baseLink || '',
      },
      objectType: {
        name: 'objectType',
        label: 'Object Type',
        type: 'text',
        initialValue: file.objectType || '',
      },
      docNum: {
        name: 'docNum',
        label: 'Document Number',
        type: 'text',
        initialValue: file.docNum || '',
      },
      bulkEditStep: {
        name: 'bulkEditStep',
        label: 'Bulk Edit Step',
        type: 'text',
        initialValue: file.bulkEditStep || '',
      },
      points: {
        name: 'points',
        label: 'LOTO Points',
        type: 'multi-select',
        initialValue: file.points?.map((p) => p.id) || [],
      },
    };

    return fields
      .map((fieldName) => allFields[fieldName])
      .filter((field): field is RfFormField => field !== undefined);
  }

  /**
   * Formats file numbers for display
   */
  private formatFileNumbers(fileNumbers: string[] | null | undefined): string {
    if (!Array.isArray(fileNumbers) || fileNumbers.length === 0) {
      return 'None';
    }
    return fileNumbers.join(', ');
  }

  /**
   * Formats related systems for display
   */
  private formatRelatedSystems(
    relatedSystems: string[] | null | undefined
  ): string {
    if (!Array.isArray(relatedSystems) || relatedSystems.length === 0) {
      return 'None';
    }
    return relatedSystems.join(', ');
  }

  /**
   * Formats extensions for display
   */
  private formatExtensions(extensions: string[] | null | undefined): string {
    if (!Array.isArray(extensions) || extensions.length === 0) {
      return 'None';
    }
    return extensions.join(', ');
  }

  /**
   * Formats LOTO points for display
   */
  private formatPoints(points: { name: string }[] | null | undefined): string {
    if (!Array.isArray(points) || points.length === 0) {
      return 'None';
    }
    return points.map((point) => point.name).join(', ');
  }
}
