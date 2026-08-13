import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, debounceTime, switchMap } from 'rxjs';
import { catchError, of, tap } from 'rxjs';
import { MainLayoutComponent } from '../../layouts/main-layout/main-layout.component';
import { RouterMenuComponent } from '../../shared/menus/router-menu/router-menu.component';
import { MaximoApiService } from './maximo-api.service';
import { MaximoWoDetailComponent } from './maximo-wo-detail.component';
import { MaximoWoFilesComponent } from './maximo-wo-files.component';
import { MaximoTreePickerComponent } from './maximo-tree-picker.component';
import {
  MaximoServiceRequest, MaximoWorkOrder, SR_STATUSES, WO_STATUSES, WO_WORKTYPES, statusClass,
} from './maximo.model';

type Tab = 'wo' | 'sr';

@Component({
  selector: 'app-maximo-page',
  standalone: true,
  imports: [MainLayoutComponent, RouterMenuComponent, DatePipe, MaximoWoDetailComponent, MaximoWoFilesComponent, MaximoTreePickerComponent],
  template: `
    <app-main-layout [header]="'Maximo'">
      <ng-container header>
        <app-router-menu [layout]="'row'"></app-router-menu>
      </ng-container>
      <ng-container main-content>
        <div class="mx-container">
          <div class="mx-toolbar">
            <div class="mx-tabs">
              <button class="mx-tab" [class.active]="tab() === 'wo'" (click)="setTab('wo')">Work Orders</button>
              <button class="mx-tab" [class.active]="tab() === 'sr'" (click)="setTab('sr')">Requests</button>
            </div>
            <div class="mx-actions">
              <button class="mx-pm" (click)="goPm()">📋 PMs</button>
              <button class="mx-pm" (click)="goParts()">🔩 Parts</button>
              <button class="mx-new" (click)="newRequest()">+ New</button>
            </div>
          </div>

          <input class="mx-search" type="search"
                 [placeholder]="tab() === 'wo' ? 'Search by WO # or text…' : 'Search…'"
                 [value]="search()" (input)="onSearch($event)">

          <div class="mx-filters">
            <select [value]="status()" (change)="setStatus($any($event.target).value)">
              @for (s of statusOptions(); track s) { <option [value]="s">{{ s || 'Any status' }}</option> }
            </select>
            @if (tab() === 'wo') {
              <select [value]="worktype()" (change)="setWorktype($any($event.target).value)">
                @for (w of worktypes; track w) { <option [value]="w">{{ w || 'Any type' }}</option> }
              </select>
            }
            <input class="mx-subby" type="text" placeholder="Submitted by…"
                   [value]="submittedBy()" (input)="setSubmittedBy($any($event.target).value)">
          </div>

          <div class="mx-locfilter">
            <span class="mx-locfilter-label">Location filter</span>
            <app-maximo-tree-picker mode="location" [location]="locationFilter()"
                                    (selection)="setLocationFilter($event.location)"></app-maximo-tree-picker>
          </div>

          @if (loading()) {
            <p class="mx-msg">Loading…</p>
          } @else if (error()) {
            <p class="mx-msg mx-err">{{ error() }}</p>
          } @else if (visibleItems().length === 0) {
            <p class="mx-msg">Nothing found.</p>
          } @else {
            <div class="mx-list">
              @if (tab() === 'wo') {
                @for (w of visibleWos(); track w.href) {
                  <button class="mx-item" (click)="openWo(w)">
                    <div class="mx-item-top">
                      <span class="mx-id">{{ w.wonum }}</span>
                      <span class="mx-chip" [class]="chip(w.status)">{{ w.status }}</span>
                    </div>
                    <div class="mx-desc">{{ w.description || '(no description)' }}</div>
                    <div class="mx-meta">
                      @if (w.worktype) { <span>{{ w.worktype }}</span> }
                      @if (w.assetnum || w.location) { <span>{{ w.assetnum || w.location }}</span> }
                      @if (w.reportedby) { <span>👤 {{ w.reportedby }}</span> }
                      @if (w.targetStart || w.reportdate) { <span>{{ (w.targetStart || w.reportdate) | date:'MMM d' }}</span> }
                    </div>
                  </button>
                }
              } @else {
                @for (s of visibleSrs(); track s.href) {
                  <button class="mx-item" (click)="openSr(s)">
                    <div class="mx-item-top">
                      <span class="mx-id">{{ s.ticketid }}</span>
                      <span class="mx-chip" [class]="chip(s.status)">{{ s.status }}</span>
                    </div>
                    <div class="mx-desc">{{ s.description || '(no description)' }}</div>
                    <div class="mx-meta">
                      @if (s.assetnum || s.location) { <span>{{ s.assetnum || s.location }}</span> }
                      @if (s.reportedby) { <span>{{ s.reportedby }}</span> }
                      @if (s.reportdate) { <span>{{ s.reportdate | date:'MMM d' }}</span> }
                    </div>
                  </button>
                }
              }
            </div>
          }
        </div>

        @if (woDetail(); as w) {
          <app-maximo-wo-detail [wo]="w" (close)="woDetail.set(null)" (completed)="refresh()"></app-maximo-wo-detail>
        }

        <!-- SR detail modal (read) -->
        @if (detail(); as d) {
          <div class="mx-backdrop" (click)="detail.set(null)">
            <div class="mx-modal" (click)="$event.stopPropagation()">
              <div class="mx-modal-head">
                <span class="mx-modal-id">{{ d.id }}</span>
                <span class="mx-chip" [class]="chip(d.status)">{{ d.status }}</span>
                <button class="mx-x" (click)="detail.set(null)">✕</button>
              </div>
              @if (editingSr()) {
                <div class="mx-edit">
                  <label class="mx-edit-f">Description
                    <input type="text" [value]="srDesc()" (input)="srDesc.set($any($event.target).value)">
                  </label>
                  <label class="mx-edit-f">Details
                    <textarea rows="4" [value]="srLong()" (input)="srLong.set($any($event.target).value)"></textarea>
                  </label>
                  <label class="mx-edit-f">Priority
                    <input type="text" [value]="srPriority()" (input)="srPriority.set($any($event.target).value)" placeholder="e.g. 3">
                  </label>
                  @if (srEditError()) { <p class="mx-edit-err">{{ srEditError() }}</p> }
                  <div class="mx-edit-actions">
                    <button class="mx-save" [disabled]="savingSr()" (click)="saveSr()">{{ savingSr() ? 'Saving…' : 'Save' }}</button>
                    <button class="mx-cancel" [disabled]="savingSr()" (click)="editingSr.set(false)">Cancel</button>
                  </div>
                </div>
              } @else {
                <h2 class="mx-modal-title">{{ d.description || '(no description)' }}</h2>
                @if (d.longDescription) { <p class="mx-long">{{ d.longDescription }}</p> }
                <dl class="mx-facts">
                  @for (f of d.facts; track f.k) {
                    @if (f.v) { <dt>{{ f.k }}</dt><dd>{{ f.v }}</dd> }
                  }
                </dl>
                @if (isNewSr(d.status)) {
                  <button class="mx-edit-btn" (click)="startEditSr()">✎ Edit request</button>
                }
                <div class="mx-attach">
                  <h4 class="mx-attach-h">Attachments</h4>
                  <app-maximo-wo-files [href]="d.href" parent="sr" [canUpload]="isNewSr(d.status)"></app-maximo-wo-files>
                </div>
              }
            </div>
          </div>
        }
      </ng-container>
    </app-main-layout>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; }
    .mx-container { padding: 0.85rem; max-width: 720px; margin: 0 auto; width: 100%; box-sizing: border-box; }
    .mx-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; margin-bottom: 0.7rem; }
    .mx-tabs { display: flex; gap: 0.3rem; }
    .mx-tab { background: transparent; border: 1px solid var(--border-color); color: var(--secondary-text, #888); border-radius: 8px; padding: 0.4rem 0.8rem; font-size: 0.85rem; font-weight: 700; cursor: pointer; font-family: inherit; }
    .mx-tab.active { background: var(--accent-color); border-color: var(--accent-color); color: #fff; }
    .mx-actions { display: flex; gap: 0.35rem; }
    .mx-pm { background: transparent; color: var(--accent-color); border: 1px solid var(--accent-color); border-radius: 8px; padding: 0.4rem 0.6rem; font-size: 0.8rem; font-weight: 700; cursor: pointer; font-family: inherit; white-space: nowrap; }
    .mx-new { background: #27ae60; color: #fff; border: none; border-radius: 8px; padding: 0.4rem 0.7rem; font-size: 0.8rem; font-weight: 700; cursor: pointer; font-family: inherit; white-space: nowrap; }
    .mx-search { width: 100%; box-sizing: border-box; padding: 0.6rem 0.8rem; margin-bottom: 0.5rem; border: 1px solid var(--border-color); border-radius: 10px; font-size: 1rem; background: var(--card-bg, var(--secondary-background)); color: var(--primary-text); }
    .mx-filters { display: flex; gap: 0.5rem; margin-bottom: 0.8rem; }
    .mx-filters select { flex: 1; padding: 0.45rem 0.55rem; border: 1px solid var(--border-color); border-radius: 8px; font-size: 0.85rem; background: var(--secondary-background); color: var(--primary-text); font-family: inherit; }
    .mx-filters input.mx-subby { flex: 1.3; min-width: 8rem; padding: 0.45rem 0.55rem; border: 1px solid var(--border-color); border-radius: 8px; font-size: 0.85rem; background: var(--secondary-background); color: var(--primary-text); font-family: inherit; }
    .mx-locfilter { margin-bottom: 0.8rem; }
    .mx-locfilter-label { display: block; font-size: 0.72rem; font-weight: 700; color: var(--secondary-text, #888); margin-bottom: 0.35rem; }
    .mx-msg { text-align: center; color: var(--secondary-text, #888); padding: 2rem 1rem; }
    .mx-err { color: #e74c3c; }
    .mx-list { display: flex; flex-direction: column; gap: 0.55rem; }
    .mx-item { display: flex; flex-direction: column; gap: 0.25rem; padding: 0.75rem 0.85rem; border: 1px solid var(--border-color); border-radius: 12px; background: var(--card-bg, var(--secondary-background)); cursor: pointer; text-align: left; font-family: inherit; }
    .mx-item:active { transform: scale(0.995); }
    .mx-item-top { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
    .mx-id { font-weight: 700; color: var(--primary-text); }
    .mx-desc { font-size: 0.9rem; color: var(--primary-text); }
    .mx-meta { display: flex; flex-wrap: wrap; gap: 0.15rem 0.7rem; font-size: 0.78rem; color: var(--secondary-text, #888); }
    .mx-chip { font-size: 0.68rem; font-weight: 700; padding: 0.14rem 0.5rem; border-radius: 999px; color: #fff; white-space: nowrap; }
    .st-done { background: #27ae60; } .st-active { background: #2980b9; } .st-wait { background: #e67e22; }
    .st-cancel { background: #95a5a6; } .st-open { background: #7f8c8d; }
    .mx-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: flex-end; justify-content: center; z-index: 900; }
    .mx-modal { background: var(--secondary-background, #1e1e1e); border-radius: 14px 14px 0 0; width: 100%; max-width: 720px; max-height: 88vh; overflow-y: auto; padding: 1rem 1.1rem 2rem; }
    .mx-modal-head { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; }
    .mx-modal-id { font-weight: 700; color: var(--primary-text); }
    .mx-x { margin-left: auto; background: none; border: none; color: var(--secondary-text, #888); font-size: 1.1rem; cursor: pointer; }
    .mx-modal-title { font-size: 1.1rem; font-weight: 700; color: var(--primary-text); margin: 0 0 0.5rem; }
    .mx-long { white-space: pre-wrap; color: var(--primary-text); font-size: 0.9rem; margin: 0 0 0.8rem; }
    .mx-facts { display: grid; grid-template-columns: auto 1fr; gap: 0.2rem 0.8rem; margin: 0; }
    .mx-attach { margin-top: 1rem; padding-top: 0.8rem; border-top: 1px solid var(--border-color); }
    .mx-attach-h { font-size: 0.8rem; font-weight: 700; color: var(--secondary-text, #888); margin: 0 0 0.6rem; }
    .mx-edit-btn { background: transparent; color: var(--accent-color); border: 1px solid var(--border-color); border-radius: 9px; padding: 0.5rem 0.8rem; font-size: 0.85rem; font-weight: 700; cursor: pointer; font-family: inherit; margin-top: 0.3rem; }
    .mx-edit { display: flex; flex-direction: column; gap: 0.7rem; }
    .mx-edit-f { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.8rem; color: var(--secondary-text, #888); }
    .mx-edit-f input, .mx-edit-f textarea { padding: 0.6rem; border: 1px solid var(--border-color); border-radius: 9px; background: var(--secondary-background); color: var(--primary-text); font-family: inherit; font-size: 0.95rem; box-sizing: border-box; }
    .mx-edit-err { color: #e74c3c; font-size: 0.85rem; margin: 0; }
    .mx-edit-actions { display: flex; gap: 0.6rem; }
    .mx-save { flex: 1; background: #27ae60; color: #fff; border: none; border-radius: 10px; padding: 0.75rem; font-size: 0.95rem; font-weight: 800; cursor: pointer; font-family: inherit; }
    .mx-save:disabled { opacity: 0.6; }
    .mx-cancel { background: transparent; color: var(--secondary-text, #888); border: 1px solid var(--border-color); border-radius: 10px; padding: 0.75rem 1rem; font-size: 0.9rem; cursor: pointer; font-family: inherit; }
    .mx-facts dt { font-size: 0.75rem; font-weight: 700; color: var(--secondary-text, #888); }
    .mx-facts dd { margin: 0; font-size: 0.88rem; color: var(--primary-text); }
  `]
})
export class MaximoPageComponent implements OnInit {
  private api = inject(MaximoApiService);
  private router = inject(Router);

