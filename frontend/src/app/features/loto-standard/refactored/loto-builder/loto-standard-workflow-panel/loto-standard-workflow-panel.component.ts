import { Component, computed, DestroyRef, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LotoStandardDto } from '../../../../../models/loto/loto-standard.model';
import {
  LotoStandardStatusName,
  LotoRole,
  LotoStandardApprovalEventDto,
  allowedTargetStatuses,
  statusColor,
  actionLabelFor,
  endpointForTarget,
  roleForTarget,
} from '../../../../../models/loto/loto-standard-workflow.model';
import { RfLotoStandardApiService } from '../../services/rf-loto-standard-api.service';
import { AuthService } from '../../../../../services/auth.service';
import { GlobalMessageService } from '../../../../../shared/global-message/global-message.service';
import { StepUpDialogComponent } from '../../../../../shared/step-up/step-up-dialog.component';

interface ActionButton {
  targetStatus: string;
  label: string;
  endpointSegment: string;
  enabled: boolean;
  disabledReason: string | null;
}

@Component({
  selector: 'app-loto-standard-workflow-panel',
  standalone: true,
  imports: [CommonModule, StepUpDialogComponent],
  templateUrl: './loto-standard-workflow-panel.component.html',
  styleUrl: './loto-standard-workflow-panel.component.css',
})
export class LotoStandardWorkflowPanelComponent {
  private apiService = inject(RfLotoStandardApiService);
  private authService = inject(AuthService);
  private messageService = inject(GlobalMessageService);
  private destroyRef = inject(DestroyRef);

  /** The standard whose workflow we are showing. */
  standard = input.required<LotoStandardDto>();

  /** Emitted when a workflow transition completes — parent should refresh state. */
  standardUpdated = output<LotoStandardDto>();

  /**
   * Emitted when the user clicks "Review changes" on the pending-review banner.
   * The parent should open the pending-changes panel (added in step 3 — for now
   * the listener can no-op or log).
   */
  reviewChangesRequested = output<void>();

  isProcessing = signal(false);
  showHistory = signal(false);
  history = signal<LotoStandardApprovalEventDto[]>([]);
  historyLoaded = signal(false);

  /**
   * What action a pending step-up should authorize. Non-null = dialog open.
   * When the user clicks the "(PIN)" variant of a workflow action we stash
   * the action context here, mount the step-up dialog, and on authorize
   * run the transition with the returned token.
   */
  stepUpContext = signal<{ action: ActionButton } | null>(null);

  currentStatusName = computed(() => this.standard().developmentStatus?.name ?? LotoStandardStatusName.DRAFT);
  currentStatusColor = computed(() => statusColor(this.currentStatusName()));
  isNewPendingReapproval = computed(() => this.currentStatusName() === LotoStandardStatusName.NEW_PENDING_REAPPROVAL);
  isApproved = computed(() => this.currentStatusName() === LotoStandardStatusName.APPROVED);
  isUnsaved = computed(() => !this.standard().id);
  /** APPROVED standards with edits pending CA/Manager review show a yellow banner. */
  isPendingReview = computed(() => !!this.standard().pendingReviewSince);

  actions = computed<ActionButton[]>(() => {
    const std = this.standard();
    if (!std.id) return [];
    const targets = allowedTargetStatuses(this.currentStatusName());
    return targets.map(target => this.buildAction(std, target));
  });

  attribution = computed(() => {
    const s = this.standard();
    return [
      { label: 'Submitted', by: s.submittedForVerificationBy, at: s.submittedForVerificationAt },
      { label: 'Verified', by: s.verifiedBy, at: s.verifiedAt },
      { label: 'Walkdown', by: s.walkdownBy, at: s.walkdownAt },
      { label: 'Ready for Testing', by: s.readyForTestingBy, at: s.readyForTestingAt },
      { label: 'Approved', by: s.managerApprovedBy, at: s.managerApprovedAt },
    ].filter(a => a.by || a.at);
  });

