import { DatePipe } from '@angular/common';
import { Component, DestroyRef, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, computed, effect, inject, signal } from '@angular/core';
import { MaximoApiService } from './maximo-api.service';
import { MaximoOfflineStore } from './maximo-offline.service';
import { MaximoSyncService } from './maximo-sync.service';
import { MaximoWoFilesComponent } from './maximo-wo-files.component';
import { MaximoWoNotesComponent } from './maximo-wo-notes.component';
import {
  COMPLETABLE_WO_STATUSES, MaximoFormFieldDef, MaximoFormSubmission, MaximoFormTemplate, MaximoWorkOrder,
  ReorderLine, ReorderResult, statusClass,
} from './maximo.model';

type Tab = 'details' | 'tasks' | 'complete' | 'files' | 'notes' | 'history';

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
      <div class="wd-modal" role="dialog" aria-modal="true" [attr.aria-label]="'Work order ' + wo.wonum" (click)="$event.stopPropagation()">
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
          @if (wo.pmnum) {
            <button class="wd-tab" [class.active]="tab() === 'history'" (click)="openHistory()">History</button>
          }
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

        @if (tab() === 'history') {
          @if (historyLoading()) { <p class="wd-msg">Loading history…</p> }
          @else if (history().length === 0) { <p class="wd-msg">No completed work orders found for this PM.</p> }
          @else {
            <p class="wd-hist-cap">Previously completed for PM {{ wo.pmnum }} — newest first</p>
            <div class="wd-hist">
              @for (h of history(); track h.wonum) {
                <button type="button" class="wd-hist-row" (click)="historyWo.set(h)">
                  <div class="wd-hist-top">
                    <span class="wd-hist-id">{{ h.wonum }}</span>
                    <span class="wd-chip sm" [class]="chip(h.status)">{{ h.status }}</span>
                    <span class="wd-hist-date">{{ ((h.statusDate || h.targetStart) | date:'mediumDate') || '—' }}</span>
                    <span class="wd-hist-go">›</span>
                  </div>
                  <span class="wd-hist-desc">{{ h.description || '(no description)' }}</span>
                  @if (h.leadCraft) { <span class="wd-hist-lead">Lead: {{ h.leadCraft }}</span> }
                </button>
              }
            </div>
          }
        }

        @if (tab() === 'complete') {
          @if (done()) {
            <div class="wd-success"><span class="wd-success-i">✓</span> Work order completed.</div>
            @if (reorderLoading()) { <p class="wd-msg">Checking reorder levels…</p> }
            @else if (reorderResult()?.sent) {
              <div class="wd-reorder-done">✓ {{ reorderResult()?.message || 'Reorder email sent to the vendor.' }}</div>
            } @else if (reorderLines().length) {
              <div class="wd-reorder">
                <h4 class="wd-reorder-h">Reorder needed — {{ reorderLines().length }} item(s) below target</h4>
                <div class="wd-reorder-list">
                  @for (l of reorderLines(); track l.reagent) {
                    <div class="wd-reorder-row"><span class="wd-reorder-name">{{ l.reagent }}</span><span class="wd-reorder-qty">{{ l.inStock }} / {{ l.target }} · order {{ l.need }}</span></div>
                  }
                </div>
                <button class="wd-complete" [disabled]="reorderSending()" (click)="sendReorder()">
                  {{ reorderSending() ? 'Sending…' : '✉ Send reorder email to vendor' }}
                </button>
                @if (reorderResult() && !reorderResult()?.sent) { <p class="wd-err">{{ reorderResult()?.message }}</p> }
              </div>
            }
          } @else if (queued()) {
            <div class="wd-success"><span class="wd-success-i">⏳</span> Saved on this device — it submits to Maximo when you reconnect.</div>
          } @else if (formLoading()) {
            <p class="wd-msg">Checking for a PM form…</p>
          } @else if (formTemplate()) {
            @if (tooEarly() && !previewForm()) {
              <div class="wd-notdue">
                <span class="wd-notdue-i">⏳</span>
                <div>
                  <p class="wd-notdue-t">Not due yet</p>
                  <p class="wd-notdue-d">Scheduled for <b>{{ wo.targetStart | date:'mediumDate' }}</b> — this PM can't be completed before its period. Come back on or after that date.</p>
                  <button class="wd-preview-btn" (click)="previewForm.set(true)">👁 Preview the form (not submittable yet)</button>
                </div>
              </div>
            } @else {
              @if (tooEarly()) {
                <div class="wd-notdue-compact">⏳ Reference only — not due until <b>{{ wo.targetStart | date:'mediumDate' }}</b>. Completion is disabled below.</div>
              }
              <div class="wd-formhead">
              <p class="wd-formname">{{ formTemplate()?.formName }}</p>
              @if (availableForms().length > 1) { <button class="wd-changeform" (click)="backToPicker()">← change form</button> }
            </div>
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
                    <input type="number" inputmode="decimal" [value]="val(row.f.name)" (input)="setVal(row.f.name, $any($event.target).value)">
                  </label>
                }
                @case ('date') {
                  <label class="wd-field">{{ row.f.label }}{{ req(row.f) }}
                    <input type="date" [value]="val(row.f.name)" (input)="setVal(row.f.name, $any($event.target).value)">
                  </label>
                }
                @case ('computed') {
                  <div class="wd-field wd-computed">
                    <span class="wd-computed-head">{{ row.f.label }}</span>
                    @if (computeFormula(row.f) === null) {
                      <span class="wd-computed-val wd-computed-empty">— <em>fill in the values above</em></span>
                    } @else {
                      <span class="wd-computed-val">{{ computeFormula(row.f) }}{{ row.f.unit ? ' ' + row.f.unit : '' }}</span>
                    }
                    @if (row.f.note) { <span class="wd-computed-note">{{ row.f.note }}</span> }
                  </div>
                }
                @case ('timer') {
                  <div class="wd-field wd-timer">
                    <span class="wd-timer-label">{{ row.f.label }}{{ req(row.f) }}</span>
                    @if (timerStopped(row.f)) {
                      <div class="wd-timer-row">
                        <span class="wd-timer-val">✓ {{ fmtSeconds(timerElapsed(row.f)) }}</span>
                        <button type="button" class="wd-timer-reset" (click)="resetTimer(row.f)">↺ redo</button>
                      </div>
                    } @else if (timerRunning(row.f)) {
                      <button type="button" class="wd-timer-go stop" (click)="stopTimer(row.f)">■ Stop · {{ fmtElapsed(timerElapsed(row.f)) }}</button>
                    } @else {
                      @if (waitInfo(row.f); as w) { <div class="wd-timer-wait" [class.ready]="w.ready">{{ w.text }}</div> }
                      <div class="wd-timer-row">
                        <button type="button" class="wd-timer-go start" (click)="startTimer(row.f)">▶ Start timing</button>
                        <input class="wd-timer-manual" type="number" inputmode="decimal" step="0.1" placeholder="or type sec"
                               (input)="setVal(row.f.name, $any($event.target).value)">
                      </div>
                    }
                  </div>
                }
                @default {
                  <label class="wd-field">{{ row.f.label }}{{ req(row.f) }}
                    <input type="text" [value]="val(row.f.name)" (input)="setVal(row.f.name, $any($event.target).value)" [placeholder]="row.f.placeholder || ''">
                  </label>
                }
              }
            }
              @if (tooEarly()) {
                <div class="wd-notdue-compact">⏳ Not due until <b>{{ wo.targetStart | date:'mediumDate' }}</b> — completion is disabled here. This is a reference preview only.</div>
              } @else {
                @if (bannerError()) { <p class="wd-err">{{ bannerError() }}</p> }
                <button class="wd-complete" [disabled]="completing()" (click)="submitForm()">
                  {{ completing() ? 'Submitting…' : 'Submit &amp; complete' }}
                </button>
                @if (woCloseFailed()) {
                  <p class="wd-warn"><b>Form attached ✓</b> — but the work order didn't close: {{ woCloseErr() || 'Maximo rejected the status change.' }} Fix the cause in Maximo (e.g. complete any open tasks), then close it below. The form won't be attached again.</p>
                }
                <button class="wd-close-only" [disabled]="completing() || !canComplete()" (click)="completeWo()">
                  {{ completing() ? 'Closing…' : 'Complete work order (close only — no form)' }}
                </button>
              }
            }
          } @else if (availableForms().length > 1) {
            <p class="wd-msg">This PM has several forms — choose the one you performed:</p>
            <div class="wd-formpick">
              @for (f of availableForms(); track f.formKey) {
                <button class="wd-formpick-btn" (click)="selectForm(f)">
                  <span>{{ f.formName }}</span><span class="wd-formpick-go">›</span>
                </button>
              }
            </div>
          } @else {
            @if (tooEarly()) {
              <div class="wd-notdue">
                <span class="wd-notdue-i">⏳</span>
                <div>
                  <p class="wd-notdue-t">Not due yet</p>
                  <p class="wd-notdue-d">Scheduled for <b>{{ wo.targetStart | date:'mediumDate' }}</b> — this work order can't be completed before its period. Come back on or after that date.</p>
                </div>
              </div>
            } @else {
              <label class="wd-field">Labor hours
                <input type="number" inputmode="decimal" step="0.25" min="0" [value]="hours()" (input)="hours.set($any($event.target).value); autosave()" placeholder="e.g. 1.5">
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
        }
      </div>
    </div>

    @if (historyWo(); as h) {
      <div class="wd-backdrop wd-hist-ov" (click)="historyWo.set(null)">
        <div class="wd-modal" role="dialog" aria-modal="true" [attr.aria-label]="'Completed work order ' + h.wonum" (click)="$event.stopPropagation()">
          <div class="wd-head">
            <span class="wd-id">{{ h.wonum }}</span>
            <span class="wd-chip" [class]="chip(h.status)">{{ h.status }}</span>
            <button class="wd-x" (click)="historyWo.set(null)">✕</button>
          </div>
          <h2 class="wd-title">{{ h.description || '(no description)' }}</h2>
          @if (h.longDescription) { <p class="wd-long">{{ h.longDescription }}</p> }
          <dl class="wd-facts">
            <dt>Completed</dt><dd>{{ ((h.statusDate || h.targetStart) | date:'medium') || '—' }}</dd>
            <dt>Lead</dt><dd>{{ h.leadCraft || '—' }}</dd>
            <dt>Asset</dt><dd>{{ h.assetnum || '—' }}</dd>
            <dt>Location</dt><dd>{{ h.location || '—' }}</dd>
            @if (h.pmnum) { <dt>PM</dt><dd>{{ h.pmnum }}</dd> }
          </dl>
          <h4 class="wd-sec">Completed form &amp; attachments</h4>
          <app-maximo-wo-files [href]="h.href" [canUpload]="false"></app-maximo-wo-files>
          <h4 class="wd-sec">Work log</h4>
          <app-maximo-wo-notes [href]="h.href" [canAdd]="false"></app-maximo-wo-notes>
        </div>
      </div>
    }
  `,
  styles: [`
    .wd-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: stretch; justify-content: center; z-index: 10000; }
    /* Full-screen sheet: uses the whole viewport (dvh handles the mobile address bar), body scrolls, header stays put. */
    .wd-modal { background: var(--secondary-background, #1e1e1e); width: 100%; max-width: 720px;
      height: 100vh; height: 100dvh; max-height: 100vh; max-height: 100dvh;
      overflow-y: auto; -webkit-overflow-scrolling: touch; overscroll-behavior: contain; padding: 0 1.1rem 2rem; }
    .wd-head { position: sticky; top: 0; z-index: 3; display: flex; align-items: center; gap: 0.5rem;
      margin: 0 -1.1rem 0.5rem; padding: 0.9rem 1.1rem 0.6rem; background: var(--secondary-background, #1e1e1e); border-bottom: 1px solid var(--border-color); }
    .wd-x { margin-left: auto; background: none; border: none; color: var(--secondary-text, #888); font-size: 1.5rem; line-height: 1; cursor: pointer; padding: 0.25rem 0.4rem; border-radius: 8px; }
    .wd-x:hover, .wd-x:active { background: rgba(127,127,127,0.15); color: var(--primary-text); }
    .wd-id { font-weight: 700; color: var(--primary-text); }
    .wd-title { font-size: 1.1rem; font-weight: 700; color: var(--primary-text); margin: 0.6rem 0; }
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
    .wd-warn { background: rgba(230,126,34,0.12); border: 1px solid #e67e22; border-radius: 10px; padding: 0.6rem 0.7rem; color: var(--primary-text); font-size: 0.82rem; line-height: 1.35; margin: 0.6rem 0 0.2rem; }
    .wd-close-only { width: 100%; background: transparent; color: var(--accent-color); border: 1px solid var(--accent-color); border-radius: 10px; padding: 0.6rem; font-size: 0.9rem; font-weight: 700; cursor: pointer; font-family: inherit; margin-top: 0.5rem; }
    .wd-close-only:disabled { opacity: 0.45; cursor: default; }
    .wd-computed { background: var(--secondary-background); border: 1px solid var(--border-color); border-radius: 10px; padding: 0.55rem 0.7rem; display: flex; flex-direction: column; gap: 0.15rem; }
    .wd-computed-head { font-size: 0.8rem; font-weight: 700; color: var(--secondary-text, #888); }
    .wd-computed-val { font-size: 1.25rem; font-weight: 800; color: var(--accent-color); }
    .wd-computed-val.wd-computed-empty { font-size: 0.95rem; font-weight: 600; color: var(--secondary-text, #888); }
    .wd-computed-note { font-size: 0.72rem; color: var(--secondary-text, #888); line-height: 1.3; }
    .wd-timer { display: flex; flex-direction: column; gap: 0.35rem; }
    .wd-timer-label { font-size: 0.9rem; color: var(--primary-text); }
    .wd-timer-row { display: flex; align-items: center; gap: 0.5rem; }
    .wd-timer-go { flex: 1; border: none; border-radius: 10px; padding: 0.75rem; font-size: 1rem; font-weight: 800; cursor: pointer; font-family: inherit; color: #fff; }
    .wd-timer-go.start { background: #27ae60; }
    .wd-timer-go.stop { background: #e74c3c; font-variant-numeric: tabular-nums; }
    .wd-timer-val { flex: 1; font-size: 1.2rem; font-weight: 800; color: var(--accent-color); }
    .wd-timer-reset { background: transparent; color: var(--secondary-text, #888); border: 1px solid var(--border-color); border-radius: 8px; padding: 0.4rem 0.7rem; font-size: 0.82rem; cursor: pointer; font-family: inherit; }
    .wd-timer-manual { width: 6.5rem; padding: 0.5rem; border: 1px solid var(--border-color); border-radius: 8px; background: var(--secondary-background); color: var(--primary-text); font-family: inherit; font-size: 0.9rem; box-sizing: border-box; }
    .wd-timer-wait { font-size: 0.85rem; font-weight: 700; color: var(--secondary-text, #888); padding: 0.45rem 0.6rem; border-radius: 8px; background: var(--secondary-background); font-variant-numeric: tabular-nums; }
    .wd-timer-wait.ready { color: #fff; background: #e67e22; }
    .wd-notdue { display: flex; gap: 0.7rem; align-items: flex-start; background: rgba(230,126,34,0.12); border: 1px solid #e67e22; border-radius: 12px; padding: 1rem 1.1rem; margin-top: 0.5rem; }
    .wd-notdue-i { font-size: 1.6rem; line-height: 1; }
    .wd-notdue-t { font-weight: 800; color: #e67e22; margin: 0 0 0.25rem; }
    .wd-notdue-d { color: var(--primary-text); font-size: 0.9rem; margin: 0; line-height: 1.4; }
    .wd-preview-btn { margin-top: 0.7rem; background: transparent; color: #e67e22; border: 1px solid #e67e22; border-radius: 9px; padding: 0.5rem 0.8rem; font-size: 0.85rem; font-weight: 700; cursor: pointer; font-family: inherit; }
    .wd-preview-btn:hover, .wd-preview-btn:active { background: rgba(230,126,34,0.15); }
    .wd-notdue-compact { display: flex; align-items: center; gap: 0.4rem; background: rgba(230,126,34,0.12); border: 1px solid #e67e22; border-radius: 9px; padding: 0.6rem 0.8rem; margin: 0.4rem 0 0.7rem; color: var(--primary-text); font-size: 0.85rem; font-weight: 600; }
    .wd-hist-cap { font-size: 0.78rem; color: var(--secondary-text, #888); margin: 0 0 0.6rem; }
    .wd-hist { display: flex; flex-direction: column; gap: 0.5rem; }
    .wd-hist-row { display: flex; flex-direction: column; gap: 0.2rem; padding: 0.6rem 0.7rem; border: 1px solid var(--border-color); border-radius: 10px; background: var(--secondary-background); width: 100%; text-align: left; cursor: pointer; font-family: inherit; }
    .wd-hist-row:hover, .wd-hist-row:active { border-color: var(--accent-color); }
    .wd-hist-top { display: flex; align-items: center; gap: 0.5rem; }
    .wd-hist-id { font-weight: 700; color: var(--primary-text); }
    .wd-hist-date { margin-left: auto; font-size: 0.8rem; color: var(--secondary-text, #888); }
    .wd-hist-go { color: var(--accent-color); font-weight: 700; font-size: 1.1rem; line-height: 1; }
    .wd-hist-ov { z-index: 10001; }
    .wd-hist-desc { font-size: 0.86rem; color: var(--primary-text); }
    .wd-hist-lead { font-size: 0.75rem; color: var(--secondary-text, #888); }
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
    .wd-formhead { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; margin-bottom: 0.6rem; }
    .wd-formname { font-size: 0.85rem; font-weight: 700; color: var(--accent-color); margin: 0; }
    .wd-changeform { background: none; border: none; color: var(--secondary-text, #888); font-size: 0.78rem; cursor: pointer; font-family: inherit; padding: 0; white-space: nowrap; }
    .wd-formpick { display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.4rem; }
    .wd-formpick-btn { display: flex; align-items: center; justify-content: space-between; gap: 0.6rem; padding: 0.8rem 0.9rem;
      background: var(--secondary-background, #262626); color: var(--primary-text); border: 1px solid var(--border-color); border-radius: 10px;
      font-size: 0.95rem; font-weight: 600; cursor: pointer; font-family: inherit; text-align: left; }
    .wd-formpick-btn:hover { border-color: var(--accent-color); }
    .wd-formpick-go { color: var(--accent-color); font-size: 1.2rem; }
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
    .wd-reorder { border: 1px solid #e67e22; background: rgba(230,126,34,0.1); border-radius: 12px; padding: 0.9rem 1rem; margin-top: 0.5rem; }
    .wd-reorder-h { margin: 0 0 0.6rem; font-size: 0.92rem; color: #e67e22; font-weight: 800; }
    .wd-reorder-list { display: flex; flex-direction: column; gap: 0.35rem; margin-bottom: 0.8rem; }
    .wd-reorder-row { display: flex; justify-content: space-between; gap: 0.5rem; font-size: 0.85rem; color: var(--primary-text); }
    .wd-reorder-qty { color: var(--secondary-text, #888); white-space: nowrap; font-variant-numeric: tabular-nums; }
    .wd-reorder-done { text-align: center; color: #27ae60; font-weight: 700; font-size: 0.95rem; padding: 0.8rem; }
  `]
})
export class MaximoWoDetailComponent implements OnInit {
  @Input({ required: true }) wo!: MaximoWorkOrder;
  @Output() close = new EventEmitter<void>();
  @Output() completed = new EventEmitter<void>();

  private api = inject(MaximoApiService);
  private store = inject(MaximoOfflineStore);
  private sync = inject(MaximoSyncService);
  private host = inject(ElementRef<HTMLElement>);

  @HostListener('document:keydown.escape')
  onEscape(): void { if (this.historyWo()) { this.historyWo.set(null); return; } this.close.emit(); }

  tab = signal<Tab>('details');
  status = signal('');
  grabbed = signal(false);
  grabbing = signal(false);
  grabError = signal<string | null>(null);
  tasks = signal<MaximoWorkOrder[]>([]);
  tasksLoading = signal(false);
  private tasksLoaded = false;
  busyTask = signal<string | null>(null);
  history = signal<MaximoWorkOrder[]>([]);
  historyLoading = signal(false);
  private historyLoaded = false;
  /** A completed WO from the History tab, opened read-only to view its form PDF + worklog. */
  historyWo = signal<MaximoWorkOrder | null>(null);

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
  /** Form attached but Maximo rejected the WO close (the previously-silent case): surface it + offer a close-only retry. */
  woCloseFailed = computed(() => this.done() && this.submitState()?.woClosed === false);
  woCloseErr = computed(() => this.submitState()?.woCloseError ?? null);
  /** Ticks (~2×/sec while the sheet is open) so running timers + the wait countdown update live. */
  now = signal(Date.now());
  /** For a not-yet-due PM: reveal the form read-for-reference (no submit) when the operator opts in. */
  previewForm = signal(false);
  // Chem-inventory reorder offer, shown after a successful inventory-form submission (online only).
  reorderLines = signal<ReorderLine[]>([]);
  reorderLoading = signal(false);
  reorderSending = signal(false);
  reorderResult = signal<ReorderResult | null>(null);
  private reorderChecked = false;
  private destroyRef = inject(DestroyRef);
  private emittedDone = false;

  constructor() {
    // When the owned submit reports done, reflect COMP locally and tell the opener to refresh its list (once).
    effect(() => {
      if (this.done() && !this.emittedDone) {
        this.emittedDone = true;
        // Reflect COMP only if the WO actually closed (manual complete, or a form submit that also closed it).
        // If the form attached but Maximo rejected the close, keep the real status so the close-only retry stays live.
        if (this.submitState()?.woClosed !== false) this.status.set('COMP');
        this.completed.emit();
      }
    });
    // After a successful submit of a chem-inventory form, check reorder levels so the operator can send the
    // vendor order from the phone (nothing is sent automatically — same manual step as the desktop).
    effect(() => {
      const t = this.formTemplate();
      if (this.done() && !this.reorderChecked && t && this.isInventoryTemplate(t)) {
        this.reorderChecked = true;
        this.loadReorderOffer();
      }
    });
    const tick = setInterval(() => this.now.set(Date.now()), 500);
    this.destroyRef.onDestroy(() => clearInterval(tick));
  }

  // Dynamic PM completion form(s). A PM can assign several forms; the operator picks one to perform.
  formLoading = signal(true);
  /** All forms assigned to this WO's PM. 0 = manual UI; 1 = auto-selected; >1 = the picker is shown. */
  availableForms = signal<MaximoFormTemplate[]>([]);
  /** The form currently being filled (auto when only one is assigned), or null when none / awaiting a pick. */
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
    // Render at <body> level so the fixed overlay can't be trapped (mis-positioned / pushed off-screen) by a
    // transformed/scrolling ancestor — the cause of the "opens at the top/bottom/outside the view" bug. Lock
    // the page behind it so background scroll doesn't bleed through. Both undone on destroy.
    document.body.appendChild(this.host.nativeElement);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    this.destroyRef.onDestroy(() => {
      document.body.style.overflow = prevOverflow;
      this.host.nativeElement.remove();
    });

    this.status.set(this.wo.status);
    const grab = this.store.getGrab(this.wo.wonum);
    if (grab) {
      // Grabbed: read the assigned form(s) from cache (works offline).
      this.grabbed.set(true);
      this.availableForms.set(grab.formTemplates ?? []);
      this.formLoading.set(false);
      this.initFormSelection();
    } else {
      this.api.getFormsForWo(this.wo.pmnum, this.wo.description).subscribe({
        next: list => { this.availableForms.set(list ?? []); this.formLoading.set(false); this.initFormSelection(); },
        error: () => { this.availableForms.set([]); this.formLoading.set(false); this.initFormSelection(); }
      });
    }
  }

  /** none → manual (restore its draft); one → auto-select it; several → show the picker. */
  private initFormSelection(): void {
    const list = this.availableForms();
    if (list.length === 1) {
      this.selectForm(list[0]);
    } else {
      this.formTemplate.set(null);
      if (list.length === 0) {
        // Restore an in-progress MANUAL entry (autosaved on every change; survives the app closing).
        const d = this.store.getDraft(this.wo.wonum);   // 'manual' draft
        if (d?.mode === 'manual') { this.hours.set(d.hours ?? ''); this.summary.set(d.summary ?? ''); this.details.set(d.details ?? ''); }
      }
    }
  }

  /**
   * Pick which assigned form to perform, then seed its values (mirrors the desktop):
   *   1. an in-progress draft for THIS wo+form (freshest, offline-safe) wins;
   *   2. else a prior submission already on this WO;
   *   3. else, for an inventory form (chem-lab), carry the last run's sticky config + target levels forward
   *      (vendor emails / __desired / __include), clearing __instock so the counts are re-entered.
   * Steps 2-3 are best-effort over the network — offline they simply leave the form blank, as before.
   */
  selectForm(t: MaximoFormTemplate): void {
    this.formTemplate.set(t);
    this.error.set(null);
    this.previewForm.set(false);

    const draft = this.store.getDraft(this.wo.wonum, t.formKey);
    if (draft?.mode === 'form' && draft.formValues) { this.formValues.set(draft.formValues); return; }
    this.formValues.set({});

    this.api.submissionsForWo(this.wo.wonum).subscribe({
      next: subs => {
        const match = (subs ?? []).find(s => s.templateFormKey === t.formKey) ?? null;
        if (match?.valuesJson) { this.formValues.set(this.parseValues(match.valuesJson)); return; }
        if (!match && this.isInventoryTemplate(t)) {
          this.api.latestSubmissionForForm(t.formKey).subscribe({
            next: latest => {
              if (!latest?.valuesJson) return;
              const carried = this.parseValues(latest.valuesJson);
              for (const k of Object.keys(carried)) if (k.endsWith('__instock')) delete carried[k];
              this.formValues.set(carried);
            },
            error: () => { /* carry-forward is best-effort */ }
          });
        }
      },
      error: () => { /* prefill is best-effort (e.g. offline) */ }
    });
  }

  private parseValues(json: string | undefined): Record<string, any> {
    if (!json) return {};
    try { return JSON.parse(json) ?? {}; } catch { return {}; }
  }
  /** An inventory (chem-lab reorder) form carries a `<key>__instock` count field per reagent. */
  private isInventoryTemplate(t: MaximoFormTemplate): boolean {
    try { return (JSON.parse(t.fieldsJson) as MaximoFormFieldDef[]).some(d => (d.name ?? '').endsWith('__instock')); }
    catch { return false; }
  }

  // ── Chem-inventory reorder (post-submit): compute what's below target, then send the vendor email on demand ──
  private reorderDto(): MaximoFormSubmission {
    const t = this.formTemplate();
    return {
      templateFormKey: t?.formKey ?? '', templateName: t?.formName,
      wonum: this.wo.wonum, pmnum: this.wo.pmnum, woHref: this.wo.href, siteid: this.wo.siteid,
      valuesJson: JSON.stringify(this.formValues()),
    };
  }
  private loadReorderOffer(): void {
    this.reorderLoading.set(true);
    this.api.reorderPreview(this.reorderDto()).subscribe({
      next: lines => { this.reorderLines.set(lines ?? []); this.reorderLoading.set(false); },
      error: () => { this.reorderLines.set([]); this.reorderLoading.set(false); }
    });
  }
  sendReorder(): void {
    if (this.reorderSending()) return;
    this.reorderSending.set(true);
    this.api.reorderSend(this.reorderDto()).subscribe({
      next: res => { this.reorderResult.set(res); this.reorderSending.set(false); },
      error: () => { this.reorderResult.set({ sent: false, message: 'Send failed — try again, or send it from the desktop.' }); this.reorderSending.set(false); }
    });
  }

  /** Back to the form picker (only when several are assigned) to choose a different one. */
  backToPicker(): void {
    this.formTemplate.set(null);
    this.formValues.set({});
    this.error.set(null);
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
        templateFormKey: t.formKey, pmnum: this.wo.pmnum, siteid: this.wo.siteid, formValues: this.formValues(),
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
        this.store.saveGrab(wo, this.availableForms());
        this.grabbed.set(true);
      },
      error: e => { this.grabbing.set(false); this.grabError.set(e?.error?.message || e?.message || 'You need a connection to grab (reserve) a PM.'); }
    });
  }

  // ── Dynamic form helpers ─────────────────────────────────────────────────
  val(name: string): any { return this.formValues()[name] ?? ''; }
  setVal(name: string, value: any): void { this.formValues.set({ ...this.formValues(), [name]: value }); this.autosave(); }
  req(f: MaximoFormFieldDef): string { return f.required ? ' *' : ''; }

  /** Evaluate a computed field's formula over the current numeric field values; null until every referenced
   *  input is present (so the result reads "—" rather than a wrong partial value). Rounded to 2 decimals. */
  computeFormula(f: MaximoFormFieldDef): number | null {
    if (!f.formula) return null;
    const vals = this.formValues();
    const vars: Record<string, number> = {};
    for (const k of Object.keys(vals)) {
      const raw = vals[k];
      const n = Number(raw);
      if (raw !== '' && raw != null && !isNaN(n)) vars[k] = n;
    }
    const r = this.evalExpr(f.formula, vars);
    return r == null ? null : Math.round(r * 100) / 100;
  }

  /** Tiny safe arithmetic evaluator: + - * / ( ), unary +/-, decimals, and variable names — NO eval/Function
   *  (CSP-safe). Returns null if a referenced variable is missing/non-numeric or the expression is malformed. */
  private evalExpr(expr: string, vars: Record<string, number>): number | null {
    const toks = expr.match(/\d+\.?\d*|[a-zA-Z_]\w*|[()+\-*/]/g);
    if (!toks) return null;
    let i = 0;
    const peek = () => toks[i];
    const factor = (): number => {
      const t = toks[i++];
      if (t === '(') { const v = add(); if (toks[i] === ')') i++; return v; }
      if (t === '-') return -factor();
      if (t === '+') return factor();
      if (/^\d/.test(t)) return parseFloat(t);
      const v = vars[t];
      if (v === undefined || v === null || isNaN(v)) throw new Error('missing ' + t);
      return v;
    };
    const mul = (): number => {
      let v = factor();
      while (peek() === '*' || peek() === '/') { const op = toks[i++]; const r = factor(); v = op === '*' ? v * r : v / r; }
      return v;
    };
    const add = (): number => {
      let v = mul();
      while (peek() === '+' || peek() === '-') { const op = toks[i++]; const r = mul(); v = op === '+' ? v + r : v - r; }
      return v;
    };
    try {
      const result = add();
      return (i === toks.length && isFinite(result)) ? result : null;
    } catch { return null; }
  }

  // ── Built-in stopwatch (timer field type) — timestamp-based, so it survives the app locking/backgrounding ──
  private startKey(f: MaximoFormFieldDef): string { return f.name + '__start'; }
  timerStopped(f: MaximoFormFieldDef): boolean { const v = this.formValues()[f.name]; return v != null && v !== ''; }
  timerRunning(f: MaximoFormFieldDef): boolean {
    const v = this.formValues(); const s = v[this.startKey(f)];
    return s != null && s !== '' && (v[f.name] == null || v[f.name] === '');
  }
  /** Live elapsed seconds: clock-based (now − start) while running, the recorded value once stopped. */
  timerElapsed(f: MaximoFormFieldDef): number {
    if (this.timerStopped(f)) return Number(this.formValues()[f.name]) || 0;
    const start = Number(this.formValues()[this.startKey(f)]);
    return start ? Math.max(0, (this.now() - start) / 1000) : 0;
  }
  startTimer(f: MaximoFormFieldDef): void {
    const now = Date.now();
    const patch: Record<string, any> = { [this.startKey(f)]: now, [f.name]: '' };
    // Auto-fill a measured interval (e.g. SDI's T) from the anchor timer's start → now, in minutes.
    const w = f.waitAfter;
    if (w?.fillInto) {
      const anchor = Number(this.formValues()[w.field + '__start']);
      if (anchor) patch[w.fillInto] = Math.round((now - anchor) / 6000) / 10;
    }
    this.formValues.set({ ...this.formValues(), ...patch });
    this.autosave();
  }
  stopTimer(f: MaximoFormFieldDef): void {
    const start = Number(this.formValues()[this.startKey(f)]);
    if (!start) return;
    this.setVal(f.name, Math.round((Date.now() - start) / 100) / 10);   // seconds, 0.1 s precision
  }
  resetTimer(f: MaximoFormFieldDef): void {
    this.formValues.set({ ...this.formValues(), [f.name]: '', [this.startKey(f)]: '' });
    this.autosave();
  }
  /** waitAfter timer: the "time since the anchor sample → take the sample at N min" prompt (null unless waiting). */
  waitInfo(f: MaximoFormFieldDef): { text: string; ready: boolean } | null {
    const w = f.waitAfter;
    if (!w) return null;
    const start = Number(this.formValues()[w.field + '__start']);
    const anchorDone = this.formValues()[w.field] != null && this.formValues()[w.field] !== '';
    if (!start || !anchorDone || this.timerStopped(f) || this.timerRunning(f)) return null;
    const elapsedMin = (this.now() - start) / 60000;
    if (elapsedMin >= w.minutes) return { text: `✓ ${w.minutes} min elapsed — take the final sample now`, ready: true };
    return { text: `Waiting… ${this.fmtElapsed((w.minutes - elapsedMin) * 60)} until the ${w.minutes}-min mark`, ready: false };
  }
  fmtElapsed(secs: number): string {
    const s = Math.max(0, Math.floor(secs));
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  }
  fmtSeconds(secs: number): string { return (Math.round(secs * 10) / 10).toFixed(1) + ' s'; }
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
    if (this.tooEarly()) { this.error.set(this.notDueMsg()); this.tab.set('complete'); return; }
    const t = this.formTemplate();
    if (!t) return;
    for (const { f } of this.formRows()) {
      if (!f.required) continue;
      const v = this.formValues()[f.name];
      const empty = v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);
      if (empty) { this.error.set(`"${f.label}" is required.`); this.tab.set('complete'); return; }
    }
    this.error.set(null);
    // Write computed-field results into the submitted values so they land in valuesJson + the PDF.
    const computedPatch: Record<string, any> = {};
    for (const { f } of this.formRows()) {
      if (f.type === 'computed') { const c = this.computeFormula(f); if (c !== null) computedPatch[f.name] = c; }
    }
    if (Object.keys(computedPatch).length) this.formValues.set({ ...this.formValues(), ...computedPatch });
    this.emittedDone = false;   // let the done-effect fire again on a later close-only retry so it can flip to COMP
    this.sync.submitOwned({
      wonum: this.wo.wonum, href: this.wo.href, mode: 'form',
      templateFormKey: t.formKey, pmnum: this.wo.pmnum, siteid: this.wo.siteid, formValues: this.formValues(),
      status: 'pending', updatedAt: Date.now(),
    });
  }

  chip(s: string | undefined): string { return statusClass(s); }
  completable(s: string | undefined): boolean { return COMPLETABLE_WO_STATUSES.includes((s || '').toUpperCase()); }
  canComplete(): boolean { return this.completable(this.status()); }

  /** Mirrors the backend's assertDueForCompletion: a PM WO can't be completed before its Target Start (date-only;
   *  unset/unparseable = allowed). Keeps the operator from filling a whole form only to be rejected at submit, and
   *  warns offline before the completion is even queued. The server block stays the source of truth. */
  tooEarly(): boolean {
    const ts = this.wo?.targetStart;
    if (!ts) return false;
    const d = new Date(ts);
    if (isNaN(d.getTime())) return false;
    const target = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    return target > today;
  }
  private notDueMsg(): string {
    const d = this.wo?.targetStart ? new Date(this.wo.targetStart) : null;
    const when = d && !isNaN(d.getTime()) ? d.toLocaleDateString() : 'its scheduled date';
    return `This PM isn't due yet — it's scheduled for ${when} and can't be completed before its period.`;
  }

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

  /** Previously-completed WOs for this WO's PM (lazy, loaded once when the tab opens). */
  openHistory(): void {
    this.tab.set('history');
    if (this.historyLoaded) return;
    this.historyLoaded = true;
    if (!this.wo.pmnum) { this.history.set([]); return; }
    this.historyLoading.set(true);
    this.api.pmCompletedHistory(this.wo.pmnum).subscribe({
      next: h => { this.history.set(h ?? []); this.historyLoading.set(false); },
      error: () => { this.history.set([]); this.historyLoading.set(false); }
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
    if (this.tooEarly()) { this.error.set(this.notDueMsg()); this.tab.set('complete'); return; }
    this.error.set(null);
    this.emittedDone = false;
    this.sync.submitOwned({
      wonum: this.wo.wonum, href: this.wo.href, mode: 'manual',
      hours: this.hours(), summary: this.summary(), details: this.details(),
      status: 'pending', updatedAt: Date.now(),
    });
  }
}
