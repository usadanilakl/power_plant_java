import {
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { RfLotoPointStateService } from '../services/rf-loto-point-state.service';
import { LotoPointMapperService } from '../services/rf-loto-point-mapper.service';
import { LotoPointDto } from '../../../../models/loto/loto-point.model';
import { RfReactiveFormComponent } from '../../../../shared/reactive-form/refactored/reactive-form/rf-reactive-form.component';
import { ClipboardFormComponent } from '../../../../shared/reactive-form/refactored/form-clipboard/clipboard-form.component';
import { ClipboardService } from '../../../../shared/clipboard/clipboard.service';
import { DraftComparisonDialogComponent } from '../draft-comparison-dialog/draft-comparison-dialog.component';
import { DraftMetadata } from '../../../../shared/draft/base-draft.service';
import { LotoPointModel } from '../../../../models/loto/loto-point.model';

type LotoPointFieldName = keyof LotoPointDto;

@Component({
  selector: 'app-rf-loto-point-form',
  imports: [RfReactiveFormComponent, ClipboardFormComponent, DraftComparisonDialogComponent],
  templateUrl: './rf-loto-point-form.component.html',
  styleUrl: './rf-loto-point-form.component.css',
})
export class RfLotoPointFormComponent {
  protected stateService = inject(RfLotoPointStateService);
  protected mapperService = inject(LotoPointMapperService);
  protected clipboardService = inject(ClipboardService);

  entityInput = input<LotoPointDto>();
  fieldsInput = input<LotoPointFieldName[]>([]);

  private entityFromState = this.stateService.selectedItem;

  // Draft management
  showDraftDialog = signal<boolean>(false);
  pendingDraft = signal<DraftMetadata<LotoPointModel> | null>(null);
  currentServerVersion = signal<LotoPointDto | null>(null);

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
        // For existing items, show comparison dialog
        if (lotoPointId !== null) {
          this.currentServerVersion.set(currentEntity);
          this.pendingDraft.set(draft);
          this.showDraftDialog.set(true);
        } else {
          // For new items, auto-load draft
          this.stateService.setSelectedItem(new LotoPointDto(draft.formData));
        }
      }
    }
  }, { allowSignalWrites: true });

  private isNewItem(entity: LotoPointDto): boolean {
    return !entity.id && (!!entity.tagNumber || !!entity.description);
  }

  fields = computed(() => {
    const customFields = this.fieldsInput();
    const entity = this.entity();

    if (customFields.length > 0) {
      console.log(
        'Using custom fields:',
        this.mapperService.toFormFields(entity, customFields)
      );
      return this.mapperService.toFormFields(entity, customFields);
    }

    console.log('Entity:', entity);
    console.log('Using default fields:', this.mapperService.toFormFields(entity));
    return this.mapperService.toFormFields(entity);
  });

  onAnyValueChange(item: LotoPointDto) {
    this.stateService.saveDraft(item);
  }

  onSubmit(item: LotoPointDto) {
    // Clear draft on successful submit
    const lotoPointId = item.id || null;
    this.stateService.clearDraftForItem(lotoPointId);
    this.stateService.submitForm(item);
  }

  // Draft dialog handlers
  onUseCurrent(): void {
    const lotoPointId = this.currentServerVersion()?.id || null;

    // Discard draft and use current server version
    this.stateService.clearDraftForItem(lotoPointId);
    this.stateService.setSelectedItem(this.currentServerVersion());

    // Close dialog
    this.showDraftDialog.set(false);
    this.pendingDraft.set(null);
    this.currentServerVersion.set(null);
  }

  onUseDraft(): void {
    const draft = this.pendingDraft();
    const lotoPointId = draft?.entityId || null;

    if (draft) {
      // IMPORTANT: Clear the draft FIRST to prevent effect from detecting it again
      this.stateService.clearDraftForItem(lotoPointId);

      // Close dialog BEFORE setting item to prevent race condition
      this.showDraftDialog.set(false);
      this.pendingDraft.set(null);
      this.currentServerVersion.set(null);

      // Now load draft version
      this.stateService.setSelectedItem(new LotoPointDto(draft.formData));
    }
  }

  onCancelDraftDialog(): void {
    // Close dialog without making changes (keeps draft in localStorage)
    this.showDraftDialog.set(false);
    this.pendingDraft.set(null);
    this.currentServerVersion.set(null);
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
