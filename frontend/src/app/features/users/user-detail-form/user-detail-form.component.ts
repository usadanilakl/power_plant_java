import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RfReactiveFormComponent } from '../../../shared/reactive-form/refactored/reactive-form/rf-reactive-form.component';
import { RfUserStateService } from '../services/rf-user-state.service';
import { UserDto } from '../../../models/user.model';

@Component({
  selector: 'app-user-detail-form',
  standalone: true,
  imports: [CommonModule, RfReactiveFormComponent],
  template: `
    @if (!isNew()) {
      @if (entity().pinResetRequestedAt) {
        <div class="pin-section reset-requested">
          <div class="pin-status">
            <strong>⚠ Reset requested</strong>
            <span class="hint-text">User asked for a new PIN on {{ entity().pinResetRequestedAt }}. Generating a new PIN clears this flag.</span>
          </div>
          <button type="button" class="generate-btn" (click)="onGeneratePin()" [disabled]="generatingPin()">
            {{ generatingPin() ? 'Generating…' : '🔄 Generate new PIN' }}
          </button>
        </div>
      }
      @if (entity().signingInitials) {
        <div class="pin-section">
          <div class="pin-status">
            <strong>Sign-in code:</strong>
            <span class="initials">{{ entity().signingInitials }}</span>
            @if (entity().pinSetAt) {
              <span class="badge ok">PIN set</span>
              @if (isPinLocked()) {
                <span class="badge warn">locked until {{ entity().pinLockedUntil }}</span>
              }
            } @else {
              <span class="badge none">no PIN yet</span>
            }
          </div>
          <button type="button" class="generate-btn" (click)="onGeneratePin()" [disabled]="generatingPin()">
            {{ generatingPin() ? 'Generating…' : entity().pinSetAt ? '🔄 Generate new PIN' : 'Generate PIN' }}
          </button>
        </div>
      } @else {
        <div class="pin-section hint-only">
          <span class="hint-text">Set signing initials below and click <strong>Update</strong> first — the Generate PIN button will appear here after they're saved.</span>
        </div>
      }
    }

    <app-rf-reactive-form
      [fields]="fields()"
      [entity]="entity()"
      [submitButtonText]="entity().id ? 'Update' : 'Create'"
      [deleteButtonText]="entity().id ? 'Delete' : ''"
      (formSubmit)="onSubmit($event)"
      (formDelete)="onDelete()">
    </app-rf-reactive-form>

    @if (generatedPin()) {
      <div class="pin-dialog-backdrop" (click)="dismissPin()">
        <div class="pin-dialog" (click)="$event.stopPropagation()">
          <h3>PIN generated for {{ entity().name }}</h3>
          <p class="help">Read this aloud, write it down, or copy it now. It can't be shown again.</p>
          <div class="pin-display">
            <span class="big-initials">{{ entity().signingInitials }}</span><span class="big-digits">{{ generatedPin() }}</span>
          </div>
          <p class="help-secondary">User will be prompted to change it on their first sign-in action.</p>
          <div class="pin-actions">
            <button class="copy-btn" (click)="copyPin()">Copy {{ entity().signingInitials }}{{ generatedPin() }}</button>
            <button class="done-btn" (click)="dismissPin()">Done</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: block; padding: 16px; }
    .pin-section { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 14px; background: #1a2030; border: 1px solid #2a3a50; border-radius: 6px; margin-bottom: 16px; flex-wrap: wrap; }
    .pin-section.hint-only { background: #1a1a20; border: 1px dashed #444; }
    .pin-section.reset-requested { background: #2a2418; border: 1px solid #f9a825; }
    .pin-section.reset-requested strong { color: #ffd54f; }
    .hint-text { color: #aaa; font-size: 12px; font-style: italic; line-height: 1.4; }
    .pin-status { display: inline-flex; align-items: center; gap: 8px; color: #ddd; font-size: 13px; }
    .pin-status strong { color: #aaa; font-weight: 500; }
    .initials { font-family: 'Courier New', monospace; font-weight: 700; color: #82b1ff; background: #0a1a30; padding: 4px 10px; border-radius: 4px; letter-spacing: 2px; font-size: 14px; }
    .badge { padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
    .badge.ok { background: rgba(45, 138, 78, 0.25); color: #81c784; }
    .badge.warn { background: rgba(230, 126, 34, 0.25); color: #ffb74d; }
    .badge.none { background: rgba(192, 57, 43, 0.18); color: #ef9a9a; }
    .generate-btn { background: #533483; border: none; color: white; padding: 8px 14px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600; }
    .generate-btn:hover { opacity: 0.9; }
    .generate-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    .pin-dialog-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 2000; }
    .pin-dialog { background: #16213e; border: 2px solid #533483; border-radius: 10px; padding: 24px; min-width: 400px; box-shadow: 0 12px 36px rgba(0,0,0,0.6); }
    .pin-dialog h3 { color: #82b1ff; margin: 0 0 8px; }
    .help { color: #aaa; font-size: 13px; margin: 0 0 16px; }
    .help-secondary { color: #888; font-size: 12px; font-style: italic; margin: 12px 0; }
    .pin-display { text-align: center; padding: 18px; background: #0a1a30; border-radius: 6px; margin: 8px 0; }
    .big-initials { font-family: 'Courier New', monospace; font-size: 36px; font-weight: 700; color: #82b1ff; letter-spacing: 4px; }
    .big-digits { font-family: 'Courier New', monospace; font-size: 36px; font-weight: 700; color: #ffd54f; letter-spacing: 6px; margin-left: 4px; }
    .pin-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; }
    .copy-btn { background: #2d8a4e; border: none; color: white; padding: 8px 14px; border-radius: 4px; cursor: pointer; font-size: 13px; }
    .done-btn { background: #555; border: none; color: white; padding: 8px 14px; border-radius: 4px; cursor: pointer; font-size: 13px; }
  `]
})
export class UserDetailFormComponent {
  protected stateService = inject(RfUserStateService);