  private buildAction(std: LotoStandardDto, target: string): ActionButton {
    const endpoint = endpointForTarget(target);
    const required = roleForTarget(target);
    const userRoles = (this.authService.currentUser?.roles ?? []).map(r => r?.toUpperCase());
    const userName = this.authService.currentUser?.name || '';
    // Legacy alias: a user tagged QUALIFIED in old data is treated as CONTROL_AUTHORITY here.
    const accepts = required === 'CONTROL_AUTHORITY'
      ? ['CONTROL_AUTHORITY', 'QUALIFIED']
      : [required];
    const hasRole = userRoles.some(r => accepts.includes(r));

    let enabled = !!endpoint && hasRole;
    let disabledReason: string | null = null;

    if (!hasRole) {
      disabledReason = `Requires ${required} role`;
    } else if (target === LotoStandardStatusName.VERIFIED) {
      // Second-person verification: surface client-side rather than waiting for backend reject
      if (userName && std.createdBy && userName.toLowerCase() === std.createdBy.toLowerCase()) {
        enabled = false;
        disabledReason = 'Verifier must differ from creator';
      } else if (userName && std.submittedForVerificationBy && userName.toLowerCase() === std.submittedForVerificationBy.toLowerCase()) {
        enabled = false;
        disabledReason = 'Verifier must differ from submitter';
      }
    }

    return {
      targetStatus: target,
      label: actionLabelFor(target),
      endpointSegment: endpoint || '',
      enabled,
      disabledReason,
    };
  }

  onActionClick(action: ActionButton): void {
    if (!action.enabled || this.isProcessing()) return;
    this.runAction(action, /*stepUpToken*/ null);
  }

  /**
   * Open the step-up dialog so a different qualified user can authorize this
   * action on the current session's tablet. Always available (regardless of
   * direct-button enabled state) once the standard has an id and the action
   * has a valid endpoint segment — the role/SoD check happens server-side
   * against the PIN bearer, not the logged-in user.
   */
  onStepUpClick(action: ActionButton): void {
    if (this.isProcessing()) return;
    const std = this.standard();
    if (!std.id || !action.endpointSegment) return;
    this.stepUpContext.set({ action });
  }

  onStepUpAuthorized(result: { token: string; expiresAt: string }): void {
    const ctx = this.stepUpContext();
    this.stepUpContext.set(null);
    if (!ctx) return;
    this.runAction(ctx.action, result.token);
  }

  onStepUpCancelled(): void {
    this.stepUpContext.set(null);
  }

  /**
   * Whether to show the "(PIN)" button for an action. We show it whenever the
   * action has an endpoint segment, so a third party can sign in via PIN even
   * if the direct button is disabled (wrong role, second-person rule, etc.).
   */
  canStepUp(action: ActionButton): boolean {
    return !!action.endpointSegment && !this.isUnsaved() && !this.isProcessing();
  }

  /** Stable test id for the direct action button. */
  testIdForAction(action: ActionButton): string {
    return `workflow-action-${action.endpointSegment}`;
  }

  /** Stable test id for the "(PIN)" variant. */
  testIdForStepUp(action: ActionButton): string {
    return `workflow-action-${action.endpointSegment}-pin`;
  }

  /** Forward the review request to the parent. Wired up in step 3 to open the panel. */
  onReviewChangesClick(): void {
    this.reviewChangesRequested.emit();
  }

  /** Shared action runner — same logic for direct and step-up paths. */
  private runAction(action: ActionButton, stepUpToken: string | null): void {
    const std = this.standard();
    if (!std.id || !action.endpointSegment) return;

    const verb = stepUpToken ? `${action.label} (PIN)` : action.label;
    const confirmMsg = `${verb}?\n\nCurrent status: ${this.currentStatusName()}\nNew status: ${action.targetStatus}`;
    if (!confirm(confirmMsg)) return;

    const notes = prompt('Optional notes for this transition (leave blank to skip):', '') || null;

    this.isProcessing.set(true);
    this.apiService.workflowTransition(std.id, action.endpointSegment, notes, stepUpToken)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.isProcessing.set(false);
          const updated = LotoStandardDto.fromJson(response.responseData);
          this.messageService.showSuccess(`Standard ${action.label.toLowerCase()}`);
          this.standardUpdated.emit(updated);
          if (this.showHistory()) this.loadHistory();
        },
        error: (err) => {
          this.isProcessing.set(false);
          const msg = err?.error?.message || err?.message || 'Transition failed';
          this.messageService.showError(msg);
        }
      });
  }

  toggleHistory(): void {
    const next = !this.showHistory();
    this.showHistory.set(next);
    if (next && !this.historyLoaded()) {
      this.loadHistory();
    }
  }

  private loadHistory(): void {
    const std = this.standard();
    if (!std.id) return;
    this.apiService.getWorkflowHistory(std.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.history.set(response.responseData || []);
          this.historyLoaded.set(true);
        },
        error: (err) => {
          console.error('Failed to load workflow history:', err);
          this.messageService.showError('Failed to load workflow history');
        }
      });
  }

  formatTimestamp(ts: string | null | undefined): string {
    if (!ts) return '';
    const d = new Date(ts);
    if (isNaN(d.getTime())) return ts;
    return d.toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' });
  }
}
