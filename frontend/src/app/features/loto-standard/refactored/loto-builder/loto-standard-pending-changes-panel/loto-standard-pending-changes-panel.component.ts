import { Component, computed, DestroyRef, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LotoStandardDto } from '../../../../../models/loto/loto-standard.model';
import {
  LotoStandardPendingChangeDto,
  LotoStandardPendingChangeResolution,
} from '../../../../../models/loto/loto-standard-workflow.model';
import { RfLotoStandardApiService } from '../../services/rf-loto-standard-api.service';
import { GlobalMessageService } from '../../../../../shared/global-message/global-message.service';
import { StepUpDialogComponent } from '../../../../../shared/step-up/step-up-dialog.component';
import { AuthService } from '../../../../../services/auth.service';

interface PendingActionContext {
  kind: 'keep' | 'dismiss';
  change: LotoStandardPendingChangeDto;
}

/**
 * Lists every captured field-level edit on a LOTO Standard that is in
 * pending-review (loto-procedure.md §3.3). For PENDING rows the reviewer
 * (CA or Manager) sees Keep / Dismiss buttons; each opens the step-up
 * dialog so the reviewer signs as themselves. KEPT/DISMISSED rows are
 * shown for context with their resolver attribution.
 *
 * <p>Closing the review (require re-approval or accept as minor) lives in
 * a separate modal (step 4); this panel just emits {@code closeReviewRequested}
 * to ask the parent to open it.
 */
@Component({
  selector: 'app-loto-standard-pending-changes-panel',
  standalone: true,
  imports: [CommonModule, StepUpDialogComponent],
  templateUrl: './loto-standard-pending-changes-panel.component.html',
  styleUrl: './loto-standard-pending-changes-panel.component.css',
})
export class LotoStandardPendingChangesPanelComponent {
  private apiService = inject(RfLotoStandardApiService);
  private messageService = inject(GlobalMessageService);
  private destroyRef = inject(DestroyRef);
  private authService = inject(AuthService);

  /**
   * True iff the logged-in user already holds CA or Manager authority. When
   * true, Keep/Dismiss can be performed directly (no PIN); the step-up dialog
   * is only needed for escalation (signing as a different reviewer).
   */
  readonly canReviewDirectly = computed(() =>
    this.authService.isControlAuthority() || this.authService.isManager());

  /** Standard whose pending changes to display. Reloads on id change. */
  standard = input.required<LotoStandardDto>();

  /**
   * Emitted when the user clicks Close — parent opens the close-review modal.
   * Includes kept/dismissed counts so the modal's summary doesn't have to
   * refetch the change list.
   */
  closeReviewRequested = output<{ kept: number; dismissed: number }>();

  /** Emitted when the panel itself should be closed without further action. */
  panelClosed = output<void>();

  changes = signal<LotoStandardPendingChangeDto[]>([]);
  isLoading = signal(false);
  loadError = signal<string | null>(null);

  /** What action a pending step-up should authorize, if any. */
  stepUpContext = signal<PendingActionContext | null>(null);

  pendingCount = computed(() =>
    this.changes().filter(c => c.resolution === 'PENDING').length);
  keptCount = computed(() =>
    this.changes().filter(c => c.resolution === 'KEPT').length);
  dismissedCount = computed(() =>
    this.changes().filter(c => c.resolution === 'DISMISSED').length);

  /** All PENDING rows resolved, so closing is allowed. */
  readyToClose = computed(() => this.changes().length > 0 && this.pendingCount() === 0);

  constructor() {
    // Reload whenever the standard id changes (e.g., user navigates between
    // standards while the panel is open).
    effect(() => {
      const id = this.standard().id;
      if (id) this.reload(id);
    });
  }

