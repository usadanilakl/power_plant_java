import { Component, inject, signal, output, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { StepUpService } from '../../services/auth/step-up.service';

/**
 * One-shot authorization dialog. User enters initials + PIN as one string
 * (e.g. "DK1234"), backend validates and returns a single-use token. The token
 * is emitted via {@link authorized} for the caller to attach to the next
 * HTTP request as {@code X-Sign-As-Token} header.
 *
 * See project/features/users/pin-authentication.md.
 */
@Component({
  selector: 'app-step-up-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule],
  template: `
    <div class="su-backdrop" (click)="onCancel()">
      <div class="su-dialog" (click)="$event.stopPropagation()">
        <div class="su-header">
          <mat-icon>vpn_key</mat-icon>
          <strong>Authorize action</strong>
        </div>
        @if (actionLabel(); as label) {
          <div class="su-action-label">{{ label }}</div>
        }
        <p class="su-help">Enter your <strong>2-letter initials + 4-digit PIN</strong> (e.g. <code>DK1234</code>).</p>
        <input
          #codeInput
          type="text"
          class="su-input"
          autocomplete="off"
          inputmode="text"
          maxlength="7"
          [disabled]="submitting()"
          [class.error]="!!errorMessage()"
          [ngModel]="code()"
          (ngModelChange)="onCodeChange($event)"
          (keydown.enter)="onSubmit()"
          placeholder="DK1234"
          autofocus>
        @if (errorMessage(); as msg) {
          <div class="su-error">{{ msg }}</div>
        }
        <div class="su-actions">
          <button mat-stroked-button type="button" (click)="onCancel()" [disabled]="submitting()">Cancel</button>
          <button mat-raised-button color="primary" type="button" (click)="onSubmit()"
                  [disabled]="!canSubmit() || submitting()">
            {{ submitting() ? 'Verifying…' : 'Authorize' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .su-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.65); display: flex; align-items: center; justify-content: center; z-index: 1500; }
    .su-dialog { background: #1f1f1f; border: 1px solid #444; border-radius: 8px; padding: 22px; min-width: 320px; max-width: 400px; box-shadow: 0 8px 32px rgba(0,0,0,0.5); }
    .su-header { display: flex; align-items: center; gap: 8px; color: #82b1ff; font-size: 16px; margin-bottom: 8px; }
    .su-action-label { color: #ccc; font-size: 13px; padding: 6px 10px; background: #2a2a2a; border-radius: 4px; margin-bottom: 12px; font-style: italic; }
    .su-help { color: #aaa; font-size: 13px; margin: 0 0 12px; line-height: 1.4; }
    .su-help code { background: #2a2a2a; padding: 1px 6px; border-radius: 3px; color: #82b1ff; }
    .su-input { width: 100%; background: #2a2a2a; border: 1px solid #555; border-radius: 4px; color: white; padding: 12px; font-size: 22px; font-family: 'Courier New', monospace; letter-spacing: 4px; text-transform: uppercase; text-align: center; box-sizing: border-box; }
    .su-input:focus { outline: none; border-color: #82b1ff; }
    .su-input.error { border-color: #e57373; }
    .su-input:disabled { opacity: 0.6; }
    .su-error { color: #e57373; font-size: 12px; margin-top: 8px; }
    .su-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; }
  `],
})
export class StepUpDialogComponent {
  private stepUpService = inject(StepUpService);

  /** Short human-readable label for the action being authorized — shown above the code input. */
  actionLabel = input<string | null>(null);

  /** Emitted on successful authorization with the single-use token + expiry. */
  authorized = output<{ token: string; expiresAt: string }>();

  /** Emitted when the user cancels the dialog. */
  cancelled = output<void>();

  code = signal('');
  errorMessage = signal<string | null>(null);
  submitting = signal(false);

  onCodeChange(value: string): void {
    // Normalize to uppercase, strip spaces. Allow only alphanumerics; cap at 7 chars.
    const cleaned = (value ?? '').replace(/\s+/g, '').replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 7);
    this.code.set(cleaned);
    if (this.errorMessage()) this.errorMessage.set(null);
  }

  canSubmit(): boolean {
    return /^[A-Z]{2,3}\d{4}$/.test(this.code());
  }

  async onSubmit(): Promise<void> {
    if (!this.canSubmit() || this.submitting()) return;
    this.submitting.set(true);
    this.errorMessage.set(null);
    try {
      const result = await this.stepUpService.authorizeAsync(this.code());
      this.authorized.emit(result);
    } catch (err: any) {
      const msg = err?.error?.message ?? err?.message ?? 'Authorization failed';
      this.errorMessage.set(msg);
      // Clear code on failure so the user starts fresh (avoids letting them iterate digit-by-digit)
      this.code.set('');
    } finally {
      this.submitting.set(false);
    }
  }

  onCancel(): void {
    if (this.submitting()) return;
    this.cancelled.emit();
  }
}
