import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, computed, effect, inject, signal } from '@angular/core';
import { MaximoApiService } from './maximo-api.service';
import { MaximoOfflineStore } from './maximo-offline.service';
import { MaximoSyncService } from './maximo-sync.service';
import { MaximoWoFilesComponent } from './maximo-wo-files.component';
import { MaximoWoNotesComponent } from './maximo-wo-notes.component';
import {
  COMPLETABLE_WO_STATUSES, MaximoFormFieldDef, MaximoFormTemplate, MaximoWorkOrder, statusClass,
} from './maximo.model';

type Tab = 'details' | 'tasks' | 'complete' | 'files' | 'notes';

/**
 * Bottom-sheet for a work order: read its details, complete its child tasks, and complete the WO itself
 * (manual labor + notes → COMP). Emits `completed` so the opener can refresh. Used by the search page and
 * the PM overview. (The dynamic PM completion form is a later addition.)
 */
@Component({
  selector: 'app-maximo-wo-detail',
  standalone: true,
  imports: [DatePipe, MaximoWoFilesComponent, MaximoWoNotesComponent],
  template: `
    <div class="wd-backdrop" (click)="close.emit()">
      <div class="wd-modal" (click)="$event.stopPropagation()">
        <div class="wd-head">
          <span class="wd-id">{{ wo.wonum }}</span>
          <span class="wd-chip" [class]="chip(status())">{{ status() }}</span>
          <button class="wd-x" (click)="close.emit()">✕</button>
        </div>
        <h2 class="wd-title">{{ wo.description || '(no description)' }}</h2>

        @if (canComplete()) {
          @if (grabbed()) {
            <div class="wd-grabbed">⚡ Grabbed for offline</div>
          } @else {
            <button class="wd-grab" [disabled]="grabbing()" (click)="grab()">
              {{ grabbing() ? 'Grabbing…' : '⚡ Grab for offline' }}
            </button>
            @if (grabError()) { <p class="wd-err">{{ grabError() }}</p> }
          }
        }

        <div class="wd-tabs">
          <button class="wd-tab" [class.active]="tab() === 'details'" (click)="tab.set('details')">Details</button>
          <button class="wd-tab" [class.active]="tab() === 'tasks'" (click)="openTasks()">Tasks</button>
          <button class="wd-tab" [class.active]="tab() === 'files'" (click)="tab.set('files')">Files</button>
          <button class="wd-tab" [class.active]="tab() === 'notes'" (click)="tab.set('notes')">Notes</button>
          @if (canComplete()) {
            <button class="wd-tab" [class.active]="tab() === 'complete'" (click)="tab.set('complete')">Complete</button>
          }
        </div>

        @if (tab() === 'details') {
          @if (wo.longDescription) { <p class="wd-long">{{ wo.longDescription }}</p> }
          <dl class="wd-facts">
            <dt>Type</dt><dd>{{ wo.worktype || '—' }}</dd>
            <dt>Asset</dt><dd>{{ wo.assetnum || '—' }}</dd>
            <dt>Location</dt><dd>{{ wo.location || '—' }}</dd>
            <dt>Lead</dt><dd>{{ wo.leadCraft || '—' }}</dd>
            <dt>Target start</dt><dd>{{ (wo.targetStart | date:'medium') || '—' }}</dd>
            @if (wo.pmnum) { <dt>PM</dt><dd>{{ wo.pmnum }}</dd> }
          </dl>
        }

        @if (tab() === 'tasks') {
          @if (tasksLoading()) { <p class="wd-msg">Loading tasks…</p> }
          @else if (tasks().length === 0) { <p class="wd-msg">No tasks on this work order.</p> }
          @else {
            <div class="wd-tasks">
              @for (t of tasks(); track t.href) {
                <div class="wd-task">
                  <div class="wd-task-info">
                    <span class="wd-task-id">{{ t.taskid || '•' }} <span class="wd-chip sm" [class]="chip(t.status)">{{ t.status }}</span></span>
                    <span class="wd-task-desc">{{ t.description || '(no description)' }}</span>
                  </div>
                  @if (completable(t.status)) {
                    <button class="wd-task-done" [disabled]="busyTask() === t.href" (click)="completeTask(t)">
                      {{ busyTask() === t.href ? '…' : 'Done' }}
                    </button>
                  } @else { <span class="wd-task-ok">✓</span> }
                </div>
              }
            </div>
          }
        }

        @if (tab() === 'files') {
          <app-maximo-wo-files [href]="wo.href"></app-maximo-wo-files>
        }

        @if (tab() === 'notes') {
          <app-maximo-wo-notes [href]="wo.href"></app-maximo-wo-notes>
        }

        @if (tab() === 'complete') {
          @if (done()) {
            <div class="wd-success"><span class="wd-success-i">✓</span> Work order completed.</div>
          } @else if (queued()) {
            <div class="wd-success"><span class="wd-success-i">⏳</span> Saved on this device — it submits to Maximo when you reconnect.</div>
          } @else if (formLoading()) {
            <p class="wd-msg">Checking for a PM form…</p>
          } @else if (formTemplate()) {
            <p class="wd-formname">{{ formTemplate()?.formName }}</p>
            @for (row of formRows(); track row.f.name) {
              @if (row.header) { <h4 class="wd-sec">{{ row.header }}</h4> }
              @switch (row.f.type) {
                @case ('image') {
                  <div class="wd-ff-img"><span class="wd-ff-label">{{ row.f.label }}</span>@if (row.f.imageSrc) { <img [src]="row.f.imageSrc" alt="reference"> }</div>
                }
                @case ('textarea') {
                  <label class="wd-field">{{ row.f.label }}{{ req(row.f) }}
                    <textarea rows="2" [value]="val(row.f.name)" (input)="setVal(row.f.name, $any($event.target).value)" [placeholder]="row.f.placeholder || ''"></textarea>
                  </label>
                }
                @case ('checkbox') {
                  <label class="wd-check"><input type="checkbox" [checked]="!!formValues()[row.f.name]" (change)="setVal(row.f.name, $any($event.target).checked)"> {{ row.f.label }}</label>
                }
                @case ('select') {
                  <label class="wd-field">{{ row.f.label }}{{ req(row.f) }}
                    <select [value]="val(row.f.name)" (change)="setVal(row.f.name, $any($event.target).value)">
                      <option value="">—</option>
                      @for (o of row.f.options || []; track o) { <option [value]="o">{{ o }}</option> }
                    </select>
                  </label>
                }
                @case ('radio-group') {
                  <div class="wd-field"><span>{{ row.f.label }}{{ req(row.f) }}</span>
                    <div class="wd-opts">
                      @for (o of row.f.options || []; track o) {
                        <label class="wd-opt"><input type="radio" [name]="row.f.name" [checked]="val(row.f.name) === o" (change)="setVal(row.f.name, o)"> {{ o }}</label>
                      }
                    </div>
                  </div>
                }
                @case ('checkbox-group') {
                  <div class="wd-field"><span>{{ row.f.label }}{{ req(row.f) }}</span>
                    <div class="wd-opts">
                      @for (o of row.f.options || []; track o) {
                        <label class="wd-opt"><input type="checkbox" [checked]="hasGroupVal(row.f.name, o)" (change)="toggleGroupVal(row.f.name, o, $any($event.target).checked)"> {{ o }}</label>
                      }
                    </div>
                  </div>
                }
                @case ('number') {
                  <label class="wd-field">{{ row.f.label }}{{ row.f.unit ? ' (' + row.f.unit + ')' : '' }}{{ req(row.f) }}
                    <input type="number" [value]="val(row.f.name)" (input)="setVal(row.f.name, $any($event.target).value)">
                  </label>
                }
                @case ('date') {
                  <label class="wd-field">{{ row.f.label }}{{ req(row.f) }}
                    <input type="date" [value]="val(row.f.name)" (input)="setVal(row.f.name, $any($event.target).value)">
                  </label>
                }
                @default {
                  <label class="wd-field">{{ row.f.label }}{{ req(row.f) }}
                    <input type="text" [value]="val(row.f.name)" (input)="setVal(row.f.name, $any($event.target).value)" [placeholder]="row.f.placeholder || ''">
                  </label>
                }
              }
            }
            @if (bannerError()) { <p class="wd-err">{{ bannerError() }}</p> }
            <button class="wd-complete" [disabled]="completing()" (click)="submitForm()">
              {{ completing() ? 'Submitting…' : 'Submit &amp; complete' }}
            </button>
          } @else {
            <label class="wd-field">Labor hours
              <input type="number" step="0.25" min="0" [value]="hours()" (input)="hours.set($any($event.target).value); autosave()" placeholder="e.g. 1.5">
            </label>
            <label class="wd-field">Summary
              <input type="text" [value]="summary()" (input)="summary.set($any($event.target).value); autosave()" placeholder="Short work summary">
            </label>
            <label class="wd-field">Details
              <textarea rows="3" [value]="details()" (input)="details.set($any($event.target).value); autosave()" placeholder="What was done (optional)"></textarea>
            </label>
            @if (bannerError()) { <p class="wd-err">{{ bannerError() }}</p> }
            <button class="wd-complete" [disabled]="completing()" (click)="completeWo()">
              {{ completing() ? 'Completing…' : 'Complete work order' }}
            </button>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .wd-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: flex-end; justify-content: center; z-index: 950; }
    .wd-modal { background: var(--secondary-background, #1e1e1e); border-radius: 14px 14px 0 0; width: 100%; max-width: 720px; max-height: 90vh; overflow-y: auto; padding: 1rem 1.1rem 2rem; }
    .wd-head { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.4rem; }
    .wd-id { font-weight: 700; color: var(--primary-text); }
    .wd-x { margin-left: auto; background: none; border: none; color: var(--secondary-text, #888); font-size: 1.1rem; cursor: pointer; }
    .wd-title { font-size: 1.1rem; font-weight: 700; color: var(--primary-text); margin: 0 0 0.6rem; }
    .wd-grab { width: 100%; background: #e67e22; color: #fff; border: none; border-radius: 10px; padding: 0.6rem; font-size: 0.92rem; font-weight: 700; cursor: pointer; font-family: inherit; margin-bottom: 0.7rem; }
    .wd-grab:disabled { opacity: 0.6; }
    .wd-grabbed { background: rgba(230,126,34,0.15); color: #e67e22; border: 1px solid #e67e22; border-radius: 10px; padding: 0.45rem; text-align: center; font-size: 0.82rem; font-weight: 700; margin-bottom: 0.7rem; }
    .wd-tabs { display: flex; gap: 0.4rem; border-bottom: 1px solid var(--border-color); margin-bottom: 0.8rem; }
    .wd-tab { background: none; border: none; border-bottom: 2px solid transparent; padding: 0.5rem 0.4rem; font-size: 0.9rem; font-weight: 700; color: var(--secondary-text, #888); cursor: pointer; font-family: inherit; }
    .wd-tab.active { color: var(--primary-text); border-bottom-color: var(--accent-color); }
    .wd-msg { text-align: center; color: var(--secondary-text, #888); padding: 1.5rem 1rem; }
    .wd-long { white-space: pre-wrap; color: var(--primary-text); font-size: 0.9rem; margin: 0 0 0.8rem; }
    .wd-facts { display: grid; grid-template-columns: auto 1fr; gap: 0.2rem 0.8rem; margin: 0; }
    .wd-facts dt { font-size: 0.75rem; font-weight: 700; color: var(--secondary-text, #888); }
    .wd-facts dd { margin: 0; font-size: 0.88rem; color: var(--primary-text); }
    .wd-chip { font-size: 0.66rem; font-weight: 700; padding: 0.12rem 0.45rem; border-radius: 999px; color: #fff; }
    .wd-chip.sm { font-size: 0.6rem; padding: 0.05rem 0.35rem; }
    .st-done { background: #27ae60; } .st-active { background: #2980b9; } .st-wait { background: #e67e22; }
    .st-cancel { background: #95a5a6; } .st-open { background: #7f8c8d; }
    .wd-tasks { display: flex; flex-direction: column; gap: 0.5rem; }
    .wd-task { display: flex; align-items: center; gap: 0.6rem; padding: 0.6rem 0.7rem; border: 1px solid var(--border-color); border-radius: 10px; }
    .wd-task-info { display: flex; flex-direction: column; gap: 0.2rem; flex: 1; }
    .wd-task-id { font-size: 0.8rem; font-weight: 700; color: var(--primary-text); }
    .wd-task-desc { font-size: 0.85rem; color: var(--primary-text); }
    .wd-task-done { background: #27ae60; color: #fff; border: none; border-radius: 8px; padding: 0.4rem 0.8rem; font-size: 0.8rem; font-weight: 700; cursor: pointer; font-family: inherit; }
    .wd-task-done:disabled { opacity: 0.6; }
    .wd-task-ok { color: #27ae60; font-weight: 700; }
    .wd-field { display: flex; flex-direction: column; gap: 0.3rem; font-size: 0.8rem; font-weight: 700; color: var(--secondary-text, #888); margin-bottom: 0.8rem; }
    .wd-field input, .wd-field textarea { padding: 0.55rem 0.7rem; border: 1px solid var(--border-color); border-radius: 10px; font-size: 1rem; background: var(--secondary-background); color: var(--primary-text); font-family: inherit; font-weight: 400; box-sizing: border-box; }
    .wd-formname { font-size: 0.85rem; font-weight: 700; color: var(--accent-color); margin: 0 0 0.6rem; }
    .wd-sec { font-size: 0.9rem; font-weight: 700; color: var(--primary-text); margin: 1rem 0 0.4rem; padding-bottom: 0.2rem; border-bottom: 1px solid var(--border-color); }
    .wd-check { display: flex; align-items: center; gap: 0.5rem; color: var(--primary-text); font-size: 0.9rem; margin-bottom: 0.7rem; }
    .wd-check input { width: 1.1rem; height: 1.1rem; }
    .wd-opts { display: flex; flex-direction: column; gap: 0.3rem; margin-top: 0.3rem; }
    .wd-opt { display: flex; align-items: center; gap: 0.5rem; color: var(--primary-text); font-size: 0.9rem; font-weight: 400; }
    .wd-ff-img { margin-bottom: 0.7rem; }
    .wd-ff-label { display: block; font-size: 0.8rem; font-weight: 700; color: var(--secondary-text, #888); margin-bottom: 0.3rem; }
    .wd-ff-img img { max-width: 100%; border-radius: 8px; border: 1px solid var(--border-color); }
    .wd-err { color: #e74c3c; font-size: 0.85rem; margin: 0 0 0.7rem; }
    .wd-complete { width: 100%; background: #27ae60; color: #fff; border: none; border-radius: 10px; padding: 0.8rem; font-size: 1rem; font-weight: 700; cursor: pointer; font-family: inherit; }
    .wd-complete:disabled { opacity: 0.6; cursor: default; }
    .wd-success { text-align: center; padding: 2rem 1rem; color: var(--primary-text); font-size: 1.05rem; font-weight: 700; }
    .wd-success-i { display: block; width: 3rem; height: 3rem; line-height: 3rem; margin: 0 auto 0.6rem; border-radius: 50%; background: #27ae60; color: #fff; font-size: 1.7rem; }
  `]
})
export class MaximoWoDetailComponent implements OnInit {
  @Input({ required: true }) wo!: MaximoWorkOrder;
  @Output() close = new EventEmitter<void>();
  @Output() completed = new EventEmitter<void>();