  reload(standardId?: number): void {
    const id = standardId ?? this.standard().id;
    if (!id) return;
    this.isLoading.set(true);
    this.loadError.set(null);
    this.apiService.getPendingChanges(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => {
          this.changes.set(res.responseData ?? []);
          this.isLoading.set(false);
        },
        error: err => {
          this.isLoading.set(false);
          const msg = err?.error?.message || err?.message || 'Failed to load pending changes';
          this.loadError.set(msg);
        }
      });
  }

  /**
   * Direct Keep — used by the authorized-user button. Bypasses the step-up
   * dialog because the logged-in user already has CA/Manager authority.
   */
  onKeepDirect(change: LotoStandardPendingChangeDto): void {
    if (change.resolution !== 'PENDING') return;
    this.runResolution('keep', change, null);
  }

  /** Direct Dismiss for already-authorized users. See {@link onKeepDirect}. */
  onDismissDirect(change: LotoStandardPendingChangeDto): void {
    if (change.resolution !== 'PENDING') return;
    this.runResolution('dismiss', change, null);
  }

  /** Open the step-up dialog so the reviewer can sign Keep as someone else. */
  onKeepEscalate(change: LotoStandardPendingChangeDto): void {
    if (change.resolution !== 'PENDING') return;
    this.stepUpContext.set({ kind: 'keep', change });
  }

  /** Open the step-up dialog so the reviewer can sign Dismiss as someone else. */
  onDismissEscalate(change: LotoStandardPendingChangeDto): void {
    if (change.resolution !== 'PENDING') return;
    this.stepUpContext.set({ kind: 'dismiss', change });
  }

  onStepUpAuthorized(result: { token: string; expiresAt: string }): void {
    const ctx = this.stepUpContext();
    this.stepUpContext.set(null);
    if (!ctx) return;
    this.runResolution(ctx.kind, ctx.change, result.token);
  }

  /** Shared keep/dismiss execution path used by both direct and step-up buttons. */
  private runResolution(
      kind: 'keep' | 'dismiss',
      change: LotoStandardPendingChangeDto,
      stepUpToken: string | null): void {
    const obs = kind === 'keep'
      ? this.apiService.keepPendingChange(change.id, stepUpToken)
      : this.apiService.dismissPendingChange(change.id, stepUpToken);
    obs.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.messageService.showSuccess(
            `Change marked ${kind === 'keep' ? 'KEPT' : 'DISMISSED'}`);
          this.reload();
        },
        error: err => {
          const msg = err?.error?.message || err?.message || `${kind} failed`;
          this.messageService.showError(msg);
        }
      });
  }

  onStepUpCancelled(): void {
    this.stepUpContext.set(null);
  }

  onCloseReviewClick(): void {
    if (!this.readyToClose()) return;
    this.closeReviewRequested.emit({ kept: this.keptCount(), dismissed: this.dismissedCount() });
  }

  onClosePanelClick(): void {
    this.panelClosed.emit();
  }

  /** Friendly label for the action context (shown in the step-up dialog). */
  stepUpLabel(): string {
    const ctx = this.stepUpContext();
    if (!ctx) return '';
    const verb = ctx.kind === 'keep' ? 'Keep' : 'Dismiss';
    return `${verb} change to ${ctx.change.fieldName}`;
  }

  /** Stable per-row test id, includes resolution so passing rows are distinguishable. */
  testIdForChange(c: LotoStandardPendingChangeDto): string {
    return `pending-change-${c.id}`;
  }

  formatTimestamp(ts: string | null | undefined): string {
    if (!ts) return '';
    const d = new Date(ts);
    if (isNaN(d.getTime())) return ts;
    return d.toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' });
  }

  /** Pretty-print null as "—" so the diff doesn't show "null" literally. */
  displayValue(v: string | null | undefined): string {
    if (v === null || v === undefined || v === '') return '—';
    return v;
  }

  /** CSS class for a row based on resolution. */
  rowClass(r: LotoStandardPendingChangeResolution): string {
    return 'row-' + r.toLowerCase();
  }
}
