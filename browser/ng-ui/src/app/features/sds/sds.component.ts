import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { SubmissionOrchestratorService } from '../../services/submission-orchestrator.service';
import { ServerApiService } from '../../services/server-api.service';
import { UserSetupService } from '../../services/user-setup.service';
import { ReactiveFormComponent } from '../../shared/forms/reactive-form/reactive-form.component';
import { FormField } from '../../models/inputs/form-field.model';
import { sdsChemicalFormFields } from '../../models/sds/sds-chemical.model';

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

interface ExistingRow {
  primaryName: string;
  aliases: string[];
  locations: string;
  bookNumber: number | null;
  sectionNumber: number | null;
  statusName: string;
  searchBlob: string;
}

@Component({
  selector: 'app-sds',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormComponent],
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

      <details class="check-panel" [open]="existingOpen()" (toggle)="onExistingToggle($event)">
        <summary>
          <span class="check-title">Check existing chemicals</span>
          <span class="check-count">({{ existingCount() }})</span>
          @if (existingSource() === 'snapshot') {
            <span class="source-badge snapshot" title="Server unreachable — showing the latest snapshot published to GitHub Pages.">offline snapshot</span>
          } @else if (existingSource() === 'cache') {
            <span class="source-badge cache" title="Server and snapshot both unreachable — showing the last data this device saw.">cached</span>
          }
        </summary>
        <div class="check-body">
          <input
            class="check-search"
            type="search"
            placeholder="Search by name or location..."
            [ngModel]="query()"
            (ngModelChange)="query.set($event)" />

          @if (existingLoading()) {
            <div class="muted center">Loading inventory...</div>
          } @else if (existingError()) {
            <div class="muted center">Couldn't load existing chemicals — server may be offline.</div>
          } @else if (filtered().length === 0) {
            <div class="muted center">
              @if (query().trim().length === 0) { No chemicals on file yet. }
              @else { No matches for "{{ query() }}". This looks new. }
            </div>
          } @else {
            <table class="check-table">
              <thead>
                <tr><th>Chemical</th><th>Book / Section</th><th>Location</th><th>Status</th></tr>
              </thead>
              <tbody>
                @for (row of filtered(); track row.primaryName + row.bookNumber) {
                  <tr>
                    <td>
                      <div class="cell-name">{{ row.primaryName }}</div>
                      @if (row.aliases.length) {
                        <div class="cell-aliases">{{ row.aliases.join(' / ') }}</div>
                      }
                    </td>
                    <td class="cell-address">
                      @if (row.bookNumber != null && row.sectionNumber != null) {
                        {{ row.bookNumber }} / {{ row.sectionNumber }}
                      } @else { — }
                    </td>
                    <td class="cell-locs">{{ row.locations || '—' }}</td>
                    <td><span class="status-pill status-{{ row.statusName.toLowerCase() }}">{{ row.statusName }}</span></td>
                  </tr>
                }
              </tbody>
            </table>
            @if (filtered().length < existingCount()) {
              <div class="muted center small">Showing {{ filtered().length }} of {{ existingCount() }}.</div>
            }
          }
        </div>
      </details>

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

    .check-panel { border: 1px solid var(--border-color); border-radius: 10px; margin: 8px 0 16px; background: var(--secondary-background, transparent); }
    .check-panel > summary { padding: 10px 14px; cursor: pointer; font-size: 14px; font-weight: 600;
      list-style: none; display: flex; align-items: center; gap: 8px; user-select: none; }
    .check-panel > summary::-webkit-details-marker { display: none; }
    .check-panel > summary::before { content: '▸'; transition: transform .15s; color: var(--secondary-text); }
    .check-panel[open] > summary::before { transform: rotate(90deg); }
    .check-title { flex: 0 0 auto; }
    .check-count { color: var(--secondary-text); font-weight: 400; font-size: 13px; }
    .source-badge { font-size: 11px; padding: 2px 8px; border-radius: 10px; font-weight: 500; }
    .source-badge.snapshot { background: rgba(255,167,38,.22); color: #e08f00; }
    .source-badge.cache    { background: rgba(127,127,127,.22); color: var(--secondary-text); }
    .check-body { padding: 0 14px 14px; }
    .check-search { width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 8px;
      background: var(--primary-background); color: var(--primary-text); font-size: 14px; box-sizing: border-box; margin-bottom: 10px; }
    .check-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .check-table th, .check-table td { padding: 8px 10px; text-align: left; border-bottom: 1px solid var(--border-color); vertical-align: top; }
    .check-table th { font-weight: 600; color: var(--secondary-text); background: var(--secondary-background, transparent); position: sticky; top: 0; }
    .check-table tr:last-child td { border-bottom: none; }
    .cell-name { font-weight: 600; }
    .cell-aliases { color: var(--secondary-text); font-size: 12px; margin-top: 2px; }
    .cell-address { white-space: nowrap; font-variant-numeric: tabular-nums; }
    .cell-locs { white-space: pre-line; color: var(--secondary-text); }
    .status-pill { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 12px; font-weight: 500;
      background: rgba(127,127,127,.18); }
    .status-pill.status-incoming { background: rgba(255,167,38,.22); color: #e08f00; }
    .status-pill.status-pending  { background: rgba(33,150,243,.20); color: #1d75c4; }
    .status-pill.status-filed    { background: rgba(76,175,80,.22);  color: #2e7d32; }
    .status-pill.status-removed  { background: rgba(244,67,54,.18);  color: #c62828; }
    .muted { color: var(--secondary-text); font-size: 13px; }
    .center { text-align: center; padding: 12px 0; }
    .small  { font-size: 12px; }
  `]
})
export class SdsComponent implements OnInit {
  private orchestrator = inject(SubmissionOrchestratorService);
  private serverApi = inject(ServerApiService);
  private userSetup = inject(UserSetupService);
  private http = inject(HttpClient);

  private static readonly CACHE_KEY = 'pwa_sds_chemicals';
  private static readonly SNAPSHOT_URL = 'data/sds-chemicals.json';

  fields = signal<FormField[]>([]);
  draftEntity = signal<any>({});
  submitState = signal<SubmitState>('idle');
  submitMessage = signal('');

  existingOpen = signal(false);
  existingLoading = signal(false);
  existingError = signal(false);
  existingSource = signal<'server' | 'snapshot' | 'cache' | ''>('');
  existing = signal<ExistingRow[]>([]);
  existingLoaded = signal(false);
  query = signal('');

  existingCount = computed(() => this.existing().length);

  filtered = computed<ExistingRow[]>(() => {
    const q = this.query().trim().toLowerCase();
    const rows = this.existing();
    if (!q) return rows.slice(0, 200);
    return rows.filter(r => r.searchBlob.includes(q)).slice(0, 200);
  });

  private static readonly DRAFT_KEY = 'pwa_sds_draft';

  ngOnInit(): void {
    this.fields.set(sdsChemicalFormFields());
    this.loadDraft();
  }

  onExistingToggle(ev: Event): void {
    const open = (ev.target as HTMLDetailsElement).open;
    this.existingOpen.set(open);
    if (open && !this.existingLoaded() && !this.existingLoading()) {
      this.loadExisting();
    }
  }

  /** Three-tier load: hub → GitHub Pages snapshot (data/sds-chemicals.json) → localStorage cache. */
  private loadExisting(): void {
    this.existingLoading.set(true);
    this.existingError.set(false);
    this.serverApi.getActiveSdsChemicalsOrThrow().subscribe({
      next: (chemicals) => {
        const rows = this.toRows(chemicals || []);
        this.existing.set(rows);
        this.existingSource.set('server');
        this.existingLoaded.set(true);
        this.existingLoading.set(false);
        try { localStorage.setItem(SdsComponent.CACHE_KEY, JSON.stringify(chemicals || [])); }
        catch { /* quota / private mode — ignore */ }
      },
      error: () => this.loadFromSnapshot()
    });
  }

  private loadFromSnapshot(): void {
    this.http.get<any[]>(SdsComponent.SNAPSHOT_URL).subscribe({
      next: (snapshot) => {
        if (snapshot && snapshot.length > 0) {
          this.existing.set(this.toRows(snapshot));
          this.existingSource.set('snapshot');
          this.existingLoaded.set(true);
          this.existingLoading.set(false);
          try { localStorage.setItem(SdsComponent.CACHE_KEY, JSON.stringify(snapshot)); }
          catch { /* ignore */ }
        } else {
          this.loadFromCache();
        }
      },
      error: () => this.loadFromCache()
    });
  }

  private loadFromCache(): void {
    try {
      const raw = localStorage.getItem(SdsComponent.CACHE_KEY);
      const cached = raw ? JSON.parse(raw) : [];
      if (cached.length > 0) {
        this.existing.set(this.toRows(cached));
        this.existingSource.set('cache');
        this.existingLoaded.set(true);
      } else {
        this.existing.set([]);
        this.existingError.set(true);
      }
    } catch {
      this.existing.set([]);
      this.existingError.set(true);
    }
    this.existingLoading.set(false);
  }

  private toRows(chemicals: any[]): ExistingRow[] {
    const rows: ExistingRow[] = chemicals.map(c => {
      const allNames = (c.names || '').split(/\r?\n/).map((s: string) => s.trim()).filter(Boolean);
      const primary = c.primaryName || allNames[0] || '(unnamed)';
      const aliases = allNames.slice(1);
      const locs = (c.locations || '').split(/\r?\n/).map((s: string) => s.trim()).filter(Boolean).join(' • ');
      const status = c.statusName || '';
      return {
        primaryName: primary,
        aliases,
        locations: locs,
        bookNumber: c.bookNumber ?? null,
        sectionNumber: c.sectionNumber ?? null,
        statusName: status,
        searchBlob: (allNames.join(' ') + ' ' + locs + ' ' + status).toLowerCase()
      };
    });
    rows.sort((a, b) => a.primaryName.localeCompare(b.primaryName));
    return rows;
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
