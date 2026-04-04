import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ServerApiService } from '../../services/server-api.service';
import { SubmissionOrchestratorService } from '../../services/submission-orchestrator.service';
import { ReactiveFormComponent } from '../../shared/forms/reactive-form/reactive-form.component';
import { FormField } from '../../models/inputs/form-field.model';
import { fieldListFormFields } from '../../models/field-list/field-list-item.model';
import { Option } from '../../models/inputs/option.model';

type ViewMode = 'select' | 'new' | 'edit';
type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

interface SubmittedItem {
  localUuid: string;
  title: string;
  listTypeName: string;
  dateObserved: string;
  equipmentTag: string;
  statusName: string;
  submitted: boolean; // true if server/PA accepted it, false if only saved locally
}

@Component({
  selector: 'app-field-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormComponent],
  template: `
    <!-- Submission overlay -->
    @if (submitState() === 'submitting') {
      <div class="overlay">
        <div class="overlay-card">
          <div class="spinner"></div>
          <p class="overlay-text">Submitting field list item...</p>
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

    <!-- Mode selector -->
    @if (mode() === 'select') {
      <div class="action-selector">
        <h2 class="action-title">Field Lists</h2>
        <p class="action-subtitle">Track insulation, leaks, winterization, and more</p>
        <div class="action-cards">
          <button class="action-card" (click)="selectNew()">
            <span class="action-card-icon">📝</span>
            <span class="action-card-label">Submit New Item</span>
            <span class="action-card-desc">Start a blank form</span>
          </button>
          <button class="action-card" (click)="openHistory()">
            <span class="action-card-icon">📋</span>
            <span class="action-card-label">View / Edit Previous</span>
            <span class="action-card-desc">Update a previously submitted item</span>
          </button>
        </div>
      </div>
    }

    <!-- New submission form -->
    @if (mode() === 'new') {
      <div class="form-wrapper">
        <div class="sticky-header">
          <button class="back-button" (click)="backToSelect()">← Back</button>
          <span class="header-title">New Field List Item</span>
        </div>
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
    }

    <!-- Edit form (previously submitted item) -->
    @if (mode() === 'edit') {
      <div class="form-wrapper">
        <div class="sticky-header">
          <button class="back-button" (click)="openHistory()">← Back to List</button>
          <span class="header-title">Edit: {{ editingItem()?.title }}</span>
        </div>
        @if (editFields().length > 0) {
          <app-reactive-form
            [fields]="editFields()"
            [entity]="editEntity()"
            [layout]="'column'"
            [submitButtonText]="editingSubmitted() ? 'Update' : 'Submit'"
            (formSubmit)="onUpdate($event)">
          </app-reactive-form>
        }
      </div>
    }

    <!-- History list (select item to edit) -->
    @if (mode() === 'history') {
      <div class="form-wrapper">
        <div class="sticky-header">
          <button class="back-button" (click)="backToSelect()">← Back</button>
          <span class="header-title">Previous Submissions</span>
        </div>
        <div class="history-list">
          @if (submittedItems().length === 0) {
            <div class="empty-history">No previous submissions found on this device.</div>
          }
          @for (item of submittedItems(); track item.localUuid) {
            <button class="history-item" (click)="editItem(item)">
              <div class="history-item-header">
                <span class="history-item-type">{{ item.listTypeName }}</span>
                <span class="history-item-status" [class.not-submitted]="!item.submitted">
                  {{ item.submitted ? item.statusName : 'Local only' }}
                </span>
              </div>
              <div class="history-item-title">{{ item.title }}</div>
              <div class="history-item-meta">
                @if (item.dateObserved) { <span>{{ item.dateObserved }}</span> }
                @if (item.equipmentTag) { <span>{{ item.equipmentTag }}</span> }
              </div>
            </button>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: block; height: 100%; overflow-y: auto; overflow-x: hidden; }

    .action-selector { display: flex; flex-direction: column; align-items: center; padding: 2rem 1rem; }
    .action-title { font-size: 1.6rem; font-weight: 700; color: var(--primary-text); margin: 0 0 0.25rem; }
    .action-subtitle { font-size: 1rem; color: var(--secondary-text, #888); margin: 0 0 2rem; }
    .action-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem; width: 100%; max-width: 600px; }
    .action-card { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; padding: 1.5rem 1rem;
      background: var(--card-background, var(--secondary-background)); border: 1px solid var(--border-color);
      border-radius: 12px; cursor: pointer; box-shadow: var(--card-shadow); min-height: 120px; font-family: inherit; color: var(--primary-text); }
    .action-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); border-color: var(--accent-color); }
    .action-card-icon { font-size: 2.5rem; }
    .action-card-label { font-size: 1.1rem; font-weight: 600; text-align: center; }
    .action-card-desc { font-size: 0.85rem; color: var(--secondary-text, #888); text-align: center; }

    .form-wrapper { max-width: 600px; margin: 0 auto; padding: 0 16px 16px; box-sizing: border-box; width: 100%; }
    .form-wrapper ::ng-deep form { box-sizing: border-box; max-width: 100%; }
    .form-wrapper ::ng-deep input,
    .form-wrapper ::ng-deep select,
    .form-wrapper ::ng-deep textarea { box-sizing: border-box; max-width: 100%; width: 100%; }
    .form-wrapper ::ng-deep fieldset { border: none; margin: 0; padding: 0; min-width: 0; }
    .form-wrapper ::ng-deep .form-field-layout-column { min-width: 0; }
    .sticky-header { display: flex; align-items: center; gap: 12px; padding: 12px 0; position: sticky; top: 0;
      background: var(--primary-background); z-index: 10; }
    .back-button { background: none; border: none; color: var(--accent-color); cursor: pointer;
      font-size: 14px; font-family: inherit; padding: 4px 0; }
    .header-title { font-size: 16px; font-weight: 600; color: var(--primary-text); }

    .history-list { display: flex; flex-direction: column; gap: 8px; }
    .empty-history { padding: 32px; text-align: center; color: var(--secondary-text, #888); }
    .history-item { display: flex; flex-direction: column; gap: 4px; padding: 12px 16px;
      border: 1px solid var(--border-color, #ccc); border-radius: 8px; background: var(--card-background, #fff);
      cursor: pointer; text-align: left; font-family: inherit; color: var(--primary-text); }
    .history-item:hover { border-color: var(--accent-color); }
    .history-item-header { display: flex; justify-content: space-between; align-items: center; }
    .history-item-type { font-size: 12px; font-weight: 600; text-transform: uppercase; color: var(--accent-color); }
    .history-item-status { font-size: 11px; padding: 2px 8px; border-radius: 10px; background: var(--secondary-background); color: var(--secondary-text); }
    .history-item-status.not-submitted { background: var(--error-bg, #f8d7da); color: var(--error-text, #721c24); }
    .history-item-title { font-size: 15px; font-weight: 500; }
    .history-item-meta { display: flex; gap: 12px; font-size: 12px; color: var(--secondary-text, #888); }

    /* Submission overlay */
    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex;
      align-items: center; justify-content: center; z-index: 9999; }
    .overlay-card { background: var(--primary-background, #fff); border-radius: 16px; padding: 32px;
      text-align: center; min-width: 280px; max-width: 90vw; box-shadow: 0 8px 32px rgba(0,0,0,0.3); }
    .overlay-card.success .overlay-icon { color: #4caf50; }
    .overlay-card.error .overlay-icon { color: #f44336; }
    .overlay-icon { font-size: 48px; display: block; margin-bottom: 12px; }
    .overlay-text { font-size: 16px; color: var(--primary-text); margin: 0 0 16px; }
    .overlay-btn { padding: 10px 32px; background: var(--accent-color); color: white; border: none;
      border-radius: 8px; font-size: 15px; cursor: pointer; font-family: inherit; }
    .spinner { width: 40px; height: 40px; border: 4px solid var(--border-color, #ccc);
      border-top-color: var(--accent-color); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px; }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 768px) {
      .action-cards { grid-template-columns: 1fr; max-width: 400px; }
    }
  `]
})
export class FieldListComponent implements OnInit {
  private serverApi = inject(ServerApiService);
  private orchestrator = inject(SubmissionOrchestratorService);
  private http = inject(HttpClient);