  private api = inject(MaximoApiService);
  private store = inject(MaximoOfflineStore);
  private sync = inject(MaximoSyncService);

  tab = signal<Tab>('details');
  status = signal('');
  grabbed = signal(false);
  grabbing = signal(false);
  grabError = signal<string | null>(null);
  tasks = signal<MaximoWorkOrder[]>([]);
  tasksLoading = signal(false);
  private tasksLoaded = false;
  busyTask = signal<string | null>(null);

  hours = signal('');
  summary = signal('');
  details = signal('');
  error = signal<string | null>(null);   // validation only (required-field etc.)

  // Submit lifecycle is owned by the (root) sync service, keyed by wonum, so it survives this sheet closing —
  // closing mid-submit would otherwise cancel the request while the server kept going (the double-attach trap).
  submitState = computed(() => this.wo ? this.sync.stateFor(this.wo.wonum) : undefined);
  completing = computed(() => this.submitState()?.phase === 'submitting');
  done = computed(() => this.submitState()?.phase === 'done');
  queued = computed(() => this.submitState()?.phase === 'queued');
  submitError = computed(() => this.submitState()?.phase === 'failed' ? (this.submitState()?.error ?? 'Could not complete.') : null);
  bannerError = computed(() => this.error() ?? this.submitError());
  private emittedDone = false;

