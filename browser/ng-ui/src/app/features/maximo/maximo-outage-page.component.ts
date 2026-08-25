import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MainLayoutComponent } from '../../layouts/main-layout/main-layout.component';
import { MaximoApiService } from './maximo-api.service';
import { MaximoWoDetailComponent } from './maximo-wo-detail.component';
import { MaximoWorkOrder, MaximoWorklog } from './maximo.model';

/**
 * Outage Items (PWA) — work orders Maximo flags as outage work (Outage Type = PLAN / SNOW). Operators can read
 * and add LOTO isolation notes (what must be isolated) per WO; notes are Maximo worklog entries tagged with a
 * uniform marker server-side so they're distinguishable from ordinary notes.
 */
@Component({
  selector: 'app-maximo-outage-page',
  standalone: true,
  imports: [MainLayoutComponent, DatePipe, MaximoWoDetailComponent],
  template: `
    <app-main-layout [header]="'Outage Items'">
      <ng-container main-content>
        <div class="oi">
          <div class="oi-top">
            <button class="oi-back" (click)="back()">← Maximo</button>
            <button class="oi-refresh" [disabled]="loading()" (click)="load()">{{ loading() ? '…' : '↻' }}</button>
          </div>
          <p class="oi-sub">Planned (PLAN) &amp; short-notice (SNOW) outage work orders. Tap a WO to add LOTO isolation notes.</p>

          @if (error()) { <p class="oi-err">{{ error() }}</p> }

          @if (loading() && !wos().length) { <p class="oi-msg">Loading…</p> }
          @else if (!wos().length && !error()) { <p class="oi-msg">No outage work orders found.</p> }
          @else if (wos().length) {
            <div class="oi-filters">
              <select [value]="typeFilter()" (change)="typeFilter.set($any($event.target).value)">
                <option value="">All types</option>
                <option value="PLAN">PLAN</option>
                <option value="SNOW">SNOW</option>
              </select>
              <select [value]="locationFilter()" (change)="locationFilter.set($any($event.target).value)">
                <option value="">All locations</option>
                @for (l of locationOptions(); track l) { <option [value]="l">{{ l }}</option> }
              </select>
              <select [value]="lotoFilter()" (change)="lotoFilter.set($any($event.target).value)">
                <option value="">LOTO: any</option>
                <option value="yes">🔒 Has note</option>
                <option value="no">Needs note</option>
              </select>
            </div>
            <input class="oi-search" type="search" placeholder="Search tag, WO #, description…"
                   [value]="search()" (input)="search.set($any($event.target).value)">
            <select class="oi-sort" [value]="sortBy()" (change)="sortBy.set($any($event.target).value)">
              <option value="reported">Sort: Newest reported</option>
              <option value="target">Sort: Target start</option>
              <option value="wonum">Sort: WO #</option>
              <option value="type">Sort: Type (PLAN/SNOW)</option>
              <option value="status">Sort: Status</option>
              <option value="location">Sort: Location</option>
              <option value="noloto">Sort: Needs LOTO note first</option>
            </select>
            <div class="oi-count">{{ filtered().length }} of {{ wos().length }}</div>
            @if (!filtered().length) { <p class="oi-none">Nothing matches your filters.</p> }
            @for (wo of sorted(); track wo.href) {
              <div class="oi-card">
                <button class="oi-row" (click)="toggle(wo)">
                  <span class="oi-badge" [class.snow]="wo.outageType === 'SNOW'">{{ wo.outageType || '—' }}</span>
                  <span class="oi-main">
                    <span class="oi-wonum">{{ wo.wonum }} <span class="oi-status">{{ wo.status }}</span>@if (wo.lotoNoteCount) { <span class="oi-loto" title="LOTO isolation note(s) added">🔒 {{ wo.lotoNoteCount }}</span> }</span>
                    <span class="oi-desc">{{ wo.description || '(no description)' }}</span>
                    @if (wo.location) { <span class="oi-loc">📍 {{ wo.location }}</span> }
                  </span>
                  <span class="oi-caret">{{ expanded() === wo.href ? '▾' : '▸' }}</span>
                </button>

                @if (expanded() === wo.href) {
                  <div class="oi-body">
                    <button class="oi-detail-btn" (click)="detailWo.set(wo)">🗂 Full WO details — files · notes · dates · tasks</button>
                    <h4 class="oi-h">🔒 LOTO isolation notes</h4>
                    @if (notesLoading()[wo.href]) { <p class="oi-msg">Loading notes…</p> }
                    @else if (!(notes()[wo.href]?.length)) { <p class="oi-none">No isolation notes yet.</p> }
                    @else {
                      @for (n of notes()[wo.href]; track n.href) {
                        <div class="oi-note">
                          <div class="oi-note-txt">{{ n.longDescription || n.description }}</div>
                          <div class="oi-note-meta">{{ n.createby }} · {{ n.createdate | date:'short' }}</div>
                        </div>
                      }
                    }

                    <textarea class="oi-ta" rows="3" placeholder="What needs to be isolated (LOTO)…"
                              [value]="draft()[wo.href] || ''" (input)="setDraft(wo.href, $any($event.target).value)"></textarea>
                    <button class="oi-save" [disabled]="saving() === wo.href || !(draft()[wo.href] || '').trim()" (click)="addNote(wo)">
                      {{ saving() === wo.href ? 'Saving…' : '+ Add isolation note' }}
                    </button>
                  </div>
                }
              </div>
            }
          }
          @if (detailWo(); as d) {
            <app-maximo-wo-detail [wo]="d" (close)="detailWo.set(null)" (completed)="load()"></app-maximo-wo-detail>
          }
        </div>
      </ng-container>
    </app-main-layout>
  `,
  styles: [`
    .oi { padding: 0.5rem 0.75rem 2rem; }
    .oi-top { display: flex; align-items: center; justify-content: space-between; }
    .oi-back { background: transparent; border: none; color: var(--accent-color); font-size: 0.95rem; font-weight: 700; cursor: pointer; padding: 0.3rem 0; }
    .oi-refresh { background: transparent; border: 1px solid var(--border-color); color: var(--primary-text); border-radius: 8px; padding: 0.3rem 0.6rem; font-weight: 700; cursor: pointer; }
    .oi-sub { color: var(--secondary-text, #888); font-size: 0.82rem; margin: 0.2rem 0 0.8rem; }
    .oi-err { background: rgba(239,83,80,0.12); border: 1px solid #ef5350; border-radius: 8px; padding: 0.5rem 0.6rem; color: var(--primary-text); font-size: 0.85rem; }
    .oi-msg, .oi-none { color: var(--secondary-text, #888); font-size: 0.85rem; }
    .oi-filters { display: flex; gap: 0.4rem; margin-bottom: 0.4rem; }
    .oi-filters select { flex: 1 1 0; min-width: 0; border: 1px solid var(--border-color); border-radius: 8px; padding: 0.45rem 0.5rem; font-size: 0.85rem; background: var(--secondary-background); color: var(--primary-text); font-family: inherit; }
    .oi-search { width: 100%; box-sizing: border-box; border: 1px solid var(--border-color); border-radius: 8px; padding: 0.5rem 0.6rem; font-size: 0.9rem; background: var(--card-bg, var(--secondary-background)); color: var(--primary-text); margin-bottom: 0.4rem; }
    .oi-sort { width: 100%; box-sizing: border-box; border: 1px solid var(--border-color); border-radius: 8px; padding: 0.45rem 0.5rem; font-size: 0.85rem; background: var(--secondary-background); color: var(--primary-text); font-family: inherit; margin-bottom: 0.4rem; }
    .oi-count { color: var(--secondary-text, #888); font-size: 0.75rem; margin-bottom: 0.5rem; }
    .oi-loto { font-size: 0.68rem; font-weight: 700; color: #fff; background: #EC407A; padding: 0.1rem 0.3rem; border-radius: 6px; margin-left: 0.35rem; white-space: nowrap; }
    .oi-card { border: 1px solid var(--border-color); border-radius: 12px; overflow: hidden; background: var(--secondary-background); margin-bottom: 0.5rem; }
    .oi-row { width: 100%; display: flex; align-items: center; gap: 0.6rem; text-align: left; background: transparent; border: none; color: var(--primary-text); padding: 0.6rem 0.7rem; cursor: pointer; font-family: inherit; }
    .oi-badge { flex: 0 0 auto; font-weight: 800; font-size: 0.7rem; padding: 0.25rem 0.4rem; border-radius: 6px; background: #42A5F5; color: #fff; min-width: 42px; text-align: center; }
    .oi-badge.snow { background: #EC407A; }
    .oi-main { flex: 1 1 auto; display: flex; flex-direction: column; gap: 0.1rem; min-width: 0; }
    .oi-wonum { font-weight: 700; font-size: 0.92rem; }
    .oi-status { font-weight: 600; font-size: 0.72rem; color: var(--secondary-text, #888); }
    .oi-desc { font-size: 0.85rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .oi-loc { font-size: 0.75rem; color: var(--secondary-text, #888); }
    .oi-caret { flex: 0 0 auto; color: var(--secondary-text, #888); }
    .oi-body { padding: 0.3rem 0.8rem 0.8rem; border-top: 1px solid var(--border-color); }
    .oi-detail-btn { width: 100%; margin: 0.5rem 0 0.2rem; background: transparent; border: 1px solid var(--accent-color); color: var(--accent-color); border-radius: 8px; padding: 0.5rem; font-weight: 700; font-size: 0.85rem; cursor: pointer; }
    .oi-h { margin: 0.5rem 0 0.4rem; font-size: 0.88rem; }
    .oi-note { border-left: 3px solid #EC407A; background: var(--card-bg, rgba(236,64,122,0.06)); border-radius: 0 6px 6px 0; padding: 0.4rem 0.6rem; margin-bottom: 0.4rem; }
    .oi-note-txt { white-space: pre-wrap; font-size: 0.86rem; }
    .oi-note-meta { font-size: 0.7rem; color: var(--secondary-text, #888); margin-top: 0.2rem; }
    .oi-ta { width: 100%; box-sizing: border-box; border: 1px solid var(--border-color); border-radius: 8px; padding: 0.5rem; font-family: inherit; font-size: 0.9rem; background: var(--card-bg, var(--secondary-background)); color: var(--primary-text); resize: vertical; margin-top: 0.3rem; }
    .oi-save { margin-top: 0.4rem; background: #EC407A; color: #fff; border: none; border-radius: 8px; padding: 0.5rem 0.8rem; font-weight: 700; cursor: pointer; width: 100%; }
    .oi-save:disabled { opacity: 0.5; }
  `]
})
export class MaximoOutagePageComponent implements OnInit {
  private api = inject(MaximoApiService);
  private router = inject(Router);

