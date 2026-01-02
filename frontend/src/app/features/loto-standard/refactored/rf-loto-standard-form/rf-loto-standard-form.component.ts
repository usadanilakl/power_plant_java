import {
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  ViewChild,
} from '@angular/core';
import { RfLotoStandardStateService } from '../services/rf-loto-standard-state.service';
import { LotoStandardMapperService } from '../services/rf-loto-standard-mapper.service';
import { LotoStandardDto } from '../../../../models/loto/loto-standard.model';
import { LotoPointDto } from '../../../../models/loto/loto-point.model';
import { RfReactiveFormComponent } from '../../../../shared/reactive-form/refactored/reactive-form/rf-reactive-form.component';
import { DoubleLotoPointTableComponent } from '../../../loto-points/refactored/double-loto-point-table/double-loto-point-table.component';

type LotoStandardFieldName = keyof LotoStandardDto;

@Component({
  selector: 'app-rf-loto-standard-form',
  standalone: true,
  imports: [
    RfReactiveFormComponent,
    DoubleLotoPointTableComponent,
  ],
  templateUrl: './rf-loto-standard-form.component.html',
  styleUrl: './rf-loto-standard-form.component.css',
})
export class RfLotoStandardFormComponent {
  @ViewChild(RfReactiveFormComponent) reactiveForm!: RfReactiveFormComponent;

  protected stateService = inject(RfLotoStandardStateService);
  protected mapperService = inject(LotoStandardMapperService);

  entityInput = input<LotoStandardDto>();
  fieldsInput = input<LotoStandardFieldName[]>([]);

  private entityFromState = this.stateService.selectedItem;

  // Draft management
  showDraftDialog = signal<boolean>(false);
  draftEntity = signal<LotoStandardDto | null>(null);
  serverEntity = signal<LotoStandardDto | null>(null);
  draftTimestamp = signal<string>('');

  // Track the original server version to detect real changes
  private originalServerVersion = signal<LotoStandardDto | null>(null);

  entity = computed(
    () => this.entityInput() ?? this.entityFromState() ?? new LotoStandardDto()
  );

  // Check for drafts when entity changes
  private checkForDrafts = effect(() => {
    const currentEntity = this.entity();

    if (currentEntity && (currentEntity.id || this.isNewItem(currentEntity))) {
      const lotoStandardId = currentEntity.id || null;
      const draft = this.stateService.loadDraftForItem(lotoStandardId);

      if (draft) {
        const draftData = new LotoStandardDto(draft.formData);

        // For existing items, check if draft is actually different from server version
        if (lotoStandardId !== null) {
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
            this.stateService.clearDraftForItem(lotoStandardId);
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
   * Check if item is new (no ID)
   */
  private isNewItem(item: LotoStandardDto): boolean {
    return !item.id;
  }

  /**
   * Check if there are real differences between server and draft versions
   */
  private hasRealDifferences(server: LotoStandardDto, draft: LotoStandardDto): boolean {
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
    // Both null/undefined = same
    if (val1 == null && val2 == null) return false;
    // One null, one not = different
    if (val1 == null || val2 == null) return true;

    // Array comparison
    if (Array.isArray(val1) && Array.isArray(val2)) {
      if (val1.length !== val2.length) return true;
      return val1.some((item, idx) => this.isDifferent(item, val2[idx]));
    }

    // Object comparison
    if (typeof val1 === 'object' && typeof val2 === 'object') {
      const keys1 = Object.keys(val1);
      const keys2 = Object.keys(val2);
      if (keys1.length !== keys2.length) return true;
      return keys1.some(key => this.isDifferent(val1[key], val2[key]));
    }

    // Primitive comparison
    return val1 !== val2;
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

  isFormOpen = computed(() => {
    return this.stateService.isLotoStandardFormOpen();
  });

  /**
   * Get loto points from entity for double table
   */
  selectedLotoPoints = computed(() => {
    return this.entity().lotoPoints || [];
  });

  /**
   * Handle form value changes - save draft
   */
  onAnyValueChange(item: LotoStandardDto) {
    console.log('Form value changed:', item);

    // Only save draft if there are real differences from the original server version
    if (this.hasRealDifferences(this.originalServerVersion() ?? new LotoStandardDto(), item)) {
      this.stateService.saveDraft(item);
    }
  }

  /**
   * Handle form submission
   */
  onSubmit(item: LotoStandardDto) {
    console.log('Submitting LOTO Standard:', item);
    this.stateService.submitForm(item);
  }

  /**
   * Close form
   */
  closeForm() {
    this.stateService.closeForm();
  }

  /**
   * Draft dialog handlers
   */
  onUseDraft() {
    const draft = this.draftEntity();
    if (draft) {
      this.stateService.setSelectedItem(draft);
      this.originalServerVersion.set(draft);
    }
    this.showDraftDialog.set(false);
  }

  onUseServer() {
    const server = this.serverEntity();
    if (server) {
      // Clear the draft
      this.stateService.clearDraftForItem(server.id || null);
      this.stateService.setSelectedItem(server);
      this.originalServerVersion.set(server);
    }
    this.showDraftDialog.set(false);
  }

  onCancelDraftDialog() {
    this.showDraftDialog.set(false);
    this.closeForm();
  }

  /**
   * Handle loto points reordered from double table
   */
  onLotoPointsReordered(reorderedLotoPoints: LotoPointDto[]): void {
    console.log('LOTO Points reordered:', reorderedLotoPoints);

    // Update the entity with new loto points order
    const updatedEntity = new LotoStandardDto({
      ...this.entity(),
      lotoPoints: reorderedLotoPoints
    });

    // Update state and trigger draft save
    this.stateService.setSelectedItem(updatedEntity);
    this.onAnyValueChange(updatedEntity);
  }
}