  mode = signal<ViewMode | 'history'>('select');
  fields = signal<FormField[]>([]);
  editFields = signal<FormField[]>([]);
  editingItem = signal<SubmittedItem | null>(null);
  editEntity = signal<any>({});
  editingSubmitted = signal(false);
  draftEntity = signal<any>({});
  submittedItems = signal<SubmittedItem[]>([]);
  submitState = signal<SubmitState>('idle');
  submitMessage = signal('');

  private listTypeOptions: Option[] = [];
  private defaultListType = '';
  private editingLocalUuid = '';

  private static readonly DRAFT_KEY = 'pwa_field_list_draft';

  ngOnInit(): void {
    this.loadListTypes();
    this.loadSubmittedItems();
    this.loadDraft();
  }

  private loadListTypes(): void {
    // Show instantly from cache or hardcoded defaults — don't wait for network
    const cached = localStorage.getItem('pwa_field_list_types');
    if (cached) {
      try { this.setListTypeOptions(JSON.parse(cached)); } catch { /* ignore parse error */ }
    }
    if (this.listTypeOptions.length === 0) {
      this.setListTypeOptions([
        { id: 0, name: 'Insulation Removal' },
        { id: 0, name: 'Leaks' },
        { id: 0, name: 'Winterization' }
      ]);
    }

    // Then try to get fresh data from server or static JSON in background
    this.serverApi.getFieldListTypes().subscribe({
      next: types => {
        this.setListTypeOptions(types);
        localStorage.setItem('pwa_field_list_types', JSON.stringify(types));
      },
      error: () => {
        this.http.get<{ id: number; name: string }[]>('data/field-list-types.json').subscribe({
          next: types => {
            this.setListTypeOptions(types);
            localStorage.setItem('pwa_field_list_types', JSON.stringify(types));
          },
          error: () => { /* already showing cached/default values */ }
        });
      }
    });
  }

