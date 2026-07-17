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
import { AuthService } from '../../../../services/auth.service';
import { GlobalMessageService } from '../../../../shared/global-message/global-message.service';
import { LotoStandardDto, PointPrerequisiteDto } from '../../../../models/loto/loto-standard.model';
import { LotoPointDto } from '../../../../models/loto/loto-point.model';
import { RfLotoPointApiService } from '../../../loto-points/refactored/services/rf-loto-point-api.service';
import { ZeroEnergyChange } from '../loto-builder/point-prerequisites-editor/point-prerequisites-editor.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, forkJoin } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { RfReactiveFormComponent } from '../../../../shared/reactive-form/refactored/reactive-form/rf-reactive-form.component';
import { DoubleLotoPointTableComponent } from '../../../loto-points/refactored/double-loto-point-table/double-loto-point-table.component';
import { LotoStandardImageViewerComponent } from '../loto-standard-image-viewer/loto-standard-image-viewer.component';
import { CounterpartStandardDialogComponent } from '../counterpart-standard-dialog/counterpart-standard-dialog.component';
import { BulkSearchDialogComponent } from '../../../loto-points/refactored/bulk-search-dialog/bulk-search-dialog.component';
import { LotoPointDtoLight } from '../../../../models/loto/bulk-search-result.model';
import { LotoStandardWorkflowPanelComponent } from '../loto-builder/loto-standard-workflow-panel/loto-standard-workflow-panel.component';
import { LotoStandardPendingChangesPanelComponent } from '../loto-builder/loto-standard-pending-changes-panel/loto-standard-pending-changes-panel.component';
import { LotoStandardCloseReviewDialogComponent } from '../loto-builder/loto-standard-close-review-dialog/loto-standard-close-review-dialog.component';
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
    LotoStandardPendingChangesPanelComponent,
    LotoStandardCloseReviewDialogComponent,
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
  private lotoPointApi = inject(RfLotoPointApiService);
  private authService = inject(AuthService);
  private messageService = inject(GlobalMessageService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  /** Read the tab-bar's Duplicate button visibility from the template. */
  canDuplicate = computed(() => !!this.entity().id && this.authService.isControlAuthority());

  /** Non-CA users don't see the Duplicate button, but we surface a tooltip anyway
   *  for anyone inspecting via keyboard nav. */
  duplicateTooltip = computed(() => {
    if (!this.entity().id) return 'Save the standard first';
    if (!this.authService.isControlAuthority()) return 'Requires the Control Authority role';
    return 'Duplicate this standard as a new independent DRAFT';
  });

  isDuplicating = signal(false);

  /** Delete Standard button — visible to Control Authority OR Manager
   *  (mirrors backend requireAnyRole gate on NgLotoStandardService.deleteStandard). */
  canDelete = computed(() => !!this.entity().id && (this.authService.isControlAuthority() || this.authService.isManager()));

  deleteTooltip = computed(() => {
    if (!this.entity().id) return 'Save the standard first';
    if (!this.canDelete()) return 'Requires the Control Authority or Manager role';
    return 'Delete this standard (pending changes, approval events, walkdown removed; LOTO Points preserved)';
  });

  isDeleting = signal(false);

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
          // For new items, auto-load draft — but skip if currentEntity already
          // matches the draft, otherwise this effect loops forever (writing
          // selectedItem retriggers entity(), which reloads the same draft).
          if (this.hasRealDifferences(currentEntity, draftData)) {
            this.stateService.setSelectedItem(draftData);
          }
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

  /** Collapses the "available points" browse table once the user is done adding points */
  hideAllItemsTable = signal<boolean>(false);

  toggleAllItemsTable(): void {
    this.hideAllItemsTable.update(hidden => !hidden);
  }

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

  /**
   * Duplicate the current standard into a fresh independent DRAFT.
   * <p>
   * The server does the deep-copy work (name with "(Copy)" suffix, description,
   * procedural prose, prerequisites JSON, ordering, groups). LOTO points are
   * SHARED between the source and the copy — they represent physical isolation
   * points and duplicating them would fork the physical world. Editing points,
   * prose, prerequisites, or ordering on the copy does not affect the source.
   * <p>
   * On success: the state service's {@code selectedItem} flips to the new copy
   * so the form re-renders on the duplicate, and the copy is appended to the
   * loaded-standards list so it appears in the sidebar. A confirm() prompt
   * gates the action since it creates a persistent row.
   */
  onDuplicate(): void {
    const source = this.entity();
    if (!source.id) return;
    if (!this.authService.isControlAuthority()) {
      this.messageService.showError('Duplicating a LOTO standard requires the Control Authority role.');
      return;
    }
    if (this.isDuplicating()) return;

    const confirmMsg = `Duplicate "${source.name || 'this standard'}"?\n\n`
      + `A new DRAFT with the same LOTO points and content will be created. `
      + `LOTO points are shared — editing them on the copy also affects the original. `
      + `Everything else can be edited independently.`;
    if (!confirm(confirmMsg)) return;

    this.isDuplicating.set(true);
    this.apiService.duplicateLotoStandard(source.id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (response) => {
        this.isDuplicating.set(false);
        const copy = LotoStandardDto.fromJson(response.responseData);
        this.stateService.addLotoStandards([copy]);
        this.stateService.selectedItem.set(copy);
        this.messageService.showSuccess(`Duplicated as "${copy.name}"`);
        // Bring the form back to the General Info slide so the operator sees
        // the new name and can rename it right away if needed.
        this.currentSlide.set(0);
      },
      error: (err) => {
        this.isDuplicating.set(false);
        const msg = err?.error?.message || err?.message || 'Failed to duplicate the standard';
        this.messageService.showError(msg);
      },
    });
  }

  /**
   * Delete the current standard. Backend cascades pending changes / approval
   * events / walkdown; permits are unlinked (never deleted); LOTO Points survive.
   * See {@code NgLotoStandardService.deleteStandard} for the full contract.
   * <p>
   * On success we prune the standard from the standards-page list AND from
   * the builder's carousel (if it happens to be there), then navigate to the
   * standards page — leaving the operator on a valid surface without a
   * dangling reference to a deleted id.
   */
  onDelete(): void {
    const s = this.entity();
    if (!s.id) return;
    if (!this.canDelete()) {
      this.messageService.showError('Deleting a LOTO standard requires the Control Authority or Manager role.');
      return;
    }
    if (this.isDeleting()) return;

    const confirmMsg = `Delete "${s.name || 'this standard'}"?\n\n`
      + `Pending changes, approval events, and the walkdown checklist will be removed.\n`
      + `LOTO Points are preserved.\n`
      + `Historical permits sourced from this standard survive with the source unlinked.\n\n`
      + `This cannot be undone from the UI.`;
    if (!confirm(confirmMsg)) return;

    this.isDeleting.set(true);
    this.apiService.deleteLotoStandard(String(s.id)).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.isDeleting.set(false);
        const deletedId = s.id!;
        this.stateService.removeLotoStandardById(deletedId);
        if (this.stateService.selectedItem()?.id === deletedId) {
          this.stateService.selectedItem.set(null);
        }
        this.messageService.showSuccess(`Deleted "${s.name}"`);
        this.router.navigate(['/loto-standard']);
      },
      error: (err) => {
        this.isDeleting.set(false);
        const status = err?.status;
        const serverMsg = err?.error?.message || err?.message;
        const msg = status === 409
          ? (serverMsg || 'Cannot delete — another user modified the standard while this delete was running. Try again.')
          : (serverMsg || 'Failed to delete the standard');
        this.messageService.showError(msg);
      },
    });
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
          this.router.navigate(['/loto/loto'], { queryParams: { lotoId: newPermitId } });
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
    installPrerequisitesText: string;
    installHazardControlText: string;
    installProcedureText: string;
    removalPrerequisitesText: string;
    removalHazardControlText: string;
    removalProcedureText: string;
  }>({
    installPrerequisitesText: '',
    installHazardControlText: '',
    installProcedureText: '',
    removalPrerequisitesText: '',
    removalHazardControlText: '',
    removalProcedureText: '',
  });

  proseSaving = signal(false);
  prereqSaving = signal(false);

  /**
   * Auto-save plumbing for the procedural-text textareas. Every keystroke
   * pushes to {@link proseAutoSaveTrigger}; the debounced subscription fires
   * a save 3s after the user pauses typing. The manual Save button still
   * works as a flush-now affordance.
   *
   * <p>Status:
   *  - {@code dirty} → user has typed since last save but the debounce hasn't fired
   *  - {@code saving} → save request in flight
   *  - {@code saved} → just succeeded; fades after 1.5s
   *  - {@code error} → last save failed; stays until next keystroke or success
   *  - {@code idle} → no unsaved changes, nothing to show
   */
  proseAutoSaveStatus = signal<'idle' | 'dirty' | 'saving' | 'saved' | 'proposed' | 'error'>('idle');
  private proseAutoSaveTrigger = new Subject<void>();
  private autoSaveDebounceMs = 3000;

  /** Wire the debounced trigger → save. Subscription cleaned up by takeUntilDestroyed. */
  private proseAutoSaveSub = this.proseAutoSaveTrigger
      .pipe(debounceTime(this.autoSaveDebounceMs), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.proseDirty() && !this.proseSaving()) {
          this.saveProse();
        }
      });

  /**
   * Whether the pending-changes review panel is open. Toggled by the workflow
   * banner's "Review changes" button. The panel itself can close via its
   * Hide button or by triggering the close-review dialog below.
   */
  showPendingChanges = signal(false);

  /**
   * Whether the close-review modal is open. Opened from the pending-changes
   * panel once every PENDING row is resolved.
   */
  showCloseReviewDialog = signal(false);

  /** Kept/dismissed counts forwarded from the panel into the close-review dialog. */
  closeReviewKeptCount = signal(0);
  closeReviewDismissedCount = signal(0);

  /** Tab selection for the Procedures slide — drives both prose section and per-point editor. */
  proseSide = signal<'INSTALL' | 'REMOVAL'>('INSTALL');

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
      installPrerequisitesText: e.installPrerequisitesText ?? '',
      installHazardControlText: e.installHazardControlText ?? '',
      installProcedureText: e.installProcedureText ?? '',
      removalPrerequisitesText: e.removalPrerequisitesText ?? '',
      removalHazardControlText: e.removalHazardControlText ?? '',
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
    return (e.installPrerequisitesText ?? '') !== d.installPrerequisitesText
        || (e.installHazardControlText ?? '') !== d.installHazardControlText
        || (e.installProcedureText ?? '') !== d.installProcedureText
        || (e.removalPrerequisitesText ?? '') !== d.removalPrerequisitesText
        || (e.removalHazardControlText ?? '') !== d.removalHazardControlText
        || (e.removalProcedureText ?? '') !== d.removalProcedureText;
  });

  onProseChange(field: keyof ReturnType<typeof this.proseDraft>, value: string): void {
    this.proseDraft.set({ ...this.proseDraft(), [field]: value });
    // Mark dirty immediately so the indicator shows "Unsaved" right away, even
    // before the debounce fires. Skipped while a save is in flight (we'll go
    // back to dirty if the user keeps typing during it).
    if (!this.proseSaving()) this.proseAutoSaveStatus.set('dirty');
    this.proseAutoSaveTrigger.next();
  }

  saveProse(): void {
    const id = this.entity().id;
    if (!id) return;
    this.proseSaving.set(true);
    this.proseAutoSaveStatus.set('saving');
    this.apiService.updateProceduralText(id, this.proseDraft())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.proseSaving.set(false);
          const updated = LotoStandardDto.fromJson(response.responseData);
          this.stateService.setSelectedItem(updated);
          // If user kept typing during the save, the draft is dirty against
          // the just-arrived entity; leave status as 'dirty' and the trigger
          // will fire another save. Otherwise reflect the right success state:
          // 'proposed' when the standard is APPROVED (backend stored a pending
          // proposal — entity content is unchanged on purpose), 'saved' otherwise.
          if (this.proseDirty()) {
            this.proseAutoSaveStatus.set('dirty');
            this.proseAutoSaveTrigger.next();
          } else if (this.isApprovedStandard(updated)) {
            this.proseAutoSaveStatus.set('proposed');
            // Proposed lingers longer than 'saved' — the user needs to read it.
            setTimeout(() => {
              if (this.proseAutoSaveStatus() === 'proposed') this.proseAutoSaveStatus.set('idle');
            }, 4000);
          } else {
            this.proseAutoSaveStatus.set('saved');
            setTimeout(() => {
              if (this.proseAutoSaveStatus() === 'saved') this.proseAutoSaveStatus.set('idle');
            }, 1500);
          }
        },
        error: (err) => {
          this.proseSaving.set(false);
          this.proseAutoSaveStatus.set('error');
          // Replace the modal alert with the inline indicator so the user
          // isn't interrupted mid-typing. The error state persists until the
          // next keystroke or a successful retry.
          console.error('Procedural text auto-save failed:', err);
        }
      });
  }

  /**
   * True iff the given standard's developmentStatus is APPROVED. The DTO
   * stores developmentStatus as either a ValueDto ({id, name}) or a plain
   * string depending on serialization layer, so check both shapes.
   */
  private isApprovedStandard(s: LotoStandardDto | null | undefined): boolean {
    if (!s) return false;
    const ds: unknown = (s as { developmentStatus?: unknown }).developmentStatus;
    if (typeof ds === 'string') return ds === 'APPROVED';
    if (ds && typeof ds === 'object' && 'name' in (ds as Record<string, unknown>)) {
      return (ds as { name?: unknown }).name === 'APPROVED';
    }
    return false;
  }

  resetProse(): void {
    const e = this.entity();
    this.proseDraft.set({
      installPrerequisitesText: e.installPrerequisitesText ?? '',
      installHazardControlText: e.installHazardControlText ?? '',
      installProcedureText: e.installProcedureText ?? '',
      removalPrerequisitesText: e.removalPrerequisitesText ?? '',
      removalHazardControlText: e.removalHazardControlText ?? '',
      removalProcedureText: e.removalProcedureText ?? '',
    });
  }

  /** Persist the standard's "removal reverses install order" flag. */
  onRemovalReverseChange(value: boolean): void {
    const id = this.entity().id;
    if (!id) return;
    this.apiService.setRemovalReverse(id, value)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const updated = LotoStandardDto.fromJson(response.responseData);
          this.stateService.setSelectedItem(updated);
        },
        error: (err) => {
          alert(`Failed to toggle removal direction: ${err?.error?.message ?? err?.message ?? 'Unknown'}`);
        }
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

  /**
   * Persist a zero-energy change made in the install procedure. Zero energy
   * lives on the LotoPoint, so this updates the point(s) themselves — a GLOBAL
   * change for a standard (Option A). The dialog hands us the full zeroEnergy
   * group value (phrase template id + equipment objects + editShared); we apply
   * it to every target point, preserving each point's own ZeroEnergy record id
   * so the backend updates rather than creates. One id = single edit; many =
   * bulk "apply to selected". The whole point is sent so other fields survive.
   * (For an APPROVED standard this flows through the pending-review capture.)
   */
  savePointZeroEnergy(change: ZeroEnergyChange): void {
    const targets = (this.entity().lotoPoints ?? []).filter(p => change.pointIds.includes(p.id!));
    if (!targets.length) return;
    const updates = targets.map(point => {
      const ze = { ...(change.zeroEnergy ?? {}), id: point.zeroEnergy?.id ?? null };
      const updated = new LotoPointDto({ ...point, zeroEnergy: ze });
      return this.lotoPointApi.updateLotoPoint(updated);
    });
    forkJoin(updates)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (responses) => {
          // Reflect the resolved points (with new zeroEnergyMethod) in local state.
          const savedById = new Map<number, LotoPointDto>();
          responses.forEach(r => {
            const saved = LotoPointDto.fromJson(r.responseData);
            if (saved.id != null) savedById.set(saved.id, saved);
          });
          const current = this.entity();
          const points = (current.lotoPoints ?? []).map(p => savedById.get(p.id!) ?? p);
          this.stateService.setSelectedItem(new LotoStandardDto({ ...current, lotoPoints: points }));
        },
        error: (err) => {
          alert(`Failed to save zero energy: ${err?.error?.message ?? err?.message ?? 'Unknown'}`);
        }
      });
  }

  onStandardUpdatedFromWorkflow(updated: LotoStandardDto): void {
    this.stateService.setSelectedItem(updated);
  }

  /**
   * Pending-changes panel asks us to open the close-review dialog. The panel
   * also hands us the kept/dismissed counts so the dialog can summarize them.
   */
  onCloseReviewRequested(counts: { kept: number; dismissed: number }): void {
    this.closeReviewKeptCount.set(counts.kept);
    this.closeReviewDismissedCount.set(counts.dismissed);
    this.showCloseReviewDialog.set(true);
  }

  /**
   * Close-review dialog succeeded — refresh the standard from the response
   * (so the banner disappears and developmentStatus is current), then
   * collapse the review surface.
   */
  onReviewClosed(updated: LotoStandardDto): void {
    this.stateService.setSelectedItem(updated);
    this.showCloseReviewDialog.set(false);
    this.showPendingChanges.set(false);
  }
}