  readonly worktypes = WO_WORKTYPES;

  tab = signal<Tab>('wo');
  search = signal('');
  status = signal('');
  worktype = signal('');
  /** Backend location filter (Maximo location code), picked from the plant tree. */
  locationFilter = signal('');
  /** Client-side "Submitted By" filter (substring, case-insensitive) over the loaded list. */
  submittedBy = signal('');
  wos = signal<MaximoWorkOrder[]>([]);
  srs = signal<MaximoServiceRequest[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  detail = signal<{ href: string; id: string; status: string; description: string; longDescription: string; facts: { k: string; v: string }[] } | null>(null);
  woDetail = signal<MaximoWorkOrder | null>(null);
  // SR edit (NEW only)
  private srRaw = signal<MaximoServiceRequest | null>(null);
  editingSr = signal(false);
  savingSr = signal(false);
  srDesc = signal('');
  srLong = signal('');
  srPriority = signal('');
  srEditError = signal<string | null>(null);

  items = computed(() => this.tab() === 'wo' ? this.wos() : this.srs());
  statusOptions = computed(() => this.tab() === 'wo' ? WO_STATUSES : SR_STATUSES);

  /** Lists narrowed by the "Submitted By" substring (matches WO/SR reportedby). */
  visibleWos = computed(() => this.bySubmitter(this.wos()));
  visibleSrs = computed(() => this.bySubmitter(this.srs()));
  visibleItems = computed(() => this.tab() === 'wo' ? this.visibleWos() : this.visibleSrs());

  private bySubmitter<T extends { reportedby?: string }>(list: T[]): T[] {
    const q = this.submittedBy().trim().toLowerCase();
    return q ? list.filter(x => (x.reportedby || '').toLowerCase().includes(q)) : list;
  }

  private reload$ = new Subject<void>();

  constructor() {
    this.reload$.pipe(
      debounceTime(350),
      switchMap(() => {
        this.loading.set(true); this.error.set(null);
        if (this.tab() === 'wo') {
          // A term like "42927" or "J26-42927" (a run of ≥3 digits, no spaces) is a WO number → search wonum;
          // anything else ("desiccant", "sample panel") is a text search over description. Maximo can't OR the
          // two in one query, so we route rather than send both.
          const term = this.search().trim();
          const byNumber = /\d{3,}/.test(term) && !/\s/.test(term);
          return this.api.listWorkOrders({
            status: this.status(), worktype: this.worktype(), location: this.locationFilter(),
            textContains: byNumber ? undefined : term,
            wonumContains: byNumber ? term : undefined,
          }).pipe(
            tap(list => { this.wos.set(list); this.loading.set(false); }),
            catchError(e => { this.fail(e); return of([]); })
          );
        }
        return this.api.listServiceRequests({ status: this.status(), location: this.locationFilter(), textContains: this.search() }).pipe(
          tap(list => { this.srs.set(list); this.loading.set(false); }),
          catchError(e => { this.fail(e); return of([]); })
        );
      })
    ).subscribe();
  }

  ngOnInit(): void { this.reload$.next(); }

  setTab(t: Tab): void { if (t === this.tab()) return; this.tab.set(t); this.status.set(''); this.locationFilter.set(''); this.submittedBy.set(''); this.reload$.next(); }
  setStatus(s: string): void { this.status.set(s); this.reload$.next(); }
  setWorktype(w: string): void { this.worktype.set(w); this.reload$.next(); }
  /** Backend location filter (from the plant-tree picker; its chip "clear" emits '' to reset). */
  setLocationFilter(code: string): void { this.locationFilter.set(code); this.reload$.next(); }
  /** Client-side only — no backend reload; filters the already-loaded list. */
  setSubmittedBy(v: string): void { this.submittedBy.set(v); }
  onSearch(e: Event): void { this.search.set((e.target as HTMLInputElement).value); this.reload$.next(); }

  chip(status: string | undefined): string { return statusClass(status); }
  /** SRs can only be attached to / edited while still NEW (not yet triaged) — matches the desktop's editable gate. */
  isNewSr(status: string | undefined): boolean { return (status || '').toUpperCase() === 'NEW'; }

  startEditSr(): void {
    const s = this.srRaw();
    if (!s) return;
    this.srDesc.set(s.description ?? '');
    this.srLong.set(s.longDescription ?? '');
    this.srPriority.set(s.priority ?? '');
    this.srEditError.set(null);
    this.editingSr.set(true);
  }
  saveSr(): void {
    const s = this.srRaw();
    if (!s || this.savingSr()) return;
    this.savingSr.set(true);
    this.srEditError.set(null);
    this.api.updateServiceRequest(s.href, {
      description: this.srDesc().trim(), longDescription: this.srLong().trim(), priority: this.srPriority().trim(),
    }).subscribe({
      next: updated => {
        this.savingSr.set(false);
        if (updated) this.openSr(updated);   // refresh the modal from the saved record (also clears edit mode)
        this.editingSr.set(false);
        this.refresh();                       // refresh the list behind it
      },
      error: e => { this.savingSr.set(false); this.srEditError.set(e?.error?.message || 'Could not save — check your connection.'); }
    });
  }
  newRequest(): void { this.router.navigate(['/maximo/new-request']); }
  goPm(): void { this.router.navigate(['/maximo/pm']); }
  goParts(): void { this.router.navigate(['/maximo/parts']); }

  openWo(w: MaximoWorkOrder): void { this.woDetail.set(w); }
  refresh(): void { this.reload$.next(); }
  openSr(s: MaximoServiceRequest): void {
    this.srRaw.set(s);
    this.editingSr.set(false);
    this.detail.set({
      href: s.href, id: s.ticketid, status: s.status, description: s.description, longDescription: s.longDescription,
      facts: [
        { k: 'Asset', v: s.assetnum }, { k: 'Location', v: s.location }, { k: 'Priority', v: s.priority },
        { k: 'Reported by', v: s.reportedby }, { k: 'Affected', v: s.affectedperson },
        { k: 'Reported', v: this.d(s.reportdate) }, { k: 'Site', v: s.siteid },
      ],
    });
  }

  private d(iso: string | undefined): string {
    if (!iso) return '';
    const dt = new Date(iso);
    return isNaN(dt.getTime()) ? '' : dt.toLocaleString();
  }
  private fail(e: any): void {
    this.error.set(e?.error?.message || e?.message || 'Could not reach Maximo. Check your connection.');
    this.loading.set(false);
  }
}
