import { Component, computed, DestroyRef, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LotoStandardDto } from '../../../../../models/loto/loto-standard.model';
import { LotoStandardPendingChangeDto } from '../../../../../models/loto/loto-standard-workflow.model';
import { RfLotoStandardApiService } from '../../services/rf-loto-standard-api.service';
import { GlobalMessageService } from '../../../../../shared/global-message/global-message.service';
import { StepUpDialogComponent } from '../../../../../shared/step-up/step-up-dialog.component';
import { AuthService } from '../../../../../services/auth.service';

/**
 * Modal that closes a pending-review window. Reviewer picks whether the kept
 * edits are "minor" (standard stays APPROVED) or "substantive" (standard
 * flips to NEW_PENDING_REAPPROVAL), then enters a PIN to authorize. The
 * close-review endpoint server-side rejects if any PENDING rows remain;
 * the panel only enables the open-this-modal button when that condition
 * is already satisfied, so the modal almost never needs to handle that
 * case — but if it does happen (race), the backend error surfaces cleanly.
 *
 * <p>See {@code project/features/loto-standard/loto-procedure.md} §3.3.
 */
@Component({
  selector: 'app-loto-standard-close-review-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, StepUpDialogComponent],
  templateUrl: './loto-standard-close-review-dialog.component.html',
  styleUrl: './loto-standard-close-review-dialog.component.css',
})
export class LotoStandardCloseReviewDialogComponent {
  private apiService = inject(RfLotoStandardApiService);
  private messageService = inject(GlobalMessageService);
  private destroyRef = inject(DestroyRef);
  private authService = inject(AuthService);

  /** True iff the logged-in user already has CA or Manager authority. */
  readonly canCloseDirectly = computed(() =>
    this.authService.isControlAuthority() || this.authService.isManager());

  standard = input.required<LotoStandardDto>();

  /** Counts from the parent panel — surfaced in the modal summary line. */
  keptCount = input.required<number>();
  dismissedCount = input.required<number>();

  /** Emitted on successful close — parent should refresh standard + close the panel. */
  reviewClosed = output<LotoStandardDto>();

  /** Emitted when the user dismisses the dialog without closing the review. */
  cancelled = output<void>();

  /** Selected option. Defaults to "minor" — the safer choice. */
  requireReapproval = signal(false);

  /** All changes for this standard (loaded on init), used to inspect kept rows. */
  private changes = signal<LotoStandardPendingChangeDto[]>([]);

  /**
   * True when at least one KEPT change touches the point list (add / remove /
   * reorder). Adding or removing an isolation point is structural — the
   * reviewer must NOT be allowed to close as minor. We pre-select and lock
   * the "Require re-approval" radio in that case.
   */
  hasStructuralKeptChange = computed(() => {
    return this.changes()
        .filter(c => c.resolution === 'KEPT')
        .some(c => (c.fieldName ?? '').startsWith('lotoPoints'));
  });

  constructor() {
    // Load the change list so we can detect structural edits. Effect runs
    // when the input standard changes (id-driven reload).
    effect(() => {
      const id = this.standard().id;
      if (!id) return;
      this.apiService.getPendingChanges(id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: res => {
              this.changes.set(res.responseData ?? []);
              // If any kept change is structural, force the safer outcome.
              if (this.hasStructuralKeptChange()) {
                this.requireReapproval.set(true);
              }
            },
            error: () => { /* non-fatal — the safety guard just doesn't engage */ }
          });
    });
  }

  /** True once the user clicks Confirm and we open the step-up dialog. */
  awaitingStepUp = signal(false);

  /** True while the close-review API call is in flight. */
  isSubmitting = signal(false);

  /** Direct close — used when the logged-in user already has authority. */
  onConfirmDirect(): void {
    this.runCloseReview(null);
  }

  /** Step-up close — used when the user lacks authority OR wants to sign as someone else. */
  onConfirmEscalate(): void {
    this.awaitingStepUp.set(true);
  }

  onCancelClick(): void {
    this.cancelled.emit();
  }

  onStepUpAuthorized(result: { token: string; expiresAt: string }): void {
    this.awaitingStepUp.set(false);
    this.runCloseReview(result.token);
  }

  private runCloseReview(stepUpToken: string | null): void {
    const id = this.standard().id;
    if (!id) {
      this.messageService.showError('Standard has no id — cannot close review');
      return;
    }
    this.isSubmitting.set(true);
    this.apiService.closeReview(id, this.requireReapproval(), stepUpToken)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => {
          this.isSubmitting.set(false);
          const updated = LotoStandardDto.fromJson(res.responseData);
          const verb = this.requireReapproval()
            ? 'closed — standard requires re-approval'
            : 'closed as minor — standard remains APPROVED';
          this.messageService.showSuccess(`Review ${verb}`);
          this.reviewClosed.emit(updated);
        },
        error: err => {
          this.isSubmitting.set(false);
          const msg = err?.error?.message || err?.message || 'Close review failed';
          this.messageService.showError(msg);
        }
      });
  }

  onStepUpCancelled(): void {
    this.awaitingStepUp.set(false);
  }
}