  constructor() {
    // When the owned submit reports done, reflect COMP locally and tell the opener to refresh its list (once).
    effect(() => {
      if (this.done() && !this.emittedDone) {
        this.emittedDone = true;
        this.status.set('COMP');
        this.completed.emit();
      }
    });
  }

  // Dynamic PM completion form (present only when the WO's PM has an assigned formKey).
  formLoading = signal(true);
  formTemplate = signal<MaximoFormTemplate | null>(null);
  formValues = signal<Record<string, any>>({});
  formRows = computed<{ f: MaximoFormFieldDef; header: string | null }[]>(() => {
    const t = this.formTemplate();
    if (!t) return [];
    let fields: MaximoFormFieldDef[] = [];
    try { fields = JSON.parse(t.fieldsJson) as MaximoFormFieldDef[]; } catch { fields = []; }
    let prev = '';
    return fields.map(f => {
      const header = (f.section && f.section !== prev) ? f.section : null;
      if (f.section) prev = f.section;
      return { f, header };
    });
  });

  ngOnInit(): void {
    this.status.set(this.wo.status);
    const grab = this.store.getGrab(this.wo.wonum);
    if (grab) {
      // Grabbed: read the form from cache (works offline).
      this.grabbed.set(true);
      this.formTemplate.set(grab.formTemplate);
      this.formLoading.set(false);
    } else {
      this.api.getCompletionForm(this.wo.pmnum, this.wo.description).subscribe({
        next: t => { this.formTemplate.set(t); this.formLoading.set(false); },
        error: () => { this.formTemplate.set(null); this.formLoading.set(false); }
      });
    }
    // Restore any in-progress entries whether or not the WO was grabbed — a form filled online but not yet
    // submitted must survive the app closing too (values are autosaved on every change).
    this.restoreDraft();
  }

