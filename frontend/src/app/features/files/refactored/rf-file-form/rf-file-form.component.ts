
import {
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { RfFileStateService } from '../services/rf-file-state.service';
import { FileDto } from '../../../../models/file/file.model';
import { RfReactiveFormComponent } from '../../../../shared/reactive-form/refactored/reactive-form/rf-reactive-form.component';
import { ClipboardFormComponent } from '../../../../shared/reactive-form/refactored/form-clipboard/clipboard-form.component';
import { ClipboardService } from '../../../../shared/clipboard/clipboard.service';
import { FileMapperService } from '../services/rf-file-mapper.service';
import { FileDraftComparisonDialogComponent } from '../file-draft-comparison-dialog/file-draft-comparison-dialog.component';

type FileFieldName = keyof FileDto;

@Component({
  selector: 'app-rf-file-form',
  imports: [RfReactiveFormComponent, ClipboardFormComponent, FileDraftComparisonDialogComponent],
  templateUrl: './rf-file-form.component.html',
  styleUrl: './rf-file-form.component.css',
})
export class RfFileFormComponent {
  protected stateService = inject(RfFileStateService);
  protected mapperService = inject(FileMapperService);
  protected clipboardService = inject(ClipboardService);

  entityInput = input<FileDto>();
  fieldsInput = input<FileFieldName[]>([]);

  private entityFromState = this.stateService.selectedItem;

  // Draft management - now using actual entities
  showDraftDialog = signal<boolean>(false);
  draftEntity = signal<FileDto | null>(null);
  serverEntity = signal<FileDto | null>(null);
  draftTimestamp = signal<string>('');

  // Track the original server version to detect real changes
  private originalServerVersion = signal<FileDto | null>(null);

  // Track the last entity ID we checked for drafts to prevent re-checking
  private lastCheckedEntityId = signal<number | null | undefined>(undefined);

  // Reset draft check state when form opens
  private resetOnFormOpen = effect(() => {
    const isOpen = this.stateService.isFileFormOpen();
    if (isOpen) {
      // Reset when form opens so we check for drafts again
      this.lastCheckedEntityId.set(undefined);
    }
  });

  entity = computed(
    () => this.entityInput() ?? this.entityFromState() ?? new FileDto()
  );

  // Check for drafts when entity changes
  private checkForDrafts = effect(() => {
    const currentEntity = this.entity();

    if (currentEntity) {
      const fileId = currentEntity.id || null;

      // Skip if we already checked this entity ID (including null for new items)
      if (this.lastCheckedEntityId() === fileId) {
        return;
      }

      const draft = this.stateService.loadDraftForItem(fileId);

      if (draft) {
        const draftData = new FileDto(draft.formData);

        // For existing items, check if draft is actually different from server version
        if (fileId !== null) {
          // Mark as checked for this entity
          this.lastCheckedEntityId.set(fileId);

          // Check if there are meaningful differences
          if (this.hasRealDifferences(currentEntity, draftData)) {
            // Store original server version for comparison
            this.originalServerVersion.set(currentEntity);

            // Store both versions as actual entities
            this.serverEntity.set(currentEntity);
            this.draftEntity.set(draftData);
            this.draftTimestamp.set(draft.timestamp);
            this.showDraftDialog.set(true);
          } else {
            // No real differences - just clear the draft silently
            console.log('Draft has no real differences from server version, clearing silently');
            this.stateService.clearDraftForItem(fileId);
          }
        } else {
          // For new items, auto-load draft directly
          // Mark as checked BEFORE setting item to prevent re-trigger
          this.lastCheckedEntityId.set(null);
          // Set the draft data as the selected item
          this.stateService.setSelectedItem(draftData);
          // Store an empty FileDto as the original version for change detection
          // This way, any changes from the draft will still be saved as drafts
          this.originalServerVersion.set(new FileDto());
        }
      } else {
        // No draft - store the original server version and mark as checked
        this.lastCheckedEntityId.set(fileId);
        this.originalServerVersion.set(currentEntity);
      }
    }
  });

  /**
   * Check if there are real differences between server and draft versions
   * Only compares fields that are actually in the form
   */
  private hasRealDifferences(server: FileDto, draft: FileDto): boolean {
    const formFields = this.fields();

    for (const field of formFields) {
      const serverValue = (server as any)[field.name];
      const draftValue = (draft as any)[field.name];

      if (this.isDifferent(serverValue, draftValue)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Deep comparison for any value type
   */
  private isDifferent(val1: any, val2: any): boolean {
    // Helper to check if value is effectively empty
    const isEffectivelyEmpty = (val: any): boolean => {
      if (val == null) return true;
      if (typeof val === 'object' && !Array.isArray(val)) {
        const keys = Object.keys(val).filter(k => {
          const v = val[k];
          if (v == null || v === '') return false;
          if (k === 'id' && (v === 0 || v === null)) return false;
          return true;
        });
        return keys.length === 0;
      }
      if (Array.isArray(val) && val.length === 0) return true;
      return false;
    };

    // Both effectively empty = same
    if (isEffectivelyEmpty(val1) && isEffectivelyEmpty(val2)) return false;

    // One empty, one not = different
    if (isEffectivelyEmpty(val1) || isEffectivelyEmpty(val2)) return true;

    // Both null = same
    if (val1 == null && val2 == null) return false;

    // Arrays
    if (Array.isArray(val1) && Array.isArray(val2)) {
      if (val1.length !== val2.length) return true;

      // Compare by IDs if objects have them
      if (val1[0] && typeof val1[0] === 'object' && val1[0].id) {
        const ids1 = val1.map(item => item.id).sort();
        const ids2 = val2.map(item => item.id).sort();
        return JSON.stringify(ids1) !== JSON.stringify(ids2);
      }

      // Use slice() to create copies before sorting to avoid mutating original arrays
      return JSON.stringify([...val1].sort()) !== JSON.stringify([...val2].sort());
    }

    // Objects
    if (typeof val1 === 'object' && typeof val2 === 'object') {
      // Compare by ID if available
      if (val1.id !== undefined && val2.id !== undefined) {
        return val1.id !== val2.id;
      }
      return JSON.stringify(val1) !== JSON.stringify(val2);
    }

    // Primitives
    return val1 !== val2;
  }

  private isNewItem(entity: FileDto): boolean {
    return !entity.id && (!!entity.name || entity.fileNumber.length > 0);
  }

  fields = computed(() => {
    const customFields = this.fieldsInput();
    const entity = this.entity();

    if (customFields.length > 0) {
      return this.mapperService.toFormFields(entity, customFields);
    }
    return this.mapperService.toFormFields(entity);
  });

  onAnyValueChange(item: FileDto) {
    const originalVersion = this.originalServerVersion();

    // Only save draft if there are real differences from the original server version
    if (originalVersion && this.hasRealDifferences(originalVersion, item)) {
      console.log('Saving draft - changes detected');
      this.stateService.saveDraft(item);
    } else {
      // No real changes - clear any existing draft
      const fileId = item.id || null;
      if (this.stateService.hasDraftForItem(fileId)) {
        console.log('Clearing draft - no real changes detected');
        this.stateService.clearDraftForItem(fileId);
      }
    }
  }

  onSubmit(formData: any) {
    // Extract file and overrideFile from form data (they're not part of FileDto)
    const file: File | null = formData.file instanceof File ? formData.file : null;
    const overrideFile: string = formData.overrideFile ?? 'false';

    // Remove file upload fields from the data before creating FileDto
    const { file: _, overrideFile: __, ...fileDtoData } = formData;

    // If a file is being uploaded, use the file upload flow
    if (file) {
      this.stateService.submitFormWithFile(fileDtoData, file, overrideFile);
    } else {
      // No file - just update metadata
      this.stateService.submitForm(fileDtoData);
    }
  }

  // Draft dialog handlers
  onUseServer(): void {
    const serverVersion = this.serverEntity();
    const fileId = serverVersion?.id || null;

    // Discard draft and use server version
    this.stateService.clearDraftForItem(fileId);
    this.stateService.setSelectedItem(serverVersion);

    // Close dialog
    this.showDraftDialog.set(false);
    this.draftEntity.set(null);
    this.serverEntity.set(null);
    this.draftTimestamp.set('');
  }

  onUseDraft(): void {
    const draftVersion = this.draftEntity();
    const fileId = draftVersion?.id || null;

    if (draftVersion) {
      // IMPORTANT: Clear the draft FIRST to prevent effect from detecting it again
      this.stateService.clearDraftForItem(fileId);

      // Close dialog BEFORE setting item to prevent race condition
      this.showDraftDialog.set(false);
      this.draftEntity.set(null);
      this.serverEntity.set(null);
      this.draftTimestamp.set('');

      // Now load draft version
      this.stateService.setSelectedItem(draftVersion);
    }
  }

  onCancelDraftDialog(): void {
    // Close dialog without making changes (keeps draft in localStorage)
    this.showDraftDialog.set(false);
    this.draftEntity.set(null);
    this.serverEntity.set(null);
    this.draftTimestamp.set('');
  }

  //===========================CLIPBOARD===========================
  initialEntity = signal<FileDto>(new FileDto());

  private captureInitialEntity = effect(() => {
    const entity = this.entity();
    const current = this.initialEntity();

    if (
      entity &&
      (entity.id || entity.name || entity.fileNumber.length > 0) &&
      !(current.id || current.name || current.fileNumber.length > 0)
    ) {
      this.initialEntity.set(structuredClone(entity));
    }
  });

  clipboardItems = computed(() => {
    const section = this.clipboardService.getSectionByType('File');
    return section?.items ?? [];
  });

  hasValidData = (entity: FileDto): boolean => {
    return !!(entity.id || entity.name || entity.fileNumber.length > 0);
  };

  getItemSummary = (item: FileDto): string => {
    return `${item.name || item.fileNumber.join(',') || 'N/A'} - ${
      item.fileType?.name || 'No type'
    }`;
  };

  onClipboardItemSelected(item: FileDto): void {
    if (item) {
      this.stateService.setSelectedItem(new FileDto(item));
    }
  }
}
