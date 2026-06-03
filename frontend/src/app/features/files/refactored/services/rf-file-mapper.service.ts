import { Injectable, inject } from '@angular/core';
import { Validators } from '@angular/forms';
import { FileDto } from '../../../../models/file/file.model';
import { Column } from '../../../../models/column.model';
import { RfFormField } from '../../../../models/ui/form-field.model';
import { RfValueService } from '../../../values/refactored/services/rf-value.service';

@Injectable({
  providedIn: 'root',
})
export class FileMapperService {
  private valueService = inject(RfValueService);
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
        accessorKey: 'isVerified',
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
        accessorKey: 'fileNumber',
        accessorFn: (item: FileDto) => this.formatFileNumbers(item.fileNumber),
        width: 200,
        filterable: true,
        sortable: true,
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
        accessorKey: 'relatedSystems',
        accessorFn: (item: FileDto) =>
          this.formatRelatedSystems(item.relatedSystems),
        width: 200,
        filterable: true,
        sortable: true,
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
        accessorFn: (item: FileDto) => this.formatExtensions(item.extensions),
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
    fields: (keyof FileDto | 'file' | 'overrideFile' | 'systems')[] = [
      'name',
      'fileType',
      'fileNumber',
      'vendor',
      'systems',
      'file',
      'overrideFile',
      'isVerified',
    ]
  ): RfFormField[] {
    const allFields: { [key: string]: RfFormField } = {
      name: {
        name: 'name',
        label: 'File Name',
        type: 'text',
        validators: [Validators.required],
        initialValue: file.name || '',
        tooltip: 'Use the toggle above to automatically set this field to the uploaded file\'s name (without extension)',
      },
      fileType: {
        name: 'fileType',
        label: 'File Type',
        type: 'value-select',
        categoryAlias: 'fileType',
        canManageValues: true,
        validators: [Validators.required],
        initialValue: file.fileType?.id || null,
      },
      fileNumber: {
        name: 'fileNumber',
        label: 'File Number',
        type: 'multi-input',
        validators: [Validators.required],
        initialValue: file.fileNumber || [],
        tooltip: 'Use the toggle above to automatically add the uploaded file\'s name (without extension) to this list',
      },
      system: {
        name: 'system',
        label: 'System',
        type: 'value-select',
        categoryAlias: 'system',
        canManageValues: true,
        validators: [Validators.required],
        initialValue: file.system?.id || null,
      },
      // Combined "Systems" field: file.system (primary, an ID) plus
      // file.relatedSystems (names resolved to IDs via the value cache). On
      // save the form value is split back into system (first) + relatedSystems
      // (rest, as names) — see rf-file-form.component.ts onSubmit.
      systems: {
        name: 'systems',
        label: 'Systems',
        type: 'multi-value-select',
        categoryAlias: 'system',
        canManageValues: true,
        validators: [Validators.required],
        initialValue: this.resolveSystemIds(file),
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
        type: 'value-select',
        categoryAlias: 'vendor',
        canManageValues: true,
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
      file: {
        name: 'file',
        label: 'Upload File',
        type: 'file',
        initialValue: null,
      },
      overrideFile: {
        name: 'overrideFile',
        label: 'If file already exists: (required — pick one)',
        type: 'radio-group',
        options: [
          { value: 'false', label: 'Revise (create new revision)' },
          { value: 'true', label: 'Override (replace existing)' },
        ],
        // No default — force a conscious choice every time a file is attached.
        initialValue: null,
        validators: [Validators.required],
      },
      isVerified: {
        name: 'isVerified',
        label: 'Is Verified',
        type: 'select',
        options: [
          { value: 'true', label: 'Yes' },
          { value: 'false', label: 'No' },
        ],
        initialValue: file.isVerified ? 'true' : 'false',
      },
    };

    // The override-vs-revise toggle only matters when editing an existing file;
    // for new uploads there's nothing to override, so filename collisions silently
    // become a "-revN" copy on disk. Hide the field in that case.
    const isNewFile = !file.id;
    return fields
      .filter((fieldName) => !(isNewFile && fieldName === 'overrideFile'))
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

  /**
   * Resolve the file's primary system + relatedSystems (names) into an array of
   * value-IDs for the multi-value-select form field. Reads {@link RfValueService}'s
   * signal cache, so consumers wrapping `toFormFields` in a `computed` will
   * automatically re-resolve once the "system" category finishes loading.
   * Returns IDs in order: primary first, then related (in original CSV order).
   * Unmatched names are dropped silently (they'd be impossible to display).
   */
  resolveSystemIds(file: FileDto): number[] {
    const primary = file.system?.id;
    const related = file.relatedSystems ?? [];
    if (!primary && related.length === 0) return [];

    const allValues = this.valueService.getValuesByCategory('system');
    const nameToId = new Map<string, number>();
    for (const v of allValues) {
      if (v?.name) nameToId.set(v.name.toLowerCase().trim(), v.id);
    }

    const ids: number[] = [];
    const seen = new Set<number>();
    if (primary && primary > 0) {
      ids.push(primary);
      seen.add(primary);
    }
    for (const raw of related) {
      if (!raw) continue;
      const id = nameToId.get(raw.toLowerCase().trim());
      if (id != null && !seen.has(id)) {
        ids.push(id);
        seen.add(id);
      }
    }
    return ids;
  }

  /**
   * Inverse of {@link resolveSystemIds}: split an array of value-IDs (from the
   * form's multi-value-select) into a primary system ID and a list of related
   * system NAMES. Returns names for related so the backend's existing String
   * `relatedSystems` column (CSV) round-trips without schema change.
   */
  splitSystemIds(systemIds: number[]): { primaryId: number | null; relatedNames: string[] } {
    if (!Array.isArray(systemIds) || systemIds.length === 0) {
      return { primaryId: null, relatedNames: [] };
    }
    const allValues = this.valueService.getValuesByCategory('system');
    const idToName = new Map<number, string>();
    for (const v of allValues) {
      if (v?.id != null && v.name) idToName.set(v.id, v.name);
    }
    const [primaryId, ...rest] = systemIds;
    const relatedNames = rest
      .map(id => idToName.get(id))
      .filter((n): n is string => !!n);
    return { primaryId: primaryId ?? null, relatedNames };
  }
}
