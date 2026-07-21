import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CorkBoardAction, CorkBoardActionType, ElectronService } from '../../services/electron.service';

interface ActionDraft {
  responseValue: string;
  comment: string;
}

/**
 * Presentational + interactive cork-board action card, extracted from CorkBoardComponent so the
 * Cork-Board page AND the always-visible advisory band render one shared implementation.
 * Owns the response draft, responder-name persistence, and the submit IPC call; emits `changed`
 * after a successful submit so the host can reload its action list.
 */
@Component({
  selector: 'app-cork-board-action-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <article class="action-card">
      <div class="action-top">
        <div class="action-title-row">
          <span class="material-icons action-icon">{{ getActionIcon(action.type) }}</span>
          <div>
            <h3>{{ action.title }}</h3>
            <p *ngIf="action.description">{{ action.description }}</p>
          </div>
        </div>
        <div class="action-meta">
          <span class="type-chip">{{ formatActionType(action.type) }}</span>
          <span class="expiry-chip" *ngIf="action.expiresOn">Expires {{ formatExpirationDate(action.expiresOn) }}</span>
          <span class="posted-chip" *ngIf="action.createdBy">{{ action.createdBy }}</span>
        </div>
      </div>

      <div class="summary-list" *ngIf="action.responseSummary.length > 0">
        <div class="summary-row" *ngFor="let summary of action.responseSummary">
          <div class="summary-label">
            <span>{{ summary.value }}</span>
            <strong>{{ summary.count }}</strong>
          </div>
          <div class="summary-bar">
            <span [style.width.%]="summaryPercent(summary.count)"></span>
          </div>
        </div>
      </div>

      <div class="response-count" *ngIf="action.responseCount > 0">
        {{ action.responseCount }} response{{ action.responseCount === 1 ? '' : 's' }}
        <span *ngIf="recentResponderNames()">| {{ recentResponderNames() }}</span>
      </div>

      <div class="response-row">
        <input
          type="text"
          class="name-input"
          placeholder="Your name"
          [(ngModel)]="responderName"
          [ngModelOptions]="{ standalone: true }"
        />
        <select
          *ngIf="requiresChoice()"
          [(ngModel)]="draft.responseValue"
          [ngModelOptions]="{ standalone: true }"
        >
          <option value="">Select response</option>
          <option *ngFor="let option of action.options" [value]="option">{{ option }}</option>
        </select>
        <input
          type="text"
          class="comment-input"
          placeholder="Comment"
          [(ngModel)]="draft.comment"
          [ngModelOptions]="{ standalone: true }"
        />
        <button class="btn btn-primary" (click)="submit()" [disabled]="submitting">
          {{ submitting ? 'Saving...' : submitLabel() }}
        </button>
      </div>

      <div class="card-message error-text" *ngIf="error">{{ error }}</div>
      <div class="card-message success-text" *ngIf="notice">{{ notice }}</div>
    </article>
  `,
  styles: [`
    input, select {
      width: 100%; box-sizing: border-box; border: 1px solid var(--border-color);
      border-radius: 6px; background: var(--bg-secondary); color: var(--text-primary);
      font-size: 13px; padding: 8px 9px; outline: none;
    }
    input:focus, select:focus { border-color: var(--accent-primary); }

    .action-card {
      border: 1px solid var(--border-color); border-radius: 8px; padding: 12px;
      background: rgba(15, 15, 26, 0.26);
    }
    .action-top { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; }
    .action-title-row { display: flex; gap: 10px; min-width: 0; }
    .action-icon { color: #38bdf8; font-size: 22px; flex-shrink: 0; margin-top: 1px; }
    .action-title-row h3 { margin: 0; color: var(--text-primary); font-size: 14px; font-weight: 650; }
    .action-title-row p { margin: 4px 0 0; color: var(--text-secondary); font-size: 12px; line-height: 1.4; }
    .action-meta { display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; flex-shrink: 0; }
    .type-chip, .posted-chip {
      font-size: 10px; line-height: 1; color: var(--text-secondary);
      border: 1px solid var(--border-color); border-radius: 4px;
      padding: 5px 6px; background: rgba(15, 15, 26, 0.45);
    }
    .expiry-chip {
      color: var(--text-secondary);
      border: 1px solid var(--border-color); border-radius: 4px;
      padding: 5px 6px; background: rgba(15, 15, 26, 0.45); font-size: 10px; line-height: 1;
    }

    .summary-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 8px; margin-top: 12px; }
    .summary-row {
      border: 1px solid var(--border-color); border-radius: 6px; padding: 7px;
      background: var(--bg-secondary);
    }
    .summary-label { display: flex; justify-content: space-between; gap: 8px; font-size: 12px; color: var(--text-secondary); }
    .summary-label span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .summary-label strong { color: var(--text-primary); }
    .summary-bar { height: 5px; background: rgba(148, 163, 184, 0.18); border-radius: 999px; overflow: hidden; margin-top: 6px; }
    .summary-bar span { display: block; height: 100%; background: #38bdf8; border-radius: inherit; }
    .response-count { color: var(--text-muted); font-size: 11px; margin-top: 9px; }

    .response-row {
      display: grid; grid-template-columns: minmax(130px, 0.35fr) minmax(150px, 0.45fr) minmax(160px, 1fr) auto;
      gap: 8px; align-items: center; margin-top: 10px;
    }
    .name-input, .comment-input { min-height: 32px; }

    .card-message { font-size: 12px; margin-top: 8px; }
    .error-text { color: var(--accent-error); }
    .success-text { color: #22c55e; }

    @media (max-width: 640px) {
      .response-row { grid-template-columns: 1fr; }
    }
  `],
})
export class CorkBoardActionCardComponent implements OnInit, OnChanges {
  @Input({ required: true }) action!: CorkBoardAction;
  @Output() changed = new EventEmitter<void>();

  responderName = '';
  draft: ActionDraft = { responseValue: '', comment: '' };
  submitting = false;
  error = '';
  notice = '';

  private currentActionId = '';

  constructor(private electronService: ElectronService) {}

  ngOnInit(): void {
    this.restoreResponderName();
    this.resetDraft();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Rebuild the draft only when a different action is bound (list reloads pass a fresh object
    // with the same id — don't wipe an in-progress selection in that case).
    if (changes['action'] && this.action && this.action.id !== this.currentActionId) {
      this.resetDraft();
    }
  }

  async submit(): Promise<void> {
    this.error = '';
    this.notice = '';
    const responderName = this.responderName.trim();
    if (!responderName) {
      this.error = 'Enter your name before submitting';
      return;
    }
    const responseValue = this.responseValueForAction();
    if (!responseValue) {
      this.error = 'Select a response before submitting';
      return;
    }

    this.submitting = true;
    try {
      const result = await this.electronService.corkBoardSubmitAction({
        actionId: this.action.id,
        actionTitle: this.action.title,
        responderName,
        responseValue,
        comment: this.draft.comment.trim() || undefined,
      });
      if (!result.success) {
        this.error = result.error || 'Failed to submit response';
        return;
      }
      this.saveResponderName(responderName);
      this.draft.comment = '';
      this.notice = result.data?.updated ? 'Response updated.' : 'Response submitted.';
      this.changed.emit();
    } catch (err: any) {
      this.error = err?.message || 'Failed to submit response';
    } finally {
      this.submitting = false;
    }
  }

  requiresChoice(): boolean {
    return this.action.type !== 'acknowledge' && this.action.options.length > 0;
  }

  submitLabel(): string {
    if (this.action.type === 'poll') return 'Vote';
    if (this.action.type === 'signup') return 'Sign Up';
    return 'Acknowledge';
  }

  getActionIcon(type: CorkBoardActionType): string {
    if (type === 'poll') return 'poll';
    if (type === 'signup') return 'how_to_reg';
    return 'assignment_turned_in';
  }

  formatActionType(type: CorkBoardActionType): string {
    if (type === 'poll') return 'Poll';
    if (type === 'signup') return 'Signup';
    return 'Acknowledge';
  }

  summaryPercent(count: number): number {
    if (this.action.responseCount < 1 || count < 1) return 0;
    return Math.max(8, Math.round((count / this.action.responseCount) * 100));
  }

  recentResponderNames(): string {
    return this.action.responses.slice(0, 5).map(r => r.responderName).join(', ');
  }

  formatExpirationDate(value: string): string {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString();
  }

  private resetDraft(): void {
    this.currentActionId = this.action?.id ?? '';
    this.draft = this.defaultDraft();
    this.error = '';
    this.notice = '';
  }

  private defaultDraft(): ActionDraft {
    if (this.action.type === 'acknowledge') return { responseValue: 'Acknowledged', comment: '' };
    if (this.action.options.length > 0) return { responseValue: this.action.options[0], comment: '' };
    if (this.action.type === 'signup') return { responseValue: 'Signed up', comment: '' };
    return { responseValue: '', comment: '' };
  }

  private responseValueForAction(): string {
    if (this.action.type === 'acknowledge') return 'Acknowledged';
    if (this.action.type === 'signup' && this.action.options.length === 0) return 'Signed up';
    return this.draft.responseValue.trim();
  }

  private restoreResponderName(): void {
    try {
      this.responderName = localStorage.getItem('corkBoardResponderName') || '';
    } catch { /* ignore unavailable storage */ }
  }

  private saveResponderName(name: string): void {
    try {
      localStorage.setItem('corkBoardResponderName', name);
    } catch { /* ignore unavailable storage */ }
  }
}
