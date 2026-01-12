import {
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  ViewChild,
} from '@angular/core';
import { RfLotoPointStateService } from '../services/rf-loto-point-state.service';
import { LotoPointMapperService } from '../services/rf-loto-point-mapper.service';
import { RfLotoPointApiService } from '../services/rf-loto-point-api.service';
import { LotoPointDto } from '../../../../models/loto/loto-point.model';
import { LotoPointClipboardItem } from '../../../../models/loto/loto-point-clipboard.model';
import { RfReactiveFormComponent } from '../../../../shared/reactive-form/refactored/reactive-form/rf-reactive-form.component';
import { ClipboardFormComponent } from '../../../../shared/reactive-form/refactored/form-clipboard/clipboard-form.component';
import { ClipboardService } from '../../../../shared/clipboard/clipboard.service';
import { ConfirmationService } from '../../../../services/ui/confirmation.service';
import { DraftComparisonDialogComponent } from '../draft-comparison-dialog/draft-comparison-dialog.component';
import { TagNumberGeneratorComponent } from '../../../tag-number/tag-number-generator/tag-number-generator.component';
import { PopupProjectionComponent } from '../../../../shared/popup-projection/popup-projection.component';
import { LotoPointFileViewerComponent } from '../loto-point-file-viewer/loto-point-file-viewer.component';

type LotoPointFieldName = keyof LotoPointDto;

@Component({
  selector: 'app-rf-loto-point-form',
  imports: [
    RfReactiveFormComponent,
    ClipboardFormComponent,
    DraftComparisonDialogComponent,
    TagNumberGeneratorComponent,
    PopupProjectionComponent,
    LotoPointFileViewerComponent
  ],
  templateUrl: './rf-loto-point-form.component.html',
  styleUrl: './rf-loto-point-form.component.css',
})
export class RfLotoPointFormComponent {
  @ViewChild(RfReactiveFormComponent) reactiveForm!: RfReactiveFormComponent;

  protected stateService = inject(RfLotoPointStateService);
  protected mapperService = inject(LotoPointMapperService);
  protected clipboardService = inject(ClipboardService);
  protected apiService = inject(RfLotoPointApiService);
  protected confirmationService = inject(ConfirmationService);

  // Tag number generator state
  isTagGeneratorOpen = signal<boolean>(false);

  // Carousel state
  currentSlide = signal<number>(0);

  goToSlide(index: number): void {
    this.currentSlide.set(index);
  }

  nextSlide(): void {
    if (this.currentSlide() < 1) {
      this.currentSlide.update(s => s + 1);
    }
  }

  previousSlide(): void {
    if (this.currentSlide() > 0) {
      this.currentSlide.update(s => s - 1);
    }
  }

  entityInput = input<LotoPointDto>();
  fieldsInput = input<LotoPointFieldName[]>([]);

  // Output for form value changes (passthrough from reactive form)
  formValueChange = output<LotoPointDto>();

  private entityFromState = this.stateService.selectedItem;

  // Draft management - now using actual entities
  showDraftDialog = signal<boolean>(false);
  draftEntity = signal<LotoPointDto | null>(null);
  serverEntity = signal<LotoPointDto | null>(null);
  draftTimestamp = signal<string>('');

  // Track the original server version to detect real changes
  private originalServerVersion = signal<LotoPointDto | null>(null);

  entity = computed(
    () => this.entityInput() ?? this.entityFromState() ?? new LotoPointDto()
  );

  // Track whether we've already checked for drafts to avoid infinite loops
  private draftCheckDone = signal<boolean>(false);
  // Track the last entity ID we checked drafts for
  private lastEntityIdChecked = signal<number | null | undefined>(undefined);

  // Reset draft check when entity ID changes
  private resetDraftCheck = effect(() => {
    const currentEntity = this.entity();
    const currentId = currentEntity?.id ?? null;
    const lastId = this.lastEntityIdChecked();

    // If entity ID changed, reset the draft check flag
    if (lastId !== undefined && currentId !== lastId) {
      this.draftCheckDone.set(false);
    }
    this.lastEntityIdChecked.set(currentId);
  });

