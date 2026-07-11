import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { MaximoApiService } from './maximo-api.service';
import { COMPLETABLE_WO_STATUSES, MaximoWorkOrder, statusClass } from './maximo.model';

type Tab = 'details' | 'tasks' | 'complete';

/**
 * Bottom-sheet for a work order: read its details, complete its child tasks, and complete the WO itself
 * (manual labor + notes → COMP). Emits `completed` so the opener can refresh. Used by the search page and
 * the PM overview. (The dynamic PM completion form is a later addition.)
 */
@Component({
  selector: 'app-maximo-wo-detail',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="wd-backdrop" (click)="close.emit()">
      <div class="wd-modal" (click)="$event.stopPropagation()">
        <div class="wd-head">
          <span class="wd-id">{{ wo.wonum }}</span>
          <span class="wd-chip" [class]="chip(status())">{{ status() }}</span>
          <button class="wd-x" (click)="close.emit()">✕</button>
        </div>
        <h2 class="wd-title">{{ wo.description || '(no description)' }}</h2>

        <div class="wd-tabs">
          <button class="wd-tab" [class.active]="tab() === 'details'" (click)="tab.set('details')">Details</button>
          <button class="wd-tab" [class.active]="tab() === 'tasks'" (click)="openTasks()">Tasks</button>
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

        @if (tab() === 'complete') {
          @if (done()) {
            <div class="wd-success"><span class="wd-success-i">✓</span> Work order completed.</div>
          } @else {
            <label class="wd-field">Labor hours
              <input type="number" step="0.25" min="0" [value]="hours()" (input)="hours.set($any($event.target).value)" placeholder="e.g. 1.5">
            </label>
            <label class="wd-field">Summary
              <input type="text" [value]="summary()" (input)="summary.set($any($event.target).value)" placeholder="Short work summary">
            </label>
            <label class="wd-field">Details
              <textarea rows="3" [value]="details()" (input)="details.set($any($event.target).value)" placeholder="What was done (optional)"></textarea>
            </label>
            @if (error()) { <p class="wd-err">{{ error() }}</p> }
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

  tab = signal<Tab>('details');
  status = signal('');
  tasks = signal<MaximoWorkOrder[]>([]);
  tasksLoading = signal(false);
  private tasksLoaded = false;
  busyTask = signal<string | null>(null);

  hours = signal('');
  summary = signal('');
  details = signal('');
  completing = signal(false);
  done = signal(false);
  error = signal<string | null>(null);

  ngOnInit(): void { this.status.set(this.wo.status); }

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
    this.busyTask.set(t.href);
    this.api.completeWorkOrder(t.href, { complete: true }).subscribe({
      next: () => {
        this.tasks.set(this.tasks().map(x => x.href === t.href ? { ...x, status: 'COMP' } : x));
        this.busyTask.set(null);
      },
      error: () => { this.busyTask.set(null); }
    });
  }

  completeWo(): void {
    const h = parseFloat(this.hours());
    const body = {
      labor: !isNaN(h) && h > 0 ? [{ regularhrs: h }] : undefined,
      summary: this.summary().trim() || undefined,
      details: this.details().trim() || undefined,
      complete: true,
    };
    this.completing.set(true); this.error.set(null);
    this.api.completeWorkOrder(this.wo.href, body).subscribe({
      next: updated => {
        this.completing.set(false);
        this.done.set(true);
        if (updated?.status) this.status.set(updated.status);
        this.completed.emit();
      },
      error: e => { this.completing.set(false); this.error.set(e?.error?.message || e?.message || 'Could not complete. Try again with signal.'); }
    });
  }
}