  entity = computed(() => this.stateService.selectedItem() ?? new UserDto());

  isNew = computed(() => {
    const entity = this.entity();
    return !entity.id || entity.id === 0;
  });

  fields = computed(() => {
    const entity = this.entity();
    return UserDto.toFormFields(entity, { isNew: this.isNew() });
  });

  generatingPin = signal(false);
  generatedPin = signal<string | null>(null);

  isPinLocked(): boolean {
    const e = this.entity();
    if (!e.pinLockedUntil) return false;
    return new Date(e.pinLockedUntil) > new Date();
  }

  onGeneratePin(): void {
    const e = this.entity();
    if (!e.id) return;
    const verb = e.pinSetAt ? 'replace the existing' : 'generate a';
    if (!confirm(`Generate a new PIN for ${e.name}? This will ${verb} PIN — any existing PIN will be invalidated.`)) return;
    this.generatingPin.set(true);
    this.stateService.generatePinForUser(e.id)
      .then(pin => {
        this.generatingPin.set(false);
        this.generatedPin.set(pin);
      })
      .catch(err => {
        this.generatingPin.set(false);
        alert(typeof err === 'string' ? err : 'Failed to generate PIN');
      });
  }

  copyPin(): void {
    const e = this.entity();
    const code = `${e.signingInitials ?? ''}${this.generatedPin() ?? ''}`;
    if (navigator.clipboard && code) navigator.clipboard.writeText(code);
  }

  dismissPin(): void {
    this.generatedPin.set(null);
  }

  onSubmit(formValues: any): void {
    const entity = this.entity();
    const payload: any = {
      ...formValues,
    };

    // Build name from first + last
    if (formValues.firstName || formValues.lastName) {
      payload.name = `${formValues.firstName || ''} ${formValues.lastName || ''}`.trim();
    }

    // Strip blank password on update (backend ignores null/blank)
    if (!this.isNew() && (!payload.password || !payload.password.trim())) {
      delete payload.password;
    }

    if (entity.id) {
      payload.id = entity.id;
    }

    this.stateService.submitForm(payload);
  }

  onDelete(): void {
    const entity = this.entity();
    if (entity?.id) {
      this.stateService.deleteUser(entity.id);
    }
  }
}
