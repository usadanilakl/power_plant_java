import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubmissionOrchestratorService } from '../../services/submission-orchestrator.service';
import { UserSetupService } from '../../services/user-setup.service';
import { ReactiveFormComponent } from '../../shared/forms/reactive-form/reactive-form.component';
import { FormField } from '../../models/inputs/form-field.model';
import { sdsChemicalFormFields } from '../../models/sds/sds-chemical.model';

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

@Component({
  selector: 'app-sds',
  standalone: true,
  imports: [CommonModule, ReactiveFormComponent],
  template: `
    @if (submitState() === 'submitting') {
      <div class="overlay">
        <div class="overlay-card">
          <div class="spinner"></div>
          <p class="overlay-text">Submitting SDS chemical...</p>
        </div>
      </div>
    }
    @if (submitState() === 'success') {
      <div class="overlay">
        <div class="overlay-card success">
          <span class="overlay-icon">&#10003;</span>
          <p class="overlay-text">{{ submitMessage() }}</p>
          <button class="overlay-btn" (click)="dismissResult()">OK</button>
        </div>
      </div>
    }
    @if (submitState() === 'error') {
      <div class="overlay">
        <div class="overlay-card error">
          <span class="overlay-icon">&#10007;</span>
          <p class="overlay-text">{{ submitMessage() }}</p>
          <button class="overlay-btn" (click)="dismissResult()">OK</button>
        </div>
      </div>
    }

    <div class="form-wrapper">
      <div class="sticky-header">
        <span class="header-title">New SDS Chemical</span>
      </div>
      <p class="intro">Record a new Safety Data Sheet chemical. Enter all names/aliases and storage
        locations, attach the SDS PDF, and submit. It will be filed and assigned a book index.</p>
      @if (fields().length > 0) {
        <app-reactive-form
          [fields]="fields()"
          [entity]="draftEntity()"
          [layout]="'column'"
          [submitButtonText]="'Submit'"
          (formValueChange)="onDraftChange($event)"
          (formSubmit)="onSubmit($event)">
        </app-reactive-form>
      }
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; overflow-y: auto; overflow-x: hidden; }
    .form-wrapper { max-width: 600px; margin: 0 auto; padding: 0 16px 16px; box-sizing: border-box; width: 100%; }
    .form-wrapper ::ng-deep form { box-sizing: border-box; max-width: 100%; }
    .form-wrapper ::ng-deep input, .form-wrapper ::ng-deep select,
    .form-wrapper ::ng-deep textarea { box-sizing: border-box; max-width: 100%; width: 100%; }
    .form-wrapper ::ng-deep fieldset { border: none; margin: 0; padding: 0; min-width: 0; }
    .sticky-header { display: flex; align-items: center; gap: 12px; padding: 12px 0; position: sticky; top: 0;
      background: var(--primary-background); z-index: 10; flex-wrap: wrap; }
    .header-title { font-size: 16px; font-weight: 600; }
    .intro { font-size: 13px; color: var(--secondary-text); margin: 0 0 16px; line-height: 1.4; }
    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex;
      align-items: center; justify-content: center; z-index: 9999; }
    .overlay-card { background: var(--primary-background); border-radius: 16px; padding: 32px;
      text-align: center; min-width: 280px; max-width: 90vw; box-shadow: 0 8px 32px rgba(0,0,0,.3); }
    .overlay-card.success .overlay-icon { color: #4caf50; }
    .overlay-card.error .overlay-icon { color: #f44336; }
    .overlay-icon { font-size: 48px; display: block; margin-bottom: 12px; }
    .overlay-text { font-size: 16px; margin: 0 0 16px; }
    .overlay-btn { padding: 10px 32px; background: var(--accent-color); color: white; border: none;
      border-radius: 8px; font-size: 15px; cursor: pointer; font-family: inherit; }
    .spinner { width: 40px; height: 40px; border: 4px solid var(--border-color);
      border-top-color: var(--accent-color); border-radius: 50%; animation: spin .8s linear infinite; margin: 0 auto 16px; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class SdsComponent implements OnInit {
  private orchestrator = inject(SubmissionOrchestratorService);
  private userSetup = inject(UserSetupService);

  fields = signal<FormField[]>([]);
  draftEntity = signal<any>({});
  submitState = signal<SubmitState>('idle');
  submitMessage = signal('');

  private static readonly DRAFT_KEY = 'pwa_sds_draft';

  ngOnInit(): void {
    this.fields.set(sdsChemicalFormFields());
    this.loadDraft();
  }

  onDraftChange(formData: any): void {
    try {
      const { attachments, ...draftData } = formData;
      localStorage.setItem(SdsComponent.DRAFT_KEY, JSON.stringify(draftData));
    } catch { /* ignore */ }
  }

  private loadDraft(): void {
    try {
      const raw = localStorage.getItem(SdsComponent.DRAFT_KEY);
      this.draftEntity.set(raw ? JSON.parse(raw) : {});
    } catch {
      this.draftEntity.set({});
    }
  }

  private clearDraft(): void {
    localStorage.removeItem(SdsComponent.DRAFT_KEY);
    this.draftEntity.set({});
  }

  onSubmit(formData: any): void {
    this.submitState.set('submitting');

    const userData = this.userSetup.getUserData();
    const payload: any = {
      localUuid: crypto.randomUUID(),
      names: formData.names || '',
      locations: formData.locations || '',
      statusName: 'Pending',
      notes: formData.notes || '',
      processedByName: userData?.name || '',
      processedByEmail: userData?.email || '',
      submitterName: userData?.name || '',
      submitterEmail: userData?.email || '',
      submitterPhone: userData?.phone || '',
      attachments: formData.attachments || []
    };

    this.orchestrator.submitSdsChemical(payload).subscribe({
      next: (result) => {
        if (result.success) {
          this.clearDraft();
          this.submitState.set('success');
          this.submitMessage.set(result.message || `Submitted via ${result.method}`);
        } else {
          this.submitState.set('error');
          this.submitMessage.set(result.message || 'Submission failed. Item saved locally.');
        }
      },
      error: () => {
        this.submitState.set('error');
        this.submitMessage.set('Submission failed. Please try again.');
      }
    });
  }

  dismissResult(): void {
    const wasSuccess = this.submitState() === 'success';
    this.submitState.set('idle');
    this.submitMessage.set('');
    if (wasSuccess) {
      this.fields.set(sdsChemicalFormFields());
      this.draftEntity.set({});
    }
  }
}
