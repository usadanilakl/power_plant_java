import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RfLotoStandardStateService } from '../services/rf-loto-standard-state.service';
import { LotoStandardMapperService } from '../services/rf-loto-standard-mapper.service';
import { RfLotoStandardApiService } from '../services/rf-loto-standard-api.service';
import { LotoService } from '../../../../services/loto/loto.service';
import { LotoStandardDto, PointPrerequisiteDto } from '../../../../models/loto/loto-standard.model';
import { LotoPointDto } from '../../../../models/loto/loto-point.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RfReactiveFormComponent } from '../../../../shared/reactive-form/refactored/reactive-form/rf-reactive-form.component';
import { DoubleLotoPointTableComponent } from '../../../loto-points/refactored/double-loto-point-table/double-loto-point-table.component';
import { LotoStandardImageViewerComponent } from '../loto-standard-image-viewer/loto-standard-image-viewer.component';
import { CounterpartStandardDialogComponent } from '../counterpart-standard-dialog/counterpart-standard-dialog.component';
import { BulkSearchDialogComponent } from '../../../loto-points/refactored/bulk-search-dialog/bulk-search-dialog.component';
import { LotoPointDtoLight } from '../../../../models/loto/bulk-search-result.model';
import { LotoStandardWorkflowPanelComponent } from '../loto-builder/loto-standard-workflow-panel/loto-standard-workflow-panel.component';
import { PointPrerequisitesEditorComponent } from '../loto-builder/point-prerequisites-editor/point-prerequisites-editor.component';

type LotoStandardFieldName = keyof LotoStandardDto;

@Component({
  selector: 'app-rf-loto-standard-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RfReactiveFormComponent,
    DoubleLotoPointTableComponent,
    LotoStandardImageViewerComponent,
    CounterpartStandardDialogComponent,
    BulkSearchDialogComponent,
    LotoStandardWorkflowPanelComponent,
    PointPrerequisitesEditorComponent,
  ],
  templateUrl: './rf-loto-standard-form.component.html',
  styleUrl: './rf-loto-standard-form.component.css',
})
export class RfLotoStandardFormComponent {
  @ViewChild(RfReactiveFormComponent) reactiveForm!: RfReactiveFormComponent;

  protected stateService = inject(RfLotoStandardStateService);
  protected mapperService = inject(LotoStandardMapperService);
  private apiService = inject(RfLotoStandardApiService);
  private lotoService = inject(LotoService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

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
      return this.mapperService.toFormFields(entity, customFields);
    }

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

  // Counterpart dialog
  showCounterpartDialog = signal<boolean>(false);

  // Bulk search dialog
  showBulkSearchDialog = signal<boolean>(false);

  /**
   * Carousel state
   */
  currentSlide = signal<number>(0);

  /**
   * Handle form value changes - save draft
   */
  onAnyValueChange(item: LotoStandardDto) {

    // Only save draft if there are real differences from the original server version
    if (this.hasRealDifferences(this.originalServerVersion() ?? new LotoStandardDto(), item)) {
      this.stateService.saveDraft(item);
    }
  }