  wos = signal<MaximoWorkOrder[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  expanded = signal<string | null>(null);

  // Client-side filters over the loaded set (all open outage WOs are loaded, so filtering is instant).
  search = signal('');
  typeFilter = signal('');
  locationFilter = signal('');
  lotoFilter = signal('');   // '' = all, 'yes' = has a LOTO note, 'no' = no LOTO note

  locationOptions = computed(() => [...new Set(this.wos().map(w => w.location).filter(Boolean))].sort());

  filtered = computed(() => {
    const q = this.search().toLowerCase().trim();
    const t = this.typeFilter();
    const loc = this.locationFilter();
    const lf = this.lotoFilter();
    return this.wos().filter(w =>
      (!t || w.outageType === t) &&
      (!loc || w.location === loc) &&
      (!lf || (lf === 'yes' ? !!w.lotoNoteCount : !w.lotoNoteCount)) &&
      (!q || [w.wonum, w.description, w.assetnum].some(f => (f || '').toLowerCase().includes(q))));
  });

  sortBy = signal('reported');
  sorted = computed(() => {
    const list = [...this.filtered()];
    const s = (v?: string) => v || '';
    switch (this.sortBy()) {
      case 'target':   list.sort((a, b) => s(a.targetStart).localeCompare(s(b.targetStart))); break;
      case 'wonum':    list.sort((a, b) => s(a.wonum).localeCompare(s(b.wonum))); break;
      case 'type':     list.sort((a, b) => s(a.outageType).localeCompare(s(b.outageType))); break;
      case 'status':   list.sort((a, b) => s(a.status).localeCompare(s(b.status))); break;
      case 'location': list.sort((a, b) => s(a.location).localeCompare(s(b.location))); break;
      case 'noloto':   list.sort((a, b) => (a.lotoNoteCount ? 1 : 0) - (b.lotoNoteCount ? 1 : 0)); break;
      default:         list.sort((a, b) => s(b.reportdate).localeCompare(s(a.reportdate)));
    }
    return list;
  });
  notes = signal<Record<string, MaximoWorklog[]>>({});
  notesLoading = signal<Record<string, boolean>>({});
  draft = signal<Record<string, string>>({});
  saving = signal<string | null>(null);
  detailWo = signal<MaximoWorkOrder | null>(null);   // the WO whose full tabbed detail sheet is open

  ngOnInit(): void { this.load(); }

  back(): void { this.router.navigate(['/maximo']); }

  load(): void {
    this.loading.set(true); this.error.set(null);
    this.api.listOutageWorkOrders(300).subscribe({
      next: list => { this.wos.set(list); this.loading.set(false); },
      error: () => { this.error.set('Couldn’t load outage work orders — Maximo may be unreachable. Tap ↻ to retry.'); this.loading.set(false); }
    });
  }

  toggle(wo: MaximoWorkOrder): void {
    if (this.expanded() === wo.href) { this.expanded.set(null); return; }
    this.expanded.set(wo.href);
    if (this.notes()[wo.href] === undefined) this.loadNotes(wo.href);
  }

  private loadNotes(href: string): void {
    this.notesLoading.set({ ...this.notesLoading(), [href]: true });
    this.api.getLotoNotes(href).subscribe({
      next: n => { this.notes.set({ ...this.notes(), [href]: n }); this.syncCount(href, n.length); this.notesLoading.set({ ...this.notesLoading(), [href]: false }); },
      error: () => { this.notes.set({ ...this.notes(), [href]: [] }); this.notesLoading.set({ ...this.notesLoading(), [href]: false }); }
    });
  }

  setDraft(href: string, v: string): void { this.draft.set({ ...this.draft(), [href]: v }); }

  /** Keep the card's LOTO badge count in sync with the loaded notes. */
  private syncCount(href: string, count: number): void {
    this.wos.set(this.wos().map(w => w.href === href ? { ...w, lotoNoteCount: count } : w));
  }

  addNote(wo: MaximoWorkOrder): void {
    const text = (this.draft()[wo.href] || '').trim();
    if (!text || this.saving() === wo.href) return;
    this.saving.set(wo.href); this.error.set(null);
    this.api.addLotoNote(wo.href, text).subscribe({
      next: n => { this.notes.set({ ...this.notes(), [wo.href]: n }); this.syncCount(wo.href, n.length); this.setDraft(wo.href, ''); this.saving.set(null); },
      error: () => { this.error.set('Could not save the isolation note.'); this.saving.set(null); }
    });
  }
}
