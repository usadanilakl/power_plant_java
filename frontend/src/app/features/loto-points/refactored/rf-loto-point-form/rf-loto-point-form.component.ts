import {
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  ViewChild,
} from '@angular/core';
import { RfLotoPointStateService } from '../services/rf-loto-point-state.service';
import { LotoPointMapperService } from '../services/rf-loto-point-mapper.service';
import { LotoPointDto } from '../../../../models/loto/loto-point.model';
import { RfReactiveFormComponent } from '../../../../shared/reactive-form/refactored/reactive-form/rf-reactive-form.component';
import { ClipboardFormComponent } from '../../../../shared/reactive-form/refactored/form-clipboard/clipboard-form.component';
import { ClipboardService } from '../../../../shared/clipboard/clipboard.service';
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

  // Tag number generator state
  isTagGeneratorOpen = signal<boolean>(false);

  entityInput = input<LotoPointDto>();
  fieldsInput = input<LotoPointFieldName[]>([]);

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

  // Check for drafts when entity changes
  private checkForDrafts = effect(() => {
    const currentEntity = this.entity();

    if (currentEntity && (currentEntity.id || this.isNewItem(currentEntity))) {
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
            console.log('Draft has no real differences from server version, clearing silently');
            this.stateService.clearDraftForItem(lotoPointId);
          }
        } else {
          // For new items, auto-load draft
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

    // Only save draft if there are real differences from the original server version
    if (originalVersion && this.hasRealDifferences(originalVersion, item)) {
      console.log('Saving draft - changes detected');
      this.stateService.saveDraft(item);
    } else {
      // No real changes - clear any existing draft
      const lotoPointId = item.id || null;
      if (this.stateService.hasDraftForItem(lotoPointId)) {
        console.log('Clearing draft - no real changes detected');
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

  onClipboardItemSelected(item: LotoPointDto): void {
    if (item) {
      console.log('Loading item from clipboard:', item);
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
    console.log('Tag number generated:', tagNumber);

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
}

// import {
//   Component,
//   computed,
//   effect,
//   inject,
//   input,
//   signal,
// } from '@angular/core';
// import { RfLotoPointStateService } from '../services/rf-loto-point-state.service';
// import { LotoPointMapperService } from '../services/rf-loto-point-mapper.service';
// import { LotoPointDto } from '../../../../models/loto/loto-point.model';
// import { FormField } from '../../../../models/ui/form-field.model';
// import { RfReactiveFormComponent } from '../../../../shared/reactive-form/refactored/reactive-form/rf-reactive-form.component';
// import { ClipboardService } from '../../../../shared/clipboard/clipboard.service';

// type LotoPointFieldName = keyof LotoPointDto;

// @Component({
//   selector: 'app-rf-loto-point-form',
//   imports: [RfReactiveFormComponent],
//   templateUrl: './rf-loto-point-form.component.html',
//   styleUrl: './rf-loto-point-form.component.css',
// })
// export class RfLotoPointFormComponent {
//   protected stateService = inject(RfLotoPointStateService);
//   protected mapperService = inject(LotoPointMapperService);
//   protected clipboardService = inject(ClipboardService);

//   entityInput = input<LotoPointDto>();
//   fieldsInput = input<LotoPointFieldName[]>([]);

//   private entityFromState = this.stateService.selectedItem;

//   entity = computed(
//     () => this.entityInput() ?? this.entityFromState() ?? new LotoPointDto()
//   );

//   fields = computed(() => {
//     const customFields = this.fieldsInput();
//     const entity = this.entity();

//     // If custom fields provided, use them
//     if (customFields.length > 0) {
//       console.log(
//         'Using custom fields:',
//         this.mapperService.toFormFields(entity, customFields)
//       );
//       return this.mapperService.toFormFields(entity, customFields);
//     }

//     // Otherwise use default fields
//     return this.mapperService.toFormFields(entity);
//   });

//   onAnyValueChange(item: LotoPointDto) {
//     this.stateService.saveDraft(item);
//   }

//   onSubmit(item: LotoPointDto) {
//     this.stateService.submitForm(item);
//   }

//   //===========================CLIPBOARD===========================
//   itemNumber = signal<number>(0);
//   initialEntity = new LotoPointDto();

//   private captureInitialEntity = effect(() => {
//     // Only capture once - if already captured, skip
//     if (
//       this.initialEntity.id ||
//       this.initialEntity.tagNumber ||
//       this.initialEntity.description
//     )
//       return;

//     const entity = this.entity();
//     if (entity && (entity.id || entity.tagNumber || entity.description)) {
//       // Create a new instance to preserve the original state
//       this.initialEntity = new LotoPointDto(entity);
//     }
//   });

//   clipboardItems = computed(() => {
//     const section = this.clipboardService.getSectionByType('LotoPoint');
//     if (section) {
//       return section.items;
//     }
//     return [];
//   });
//   clipboardItem = computed(() => {
//     return this.clipboardItems()[this.itemNumber() - 1];
//   });

//   loadItemEffect = effect(() => {
//     if (this.itemNumber() > 0) {
//       const item = this.clipboardItem(); // ✓ Now tracked and re-computed
//       if (item) {
//         console.log('Loading item from clipboard:', item);
//         this.stateService.setSelectedItem(new LotoPointDto(item));
//       }
//     } else {
//       // Load initial entity
//       this.stateService.setSelectedItem(this.initialEntity);
//     }
//   });
// }