  private setListTypeOptions(types: { id: number; name: string }[]): void {
    this.listTypeOptions = types.map(t => ({ value: t.name, label: t.name }));
    this.defaultListType = types.length > 0 ? types[0].name : '';
    this.fields.set(fieldListFormFields(this.listTypeOptions, this.defaultListType));
  }

  // ====================== Navigation ======================

  selectNew(): void {
    this.mode.set('new');
    this.fields.set(fieldListFormFields(this.listTypeOptions, this.defaultListType));
    this.loadDraft();
  }

  openHistory(): void {
    this.loadSubmittedItems();
    this.mode.set('history');
  }

  backToSelect(): void {
    this.mode.set('select');
  }

  // ====================== Draft ======================

  onDraftChange(formData: any): void {
    try {
      // Don't save file objects — they can't be serialized
      const { attachments, ...draftData } = formData;
      localStorage.setItem(FieldListComponent.DRAFT_KEY, JSON.stringify(draftData));
    } catch { /* ignore */ }
  }

  private loadDraft(): void {
    try {
      const raw = localStorage.getItem(FieldListComponent.DRAFT_KEY);
      if (raw) {
        this.draftEntity.set(JSON.parse(raw));
      } else {
        this.draftEntity.set({});
      }
    } catch {
      this.draftEntity.set({});
    }
  }

  private clearDraft(): void {
    localStorage.removeItem(FieldListComponent.DRAFT_KEY);
    this.draftEntity.set({});
  }

  // ====================== Submit new ======================

  onSubmit(formData: any): void {
    this.submitState.set('submitting');

    const payload = this.buildPayload(formData);
    payload.localUuid = crypto.randomUUID();

    this.orchestrator.submitFieldListItem(payload).subscribe({
      next: (result) => {
        payload.submitted = result.success;
        this.saveToLocalHistory(payload);
        if (result.success) {
          this.clearDraft();
          this.submitState.set('success');
          this.submitMessage.set(result.message || `Submitted via ${result.method}`);
        } else {
          this.submitState.set('error');
          this.submitMessage.set(result.message || 'Submission failed. Item saved locally.');
        }
      },
      error: (err) => {
        payload.submitted = false;
        this.saveToLocalHistory(payload);
        this.submitState.set('error');
        this.submitMessage.set('Submission failed. Item saved locally for retry.');
      }
    });
  }

  // ====================== Edit existing ======================