  private restoreDraft(): void {
    const d = this.store.getDraft(this.wo.wonum);
    if (!d) return;
    if (d.mode === 'form' && d.formValues) this.formValues.set(d.formValues);
    if (d.mode === 'manual') { this.hours.set(d.hours ?? ''); this.summary.set(d.summary ?? ''); this.details.set(d.details ?? ''); }
  }

  /**
   * Persist the in-progress entry on every change so nothing is lost if the app closes mid-fill. Kept a plain
   * DRAFT (not queued for submit); a submit-in-flight is left alone so autosave can't revert its 'pending' state.
   */
  autosave(): void {
    if (this.completing() || this.done()) return;
    const t = this.formTemplate();
    if (t) {
      this.store.saveDraft({
        wonum: this.wo.wonum, href: this.wo.href, mode: 'form',
        templateFormKey: t.formKey, siteid: this.wo.siteid, formValues: this.formValues(),
        status: 'draft', updatedAt: Date.now(),
      });
    } else {
      this.store.saveDraft({
        wonum: this.wo.wonum, href: this.wo.href, mode: 'manual',
        hours: this.hours(), summary: this.summary(), details: this.details(),
        status: 'draft', updatedAt: Date.now(),
      });
    }
  }

  /** Grab (reserve) this WO for offline work: server marks it in-progress + caches it locally. Needs signal. */
  grab(): void {
    this.grabbing.set(true); this.grabError.set(null);
    this.api.grabWorkOrder(this.wo.href).subscribe({
      next: updated => {
        this.grabbing.set(false);
        const wo = updated ?? { ...this.wo, status: 'INPRG' };
        this.status.set(wo.status || 'INPRG');
        this.store.saveGrab(wo, this.formTemplate());
        this.grabbed.set(true);
      },
      error: e => { this.grabbing.set(false); this.grabError.set(e?.error?.message || e?.message || 'You need a connection to grab (reserve) a PM.'); }
    });
  }