  /**
   * Handle form submission
   */
  onSubmit(item: LotoStandardDto) {
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
    const currentEntity = this.entity();

    // Update the entity with new loto points order
    const updatedEntity = new LotoStandardDto({
      ...currentEntity,
      lotoPoints: reorderedLotoPoints
    });

    // Update state
    this.stateService.setSelectedItem(updatedEntity);

    // If entity is saved (has ID), immediately persist to server
    if (currentEntity.id) {
      const lotoPointIds = reorderedLotoPoints.map(lp => lp.id!);
      this.apiService.reorderLotoPoints(currentEntity.id, lotoPointIds)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          error: (err) => console.error('Failed to reorder LOTO points:', err)
        });
    }
  }

  /**
   * Handle loto point added from double table
   */
  onLotoPointAdded(addedPoint: LotoPointDto): void {
    const currentEntity = this.entity();

    // Update local state
    const currentPoints = currentEntity.lotoPoints || [];
    const updatedEntity = new LotoStandardDto({
      ...currentEntity,
      lotoPoints: [...currentPoints, addedPoint]
    });
    this.stateService.setSelectedItem(updatedEntity);

    // If entity is saved (has ID), immediately persist to server
    if (currentEntity.id && addedPoint.id) {
      this.apiService.addLotoPointToStandard(currentEntity.id, addedPoint.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          error: (err) => console.error('Failed to add LOTO point:', err)
        });
    }
  }

  /**
   * Handle loto point removed from double table
   */
  onLotoPointRemoved(removedPoint: LotoPointDto): void {
    const currentEntity = this.entity();

    // Update local state
    const currentPoints = currentEntity.lotoPoints || [];
    const updatedEntity = new LotoStandardDto({
      ...currentEntity,
      lotoPoints: currentPoints.filter(lp => lp.id !== removedPoint.id)
    });
    this.stateService.setSelectedItem(updatedEntity);

    // If entity is saved (has ID), immediately persist to server
    if (currentEntity.id && removedPoint.id) {
      this.apiService.removeLotoPointFromStandard(currentEntity.id, removedPoint.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          error: (err) => console.error('Failed to remove LOTO point:', err)
        });
    }
  }

  /**
   * Carousel navigation methods
   */
  goToSlide(index: number): void {
    this.currentSlide.set(index);
  }

  nextSlide(): void {
    const current = this.currentSlide();
    // Slides 0=Info, 1=Points, 2=Procedures, 3=Workflow, 4=Images
    // Slides 2-4 require a saved entity (id).
    if (current < 4 && (current !== 1 || this.entity().id)) {
      this.currentSlide.set(current + 1);
    }
  }

  previousSlide(): void {
    const current = this.currentSlide();
    if (current > 0) {
      this.currentSlide.set(current - 1);
    }
  }

  openCounterpartDialog(): void {
    this.showCounterpartDialog.set(true);
  }

  flipToPermit(): void {
    const standardId = this.entity().id;
    if (!standardId) {
      alert('Save the LOTO standard before flipping to a permit.');
      return;
    }
    this.lotoService.createFromStandard(standardId).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (response) => {
        const newPermitId = response?.responseData?.id;
        if (newPermitId) {
          this.router.navigate(['/permit-builder/lotos'], { queryParams: { lotoId: newPermitId } });
        } else {
          alert('LOTO permit was not created — backend returned no id.');
        }
      },
      error: (err) => {
        console.error('Error creating LOTO permit from standard', err);
        alert(`Error flipping LOTO standard to permit: ${err?.error?.message ?? err?.message ?? 'Unknown'}`);
      }
    });
  }

  onCounterpartCreated(created: LotoStandardDto): void {
    this.showCounterpartDialog.set(false);
    // Optionally load the newly created standard
    this.stateService.setSelectedItem(created);
  }

  onBulkPointsSelected(points: LotoPointDtoLight[]): void {
    this.showBulkSearchDialog.set(false);
    for (const light of points) {
      const dto = new LotoPointDto({
        id: light.id,
        tagNumber: light.tagNumber,
        description: light.description,
        unit: light.unit,
        specificLocation: light.specificLocation,
        normalPosition: light.normalPosition,
        isolatedPosition: light.isolatedPosition,
        oldId: light.oldId,
      });
      this.onLotoPointAdded(dto);
    }
  }

  // ── Procedural prose (Procedures slide) ──────────────────────────────────

  proseDraft = signal<{
    prerequisitesText: string;
    hazardControlMethodsText: string;
    installProcedureText: string;
    removalProcedureText: string;
  }>({
    prerequisitesText: '',
    hazardControlMethodsText: '',
    installProcedureText: '',
    removalProcedureText: '',
  });

  proseSaving = signal(false);
  prereqSaving = signal(false);

  // Tracks the last entity id this form's prose draft was synced from.
  // We always reset when the id changes (navigated to a new Standard); we DO NOT
  // overwrite an unsaved-dirty draft when the id is the same (e.g. when a sibling
  // save round-trips a fresh entity that doesn't reflect this section's edits).
  private proseLastSyncedId = signal<number | null>(null);

  private syncProseDraft = effect(() => {
    const e = this.entity();
    const newId = e.id ?? null;
    const prevId = this.proseLastSyncedId();
    const fromEntity = {
      prerequisitesText: e.prerequisitesText ?? '',
      hazardControlMethodsText: e.hazardControlMethodsText ?? '',
      installProcedureText: e.installProcedureText ?? '',
      removalProcedureText: e.removalProcedureText ?? '',
    };
    if (newId !== prevId) {
      // Different entity (or initial load) → always reset.
      this.proseDraft.set(fromEntity);
      this.proseLastSyncedId.set(newId);
    } else if (!this.proseDirty()) {
      // Same entity, no unsaved edits → safe to absorb server changes.
      this.proseDraft.set(fromEntity);
    }
  }, { allowSignalWrites: true });

  proseDirty = computed(() => {
    const e = this.entity();
    const d = this.proseDraft();
    return (e.prerequisitesText ?? '') !== d.prerequisitesText
        || (e.hazardControlMethodsText ?? '') !== d.hazardControlMethodsText
        || (e.installProcedureText ?? '') !== d.installProcedureText
        || (e.removalProcedureText ?? '') !== d.removalProcedureText;
  });

  onProseChange(field: keyof ReturnType<typeof this.proseDraft>, value: string): void {
    this.proseDraft.set({ ...this.proseDraft(), [field]: value });
  }

  saveProse(): void {
    const id = this.entity().id;
    if (!id) return;
    this.proseSaving.set(true);
    this.apiService.updateProceduralText(id, this.proseDraft())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.proseSaving.set(false);
          const updated = LotoStandardDto.fromJson(response.responseData);
          this.stateService.setSelectedItem(updated);
        },
        error: (err) => {
          this.proseSaving.set(false);
          alert(`Failed to save procedural text: ${err?.error?.message ?? err?.message ?? 'Unknown'}`);
        }
      });
  }

  resetProse(): void {
    const e = this.entity();
    this.proseDraft.set({
      prerequisitesText: e.prerequisitesText ?? '',
      hazardControlMethodsText: e.hazardControlMethodsText ?? '',
      installProcedureText: e.installProcedureText ?? '',
      removalProcedureText: e.removalProcedureText ?? '',
    });
  }

  savePrereqs(prerequisites: Record<number, PointPrerequisiteDto>): void {
    const id = this.entity().id;
    if (!id) return;
    this.prereqSaving.set(true);
    this.apiService.updatePrerequisites(id, prerequisites)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.prereqSaving.set(false);
          const updated = LotoStandardDto.fromJson(response.responseData);
          this.stateService.setSelectedItem(updated);
        },
        error: (err) => {
          this.prereqSaving.set(false);
          alert(`Failed to save prerequisites: ${err?.error?.message ?? err?.message ?? 'Unknown'}`);
        }
      });
  }

  onStandardUpdatedFromWorkflow(updated: LotoStandardDto): void {
    this.stateService.setSelectedItem(updated);
  }
}