  // Check for drafts when entity changes
  private checkForDrafts = effect(() => {
    const currentEntity = this.entity();

    // Check for existing item (has ID) or new item that has data
    const isExistingItem = currentEntity && currentEntity.id;
    const isNewItemWithData = currentEntity && this.isNewItem(currentEntity);
    // Also check for completely new items (blank form) - check for new item drafts
    const isBlankNewItem = currentEntity && !currentEntity.id && !currentEntity.tagNumber && !currentEntity.description;

    if (isExistingItem || isNewItemWithData || isBlankNewItem) {
      const lotoPointId = currentEntity.id || null;
      const draft = this.stateService.loadDraftForItem(lotoPointId);

      if (draft) {
        const draftData = new LotoPointDto(draft.formData);

        // For existing items, check if draft is actually different from server version
        if (lotoPointId !== null) {
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
            this.stateService.clearDraftForItem(lotoPointId);
          }
        } else if (!this.draftCheckDone()) {
          // For new items (including blank forms), auto-load draft
          // Only do this once to prevent infinite loops
          this.draftCheckDone.set(true);
          this.stateService.setSelectedItem(draftData);
        }
      } else {
        // No draft - store the original server version
        this.originalServerVersion.set(currentEntity);
      }
    }
  });

  /**
   * Check if there are real differences between server and draft versions
   * Only compares fields that are actually in the form
   */
  private hasRealDifferences(server: LotoPointDto, draft: LotoPointDto): boolean {
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

      return JSON.stringify(val1.sort()) !== JSON.stringify(val2.sort());
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

  private isNewItem(entity: LotoPointDto): boolean {
    return !entity.id && (!!entity.tagNumber || !!entity.description);
  }

  fields = computed(() => {
    const customFields = this.fieldsInput();
    const entity = this.entity();

    if (customFields.length > 0) {
      return this.mapperService.toFormFields(entity, customFields);
    }
    return this.mapperService.toFormFields(entity);
  });

  onAnyValueChange(item: LotoPointDto) {
    const originalVersion = this.originalServerVersion();

    // Emit form value change for parent components
    this.formValueChange.emit(item);

    // Only save draft if there are real differences from the original server version
    if (originalVersion && this.hasRealDifferences(originalVersion, item)) {
      this.stateService.saveDraft(item);
    } else {
      // No real changes - clear any existing draft
      const lotoPointId = item.id || null;
      if (this.stateService.hasDraftForItem(lotoPointId)) {
        this.stateService.clearDraftForItem(lotoPointId);
      }
    }
  }

  onSubmit(item: LotoPointDto) {
    // Draft will be cleared by submitForm after successful save
    this.stateService.submitForm(item);
  }

  // Draft dialog handlers
  onUseServer(): void {
    const serverVersion = this.serverEntity();
    const lotoPointId = serverVersion?.id || null;

    // Discard draft and use server version
    this.stateService.clearDraftForItem(lotoPointId);
    this.stateService.setSelectedItem(serverVersion);

    // Close dialog
    this.showDraftDialog.set(false);
    this.draftEntity.set(null);
    this.serverEntity.set(null);
    this.draftTimestamp.set('');
  }

  onUseDraft(): void {
    const draftVersion = this.draftEntity();
    const lotoPointId = draftVersion?.id || null;

    if (draftVersion) {
      // IMPORTANT: Clear the draft FIRST to prevent effect from detecting it again
      this.stateService.clearDraftForItem(lotoPointId);

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
  initialEntity = signal<LotoPointDto>(new LotoPointDto());

  private captureInitialEntity = effect(() => {
    const entity = this.entity();
    const current = this.initialEntity();

    if (
      entity &&
      (entity.id || entity.tagNumber || entity.description) &&
      !(current.id || current.tagNumber || current.description)
    ) {
      this.initialEntity.set(structuredClone(entity));
    }
  });

  clipboardItems = computed(() => {
    const section = this.clipboardService.getSectionByType('LotoPoint');
    return section?.items ?? [];
  });

  hasValidData = (entity: LotoPointDto): boolean => {
    return !!(entity.id || entity.tagNumber || entity.description);
  };

  getItemSummary = (item: LotoPointDto): string => {
    return `${item.tagNumber || 'N/A'} - ${
      item.description || 'No description'
    }`;
  };

  /**
   * Formatter to transform LotoPointDto to LotoPointClipboardItem before adding to clipboard
   */
  clipboardFormatter = (entity: LotoPointDto): LotoPointClipboardItem => {
    const clipboardItem = new LotoPointClipboardItem(entity);
    clipboardItem.objectType = 'LotoPoint';
    return clipboardItem;
  };

  onClipboardItemSelected(item: LotoPointDto): void {
    if (item) {
      this.stateService.setSelectedItem(new LotoPointDto(item));
    }
  }

  //===========================TAG NUMBER GENERATOR===========================
  openTagGenerator(): void {
    this.isTagGeneratorOpen.set(true);
  }

  closeTagGenerator(): void {
    this.isTagGeneratorOpen.set(false);
  }

  onTagGenerated(tagNumber: string): void {
    // Update the form with the new tag number
    if (this.reactiveForm) {
      const currentEntity = this.entity();
      const updatedEntity = new LotoPointDto({
        ...currentEntity,
        tagNumber: tagNumber
      });

      this.stateService.setSelectedItem(updatedEntity);
      this.closeTagGenerator();
    }
  }

  //===========================DELETE===========================
  /**
   * Check if the current entity can be deleted (must have an ID)
   */
  canDelete(): boolean {
    return !!this.entity()?.id;
  }

  /**
   * Handle delete button click with confirmation dialogs.
   * If counterpart exists, asks user if they want to delete it too.
   */
  onDelete(): void {
    const currentEntity = this.entity();
    if (!currentEntity?.id) {
      return;
    }

    const tagNumber = currentEntity.tagNumber || `LOTO Point #${currentEntity.id}`;

    // First confirmation - delete the LOTO point
    this.confirmationService.confirm(
      `Are you sure you want to delete "${tagNumber}"?\n\nThis will also delete all associated equipment shapes.`
    ).then(confirmed => {
      if (!confirmed) {
        return;
      }

      // Check if this point has a counterpart
      const counterpartId = currentEntity.counterpartId;
      if (counterpartId) {
        // Ask about counterpart deletion
        this.confirmationService.confirm(
          `This LOTO point has a linked counterpart.\n\nDo you also want to delete the counterpart LOTO point?`
        ).then(deleteCounterpart => {
          this.executeDelete(currentEntity.id!, deleteCounterpart);
        });
      } else {
        // No counterpart, just delete
        this.executeDelete(currentEntity.id!, false);
      }
    });
  }

  /**
   * Execute the delete API call
   */
  private executeDelete(id: number, deleteCounterpart: boolean): void {
    // Get counterpartId for proper broadcast if deleting counterpart too
    // Convert null to undefined since API expects number | undefined
    const counterpartId = deleteCounterpart ? (this.entity().counterpartId ?? undefined) : undefined;
    this.apiService.deleteLotoPoint(id, deleteCounterpart, counterpartId).subscribe({
      next: (response) => {
        console.log('LOTO point deleted successfully:', response);
        // Clear the form and close
        this.stateService.setSelectedItem(null);
        this.stateService.closeForm();
      },
      error: (error) => {
        console.error('Error deleting LOTO point:', error);
        alert('Failed to delete LOTO point: ' + (error.error?.message || error.message || 'Unknown error'));
      }
    });
  }
}