  // ── Dynamic form helpers ─────────────────────────────────────────────────
  val(name: string): any { return this.formValues()[name] ?? ''; }
  setVal(name: string, value: any): void { this.formValues.set({ ...this.formValues(), [name]: value }); this.autosave(); }
  req(f: MaximoFormFieldDef): string { return f.required ? ' *' : ''; }
  hasGroupVal(name: string, opt: string): boolean {
    const v = this.formValues()[name];
    return Array.isArray(v) && v.includes(opt);
  }
  toggleGroupVal(name: string, opt: string, checked: boolean): void {
    const cur = this.formValues()[name];
    const v: string[] = Array.isArray(cur) ? [...cur] : [];
    const i = v.indexOf(opt);
    if (checked && i < 0) v.push(opt);
    else if (!checked && i >= 0) v.splice(i, 1);
    this.setVal(name, v);
  }

  submitForm(): void {
    if (this.completing()) return;   // guard within this sheet; the sync state guards across reopen
    const t = this.formTemplate();
    if (!t) return;
    for (const { f } of this.formRows()) {
      if (!f.required) continue;
      const v = this.formValues()[f.name];
      const empty = v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);
      if (empty) { this.error.set(`"${f.label}" is required.`); this.tab.set('complete'); return; }
    }
    this.error.set(null);
    this.sync.submitOwned({
      wonum: this.wo.wonum, href: this.wo.href, mode: 'form',
      templateFormKey: t.formKey, siteid: this.wo.siteid, formValues: this.formValues(),
      status: 'pending', updatedAt: Date.now(),
    });
  }

  chip(s: string | undefined): string { return statusClass(s); }
  completable(s: string | undefined): boolean { return COMPLETABLE_WO_STATUSES.includes((s || '').toUpperCase()); }
  canComplete(): boolean { return this.completable(this.status()); }

  openTasks(): void {
    this.tab.set('tasks');
    if (this.tasksLoaded) return;
    this.tasksLoaded = true;
    this.tasksLoading.set(true);
    this.api.listWoTasks(this.wo.wonum).subscribe({
      next: t => { this.tasks.set(t); this.tasksLoading.set(false); },
      error: () => { this.tasks.set([]); this.tasksLoading.set(false); }
    });
  }

  completeTask(t: MaximoWorkOrder): void {
    // Optimistic + queued so it works offline; the sync service flushes it (and clears the queue) on reconnect.
    this.tasks.set(this.tasks().map(x => x.href === t.href ? { ...x, status: 'COMP' } : x));
    this.store.queueTask(t.href, t.wonum);
    this.busyTask.set(t.href);
    this.sync.submitTask(t.href, t.wonum).subscribe({
      next: () => this.busyTask.set(null),
      error: () => this.busyTask.set(null) // stays queued for reconnect
    });
  }

  completeWo(): void {
    if (this.completing()) return;
    this.error.set(null);
    this.sync.submitOwned({
      wonum: this.wo.wonum, href: this.wo.href, mode: 'manual',
      hours: this.hours(), summary: this.summary(), details: this.details(),
      status: 'pending', updatedAt: Date.now(),
    });
  }
}
