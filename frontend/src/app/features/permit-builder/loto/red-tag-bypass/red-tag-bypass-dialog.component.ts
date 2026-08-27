import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { SpringApiResponse } from '../../../../models/api/spring-api-response.model';

/**
 * "Red Tag Bypass" — Control-Authority-only modal that lets an operator jump
 * a LOTO directly to any lifecycle status and/or patch a small set of identity
 * fields, skipping the normal approval / hang / verify / activate gates.
 *
 * <p>Every submit hits {@code POST /ng/lotos/{id}/red-tag-bypass}, which writes
 * one {@code LotoBypassAudit} row. The backend re-enforces the CA role — this
 * component doesn't gate visibility, just enforces the "reason is required"
 * UX contract.
 */
@Component({
  selector: 'app-red-tag-bypass-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="scrim" (click)="onCancel()"></div>
  <div class="modal" role="dialog" aria-modal="true">
    <header>
      <h2>Red Tag Bypass</h2>
      <p class="hint">
        Force LOTO <b>#{{ lotoId }}</b> into a state without the normal gates.
        Control-Authority only. Every submit is audited.
      </p>
    </header>

    <div class="body">
      <label>
        Target status
        <select [(ngModel)]="targetStatus">
          <option [ngValue]="null">— no change —</option>
          <option value="Building">Building</option>
          <option value="Active">Active</option>
          <option value="Test">Test</option>
          <option value="Modification">Modification</option>
          <option value="Closed">Closed</option>
        </select>
      </label>

      <details class="advanced">
        <summary>Patch identity fields (optional)</summary>
        <label>Job description <input type="text" [(ngModel)]="workScope"></label>
        <label>Requestor        <input type="text" [(ngModel)]="lotoRequestor"></label>
        <label>Box number       <input type="number" min="0" [(ngModel)]="boxNumber"></label>
        <label>Red Tag number   <input type="text" [(ngModel)]="redTagNum"></label>
      </details>

      <label class="reason-row">
        Reason (required)
        <textarea rows="3" [(ngModel)]="reason"
                  placeholder="e.g. Reflecting Red Tag: crew hung this yesterday, our workflow missed the verify step"></textarea>
      </label>

      <div *ngIf="error()" class="err">{{ error() }}</div>
    </div>

    <footer>
      <button class="btn" (click)="onCancel()" [disabled]="submitting()">Cancel</button>
      <button class="btn primary" (click)="onSubmit()" [disabled]="submitting() || !isValid()">
        {{ submitting() ? 'Submitting…' : 'Apply Bypass' }}
      </button>
    </footer>
  </div>
  `,
  styles: [`
    .scrim { position: fixed; inset: 0; background: rgba(0,0,0,0.65); z-index: 9998; }
    .modal {
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      z-index: 9999; background: #1e1e1e; color: #eee;
      border: 1px solid #444; border-radius: 8px;
      width: min(520px, 95vw); max-height: 90vh; overflow: auto;
      box-shadow: 0 8px 24px rgba(0,0,0,0.5);
    }
    header { padding: 14px 18px; border-bottom: 1px solid #333; }
    header h2 { margin: 0 0 4px; font-size: 1.1rem; }
    .hint { margin: 0; color: #aaa; font-size: 0.85rem; }
    .body { padding: 14px 18px; display: flex; flex-direction: column; gap: 10px; }
    label { display: flex; flex-direction: column; gap: 4px; font-size: 0.85rem; color: #ccc; }
    label.reason-row textarea { resize: vertical; }
    input, select, textarea {
      background: #2a2a2a; color: #eee; border: 1px solid #444;
      padding: 5px 8px; border-radius: 4px; font: inherit;
    }
    .advanced summary {
      cursor: pointer; padding: 4px 0; color: #99c; font-size: 0.85rem;
    }
    .advanced label { margin-top: 6px; }
    footer {
      padding: 12px 18px; border-top: 1px solid #333;
      display: flex; justify-content: flex-end; gap: 10px;
    }
    .btn {
      padding: 6px 14px; border: 1px solid #4a4a4a; background: #2a2a2a;
      color: #eee; border-radius: 4px; cursor: pointer;
    }
    .btn:hover { background: #3a3a3a; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn.primary { background: #a04f4f; border-color: #cc5f5f; }
    .btn.primary:hover:not(:disabled) { background: #cc5f5f; }
    .err { color: #f6a6a6; font-size: 0.85rem; }
  `]
})
export class RedTagBypassDialogComponent {
  private http = inject(HttpClient);

  @Input({ required: true }) lotoId!: number;
  /** Current permit status of the target LOTO — surfaced only to help the CA choose. */
  @Input() currentStatus?: string | null;

  /** Emitted with {@code true} when the bypass was submitted successfully. */
  @Output() closed = new EventEmitter<boolean>();

  targetStatus: string | null = null;
  workScope = '';
  lotoRequestor = '';
  boxNumber: number | null = null;
  redTagNum = '';
  reason = '';

  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);

  isValid(): boolean {
    // A bypass without any real change is not useful; require at least one
    // field OR a status change, plus a reason.
    const hasReason = this.reason.trim().length > 0;
    const hasChange =
      (this.targetStatus != null && this.targetStatus !== this.currentStatus) ||
      this.workScope.trim().length > 0 ||
      this.lotoRequestor.trim().length > 0 ||
      (this.boxNumber != null && !Number.isNaN(this.boxNumber)) ||
      this.redTagNum.trim().length > 0;
    return hasReason && hasChange;
  }

  onCancel() { this.closed.emit(false); }

  onSubmit() {
    if (!this.isValid()) return;
    this.submitting.set(true);
    this.error.set(null);
    const body: Record<string, unknown> = {
      reason: this.reason.trim(),
    };
    if (this.targetStatus != null) body['targetStatus'] = this.targetStatus;
    if (this.workScope.trim()) body['workScope'] = this.workScope.trim();
    if (this.lotoRequestor.trim()) body['lotoRequestor'] = this.lotoRequestor.trim();
    if (this.boxNumber != null && !Number.isNaN(this.boxNumber)) body['boxNumber'] = this.boxNumber;
    if (this.redTagNum.trim()) body['redTagNum'] = this.redTagNum.trim();

    this.http.post<SpringApiResponse<unknown>>(
      `${environment.apiUrl}/lotos/${this.lotoId}/red-tag-bypass`, body
    ).subscribe({
      next: () => {
        this.submitting.set(false);
        this.closed.emit(true);
      },
      error: (err) => {
        this.submitting.set(false);
        const msg = (err?.error?.message ?? err?.message ?? 'Bypass failed').toString();
        this.error.set(msg);
      }
    });
  }
}