  editItem(item: SubmittedItem): void {
    this.editingItem.set(item);
    this.editingLocalUuid = item.localUuid;
    this.editingSubmitted.set(item.submitted);

    // Load full item data from localStorage and pass as entity
    const stored = this.getStoredItems();
    const full = stored.find((s: any) => s.localUuid === item.localUuid) || {};
    this.editEntity.set(full);
    this.editFields.set(fieldListFormFields(this.listTypeOptions, item.listTypeName));
    this.mode.set('edit');
  }

  onUpdate(formData: any): void {
    this.submitState.set('submitting');

    const payload = this.buildPayload(formData);
    payload.localUuid = this.editingLocalUuid;

    // If never submitted to server, use create (not update)
    const action$ = this.editingSubmitted()
      ? this.orchestrator.updateFieldListItem(payload)
      : this.orchestrator.submitFieldListItem(payload);

    action$.subscribe({
      next: (result) => {
        payload.submitted = result.success;
        this.updateLocalHistory(payload);
        if (result.success) {
          this.submitState.set('success');
          this.submitMessage.set(this.editingSubmitted()
            ? (result.message || 'Updated successfully')
            : (result.message || 'Submitted successfully'));
        } else {
          this.submitState.set('error');
          this.submitMessage.set(result.message || 'Failed. Changes saved locally.');
        }
      },
      error: (err) => {
        payload.submitted = false;
        this.updateLocalHistory(payload);
        this.submitState.set('error');
        this.submitMessage.set('Failed. Changes saved locally.');
      }
    });
  }

  // ====================== Shared ======================

  dismissResult(): void {
    const wasSuccess = this.submitState() === 'success';
    this.submitState.set('idle');
    this.submitMessage.set('');
    if (wasSuccess) {
      this.backToSelect();
    }
  }

  private buildPayload(formData: any): any {
    let equipmentTag = '';
    if (formData.equipmentTag && typeof formData.equipmentTag === 'object') {
      equipmentTag = formData.equipmentTag.tagNumber || '';
    } else if (typeof formData.equipmentTag === 'string') {
      equipmentTag = formData.equipmentTag;
    }

    let locationName = '';
    if (formData.workAreaMap && typeof formData.workAreaMap === 'object') {
      locationName = formData.workAreaMap.name || '';
    }

    return {
      localUuid: '',
      listTypeName: formData.listTypeName || '',
      statusName: 'Open',
      title: formData.title || '',
      notes: formData.notes || '',
      dateObserved: formData.dateObserved || '',
      timeObserved: formData.timeObserved || '',
      locationName,
      specificLocation: formData.locationDetail || '',
      equipmentTag,
      submitterName: '',
      submitterEmail: '',
      submitterPhone: '',
      attachments: formData.attachments || []
    };
  }

  // ====================== Local history (localStorage) ======================

  private saveToLocalHistory(payload: any): void {
    try {
      // Strip non-serializable data (File objects, large base64) before storing
      const { attachments, ...storable } = payload;
      const items = this.getStoredItems();
      items.unshift(storable);
      localStorage.setItem('pwa_field_list_history', JSON.stringify(items.slice(0, 50)));
    } catch (e) {
      console.warn('[FieldList] Failed to save to local history:', e);
    }
  }

  private updateLocalHistory(payload: any): void {
    try {
      const { attachments, ...storable } = payload;
      const items = this.getStoredItems();
      const idx = items.findIndex((i: any) => i.localUuid === storable.localUuid);
      if (idx >= 0) {
        items[idx] = { ...items[idx], ...storable };
      }
      localStorage.setItem('pwa_field_list_history', JSON.stringify(items));
    } catch (e) {
      console.warn('[FieldList] Failed to update local history:', e);
    }
  }

  private loadSubmittedItems(): void {
    const items = this.getStoredItems();
    this.submittedItems.set(items.map((item: any) => ({
      localUuid: item.localUuid || '',
      title: item.title || '',
      listTypeName: item.listTypeName || '',
      dateObserved: item.dateObserved || '',
      equipmentTag: item.equipmentTag || '',
      statusName: item.statusName || 'Open',
      submitted: item.submitted === true,
    })));
  }

  private getStoredItems(): any[] {
    try {
      return JSON.parse(localStorage.getItem('pwa_field_list_history') || '[]');
    } catch {
      return [];
    }
  }
}
