import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MainLayoutComponent } from '../../layouts/main-layout/main-layout.component';
import { GlobalMessageService } from '../../services/global-message.service';
import { LotoStandardApiService } from './loto-standard-api.service';
import { LOTO_STANDARD_STATUS, LotoStandard } from './loto-standard.model';

/**
 * Create OR edit basic fields of a LOTO Standard from the PWA.
 *
 * <p>Routes:
 * <ul>
 *   <li>/loto-standards/new — create; lands in Draft with an empty points list</li>
 *   <li>/loto-standards/:id/edit — edit basic fields (name, description, prose text)</li>
 * </ul>
 *
 * <p>Edit-mode restriction: PWA edits are permitted while the standard is Draft or
 * New – Pending Reapproval. Any other status shows a read-only banner and disables Save
 * (matching the desktop's pending-review capture semantics — a walker in the field
 * shouldn't be editing an Approved standard directly).
 */
@Component({
  selector: 'app-loto-standard-create',
  standalone: true,
  imports: [MainLayoutComponent],
  template: `
    <app-main-layout [header]="editingId() ? 'Edit standard' : 'New LOTO standard'">
      <ng-container main-content>
        <div class="s-container">
          <button class="s-back" (click)="back()">← Back</button>

          @if (loading()) {
            <p class="s-msg">Loading…</p>
          } @else if (loadError()) {
            <p class="s-msg s-error">{{ loadError() }}</p>
          } @else {
            <h1 class="s-title">{{ editingId() ? (existing()?.name || 'Edit standard') : 'New LOTO standard' }}</h1>
            @if (editingId() && !canEdit()) {
              <div class="s-locked">
                🔒 <b>{{ existing()?.developmentStatus?.name || 'Not Draft' }}</b> — PWA edits are only allowed on Draft standards.
                Use the desktop to edit others (an Approved standard's changes go through the pending-review flow there).
              </div>
            }

            <label class="s-field">Name
              <input class="s-input" type="text" [value]="form().name ?? ''"
                     [disabled]="editingId() && !canEdit()"
                     (input)="patchForm({ name: $any($event.target).value })"
                     placeholder="e.g. U1 Modified Fire Side" autofocus>
            </label>
            <label class="s-field">Description
              <textarea class="s-input s-textarea" rows="3" [value]="form().description ?? ''"
                        [disabled]="editingId() && !canEdit()"
                        (input)="patchForm({ description: $any($event.target).value })"
                        placeholder="Brief scope / equipment covered"></textarea>
            </label>

            @if (editingId() && canEdit()) {
              <details class="s-prose">
                <summary>Procedure text (optional)</summary>
                <label class="s-field">Install — prerequisites
                  <textarea class="s-input s-textarea" rows="2" [value]="form().installPrerequisitesText ?? ''"
                            (input)="patchForm({ installPrerequisitesText: $any($event.target).value })"></textarea>
                </label>
                <label class="s-field">Install — hazard control
                  <textarea class="s-input s-textarea" rows="2" [value]="form().installHazardControlText ?? ''"
                            (input)="patchForm({ installHazardControlText: $any($event.target).value })"></textarea>
                </label>
                <label class="s-field">Install — procedure
                  <textarea class="s-input s-textarea" rows="2" [value]="form().installProcedureText ?? ''"
                            (input)="patchForm({ installProcedureText: $any($event.target).value })"></textarea>
                </label>
                <label class="s-field">Removal — prerequisites
                  <textarea class="s-input s-textarea" rows="2" [value]="form().removalPrerequisitesText ?? ''"
                            (input)="patchForm({ removalPrerequisitesText: $any($event.target).value })"></textarea>
                </label>
                <label class="s-field">Removal — hazard control
                  <textarea class="s-input s-textarea" rows="2" [value]="form().removalHazardControlText ?? ''"
                            (input)="patchForm({ removalHazardControlText: $any($event.target).value })"></textarea>
                </label>
                <label class="s-field">Removal — procedure
                  <textarea class="s-input s-textarea" rows="2" [value]="form().removalProcedureText ?? ''"
                            (input)="patchForm({ removalProcedureText: $any($event.target).value })"></textarea>
                </label>
              </details>
            }

            @if (submitError()) { <p class="s-msg s-error">{{ submitError() }}</p> }

            <div class="s-actions s-sticky">
              <button class="s-btn-primary" [disabled]="submitting() || !isFormValid() || (editingId() && !canEdit())"
                      (click)="submit()">
                {{ submitting() ? 'Saving…' : (editingId() ? 'Save changes' : 'Create standard') }}
              </button>
            </div>
          }
        </div>
      </ng-container>
    </app-main-layout>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; }
    .s-container { padding: 1rem; max-width: 720px; margin: 0 auto; width: 100%; box-sizing: border-box; padding-bottom: 5rem; }
    .s-back { background: none; border: none; color: var(--accent-color); font-size: 0.9rem; padding: 0.2rem 0; cursor: pointer; }
    .s-msg { text-align: center; color: var(--secondary-text); padding: 1rem; }
    .s-error { color: var(--danger-text); }
    .s-title { font-size: 1.3rem; font-weight: 700; color: var(--primary-text); margin: 0.5rem 0 0.75rem; }
    .s-locked { padding: 0.75rem 1rem; margin-bottom: 0.75rem; background: var(--warning-bg); color: var(--warning-text); border: 1px solid var(--warning-border); border-radius: 8px; font-size: 0.85rem; }
    .s-field { display: flex; flex-direction: column; gap: 0.25rem; margin-bottom: 0.6rem; font-size: 0.78rem; color: var(--secondary-text); text-transform: uppercase; letter-spacing: 0.02em; }
    .s-input { padding: 0.55rem 0.7rem; border: 1px solid var(--border-color); border-radius: 8px; background: var(--secondary-background); color: var(--primary-text); font: inherit; font-size: 0.95rem; }
    .s-textarea { resize: vertical; min-height: 3.5rem; }
    .s-input:focus { outline: none; border-color: var(--accent-color); }
    .s-input:disabled { opacity: 0.65; cursor: not-allowed; }
    .s-prose { border: 1px solid var(--border-color); border-radius: 10px; padding: 0.5rem 0.75rem; margin: 0.75rem 0; }
    .s-prose summary { color: var(--accent-color); font-weight: 600; cursor: pointer; padding: 0.25rem 0; min-height: 44px; display: flex; align-items: center; }
    .s-actions { margin-top: 1rem; }
    .s-actions.s-sticky { position: sticky; bottom: 0; padding: 0.75rem 0 calc(0.75rem + env(safe-area-inset-bottom, 0px)); background: var(--primary-background); border-top: 1px solid var(--border-color); }
    .s-btn-primary { width: 100%; min-height: 52px; background: var(--success-solid); color: var(--on-solid); border: none; border-radius: 10px; padding: 0.9rem; font: inherit; font-size: 1rem; font-weight: 700; cursor: pointer; }
    .s-btn-primary:disabled { opacity: 0.5; cursor: default; }
  `],
})
export class LotoStandardCreateComponent implements OnInit {
  private api = inject(LotoStandardApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private messageService = inject(GlobalMessageService);

  editingId = signal<number | null>(null);
  existing = signal<LotoStandard | null>(null);
  loading = signal(false);
  loadError = signal<string | null>(null);

  form = signal<Partial<LotoStandard>>({});
  submitting = signal(false);
  submitError = signal<string | null>(null);

  isFormValid = computed(() => !!(this.form().name ?? '').trim());
  canEdit = computed<boolean>(() => {
    const name = this.existing()?.developmentStatus?.name;
    return !name || name === LOTO_STANDARD_STATUS.DRAFT || name === LOTO_STANDARD_STATUS.NEW_PENDING_REAPPROVAL;
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const editId = idParam ? Number(idParam) : null;
    if (editId) {
      this.editingId.set(editId);
      this.loading.set(true);
      this.api.getById(editId).subscribe({
        next: (s) => {
          this.loading.set(false);
          if (!s) { this.loadError.set('Standard not found.'); return; }
          this.existing.set(s);
          this.form.set({
            id: s.id,
            name: s.name,
            description: s.description,
            installPrerequisitesText: s.installPrerequisitesText,
            installHazardControlText: s.installHazardControlText,
            installProcedureText: s.installProcedureText,
            removalPrerequisitesText: s.removalPrerequisitesText,
            removalHazardControlText: s.removalHazardControlText,
            removalProcedureText: s.removalProcedureText,
          });
        },
        error: (err) => {
          this.loading.set(false);
          this.loadError.set(err?.error?.message ?? err?.message ?? 'Failed to load standard');
        },
      });
    }
  }

  patchForm(patch: Partial<LotoStandard>): void { this.form.set({ ...this.form(), ...patch }); }

  submit(): void {
    if (!this.isFormValid() || this.submitting()) return;
    if (this.editingId() && !this.canEdit()) return;
    this.submitting.set(true);
    this.submitError.set(null);
    const editId = this.editingId();
    const request$ = editId
      ? this.api.updateStandard(editId, this.form())
      : this.api.createStandard({ name: this.form().name!, description: this.form().description });
    request$.subscribe({
      next: (saved) => {
        this.submitting.set(false);
        if (!saved) { this.submitError.set('Save returned no data.'); return; }
        this.messageService.showSuccess(editId ? 'Standard saved.' : 'LOTO Standard created.');
        this.router.navigate(['/loto-standards', saved.id]);
      },
      error: (err) => {
        this.submitting.set(false);
        this.submitError.set(err?.error?.message ?? err?.message ?? 'Save failed');
      },
    });
  }

  back(): void { history.length > 1 ? history.back() : this.router.navigate(['/loto-standards']); }
}
