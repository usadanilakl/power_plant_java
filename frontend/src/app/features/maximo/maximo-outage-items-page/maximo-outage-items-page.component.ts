import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MainLayoutComponent } from '../../../layout/refactored/main-layout.component';
import { RouterMenuComponent } from '../../../shared/menu/router-menu/router-menu.component';
import { MaximoApiService } from '../../../services/maximo/maximo-api.service';
import { MaximoDetailDialogComponent } from '../maximo-detail-dialog/maximo-detail-dialog.component';
import { MaximoWorkOrder, MaximoWorklog } from '../../../models/maximo/maximo.models';

/**
 * Outage Items — the work orders Maximo flags as outage work (Outage Type = PLAN "Planned Outage" or
 * SNOW "Short Notice Outage Work"). Each WO can carry LOTO isolation notes (what must be isolated), stored as
 * Maximo worklog entries tagged with a uniform marker server-side so they're distinguishable from ordinary notes.
 */
@Component({
  selector: 'app-maximo-outage-items-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MainLayoutComponent, RouterMenuComponent, MaximoDetailDialogComponent],
  template: `
    <app-main-layout header="Maximo — Outage Items">
      <ng-container header>
        <app-router-menu [layout]="'row'"></app-router-menu>
      </ng-container>
      <ng-container main-content>
        <div class="oi-page">
          <div class="oi-head">
            <p class="oi-sub">Planned (PLAN) &amp; short-notice (SNOW) outage work orders. Add LOTO isolation notes per WO.</p>
            <button class="oi-refresh" [disabled]="loading()" (click)="load()">{{ loading() ? 'Loading…' : '↻ Refresh' }}</button>
          </div>

          @if (error()) { <p class="oi-err">{{ error() }}</p> }

          @if (loading() && !wos().length) { <p class="oi-msg">Loading outage work orders…</p> }
          @else if (!wos().length && !error()) { <p class="oi-msg">No outage work orders found.</p> }
          @else if (wos().length) {
            <div class="oi-filters">
              <select [value]="typeFilter()" (change)="typeFilter.set($any($event.target).value)">
                <option value="">All types</option>
                <option value="PLAN">PLAN — Planned</option>
                <option value="SNOW">SNOW — Short Notice</option>
              </select>
              <select [value]="locationFilter()" (change)="locationFilter.set($any($event.target).value)">
                <option value="">All locations</option>
                @for (l of locationOptions(); track l) { <option [value]="l">{{ l }}</option> }
              </select>
              <select [value]="lotoFilter()" (change)="lotoFilter.set($any($event.target).value)" title="LOTO note">
                <option value="">LOTO: any</option>
                <option value="yes">🔒 Has LOTO note</option>
                <option value="no">Needs LOTO note</option>
              </select>
              <select [value]="sortBy()" (change)="sortBy.set($any($event.target).value)" title="Sort by">
                <option value="reported">Sort: Newest reported</option>
                <option value="target">Sort: Target start</option>
                <option value="wonum">Sort: WO #</option>
                <option value="type">Sort: Type (PLAN/SNOW)</option>
                <option value="status">Sort: Status</option>
                <option value="location">Sort: Location</option>
                <option value="noloto">Sort: Needs LOTO note first</option>
              </select>
              <input class="oi-search" type="search" placeholder="Search tag, WO #, description…"
                     [value]="search()" (input)="search.set($any($event.target).value)">
            </div>
            <div class="oi-count">Showing {{ filtered().length }} of {{ wos().length }}</div>
            @if (!filtered().length) { <p class="oi-msg">No outage work orders match your filters.</p> }
            <div class="oi-list">
              @for (wo of sorted(); track wo.href) {
                <div class="oi-card">
                  <button class="oi-row" (click)="toggle(wo)">
                    <span class="oi-badge" [class.snow]="wo.outageType === 'SNOW'">{{ wo.outageType || '—' }}</span>
                    <span class="oi-wonum">{{ wo.wonum }}</span>
                    <span class="oi-desc">{{ wo.description || '(no description)' }}</span>
                    <span class="oi-status">{{ wo.status }}</span>
                    <span class="oi-loc">{{ wo.location }}</span>
                    <span class="oi-loto-cell">@if (wo.lotoNoteCount) { <span class="oi-loto" title="LOTO isolation note(s) added">🔒 {{ wo.lotoNoteCount }}</span> }</span>
                    <span class="oi-caret">{{ expanded() === wo.href ? '▾' : '▸' }}</span>
                  </button>

                  @if (expanded() === wo.href) {
                    <div class="oi-body">
                      <button class="oi-detail-btn" (click)="detailWo.set(wo)">🗂 Full WO details — attachments · notes · dates · tasks · history</button>
                      <div class="oi-meta">
                        @if (wo.targetStart) { <span>🗓 {{ wo.targetStart | date:'medium' }}</span> }
                        @if (wo.leadCraft) { <span>👷 {{ wo.leadCraft }}</span> }
                        @if (wo.worktype) { <span>🏷 {{ wo.worktype }}</span> }
                      </div>

                      <h4 class="oi-h">🔒 LOTO isolation notes</h4>
                      @if (notesLoading()[wo.href]) { <p class="oi-msg">Loading notes…</p> }
                      @else if (!(notes()[wo.href]?.length)) { <p class="oi-none">No isolation notes yet.</p> }
                      @else {
                        <ul class="oi-notes">
                          @for (n of notes()[wo.href]; track n.href) {
                            <li class="oi-note">
                              <div class="oi-note-txt">{{ n.longDescription || n.description }}</div>
                              <div class="oi-note-meta">{{ n.createby }} · {{ n.createdate | date:'short' }}</div>
                            </li>
                          }
                        </ul>
                      }

                      <div class="oi-add">
                        <textarea rows="2" placeholder="What needs to be isolated (LOTO)…"
                                  [ngModel]="draft()[wo.href] || ''" (ngModelChange)="setDraft(wo.href, $event)"></textarea>
                        <button class="oi-save" [disabled]="saving() === wo.href || !(draft()[wo.href] || '').trim()"
                                (click)="addNote(wo)">
                          {{ saving() === wo.href ? 'Saving…' : '+ Add isolation note' }}
                        </button>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          }
          @if (detailWo(); as d) {
            <app-maximo-detail-dialog [parent]="'wo'" [wo]="d" (completed)="load()" (closed)="detailWo.set(null)"></app-maximo-detail-dialog>
          }
        </div>
      </ng-container>
    </app-main-layout>
  `,
  styles: [`
    .oi-page { padding: 0.5rem 0.75rem 2rem; max-width: 1100px; margin: 0 auto; }
    .oi-head { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin: 0.5rem 0 1rem; }
    .oi-sub { color: var(--secondary-text, #888); font-size: 0.9rem; margin: 0; }
    .oi-refresh { background: transparent; border: 1px solid var(--border-color); color: var(--primary-text); border-radius: 8px; padding: 0.45rem 0.7rem; font-weight: 700; cursor: pointer; }
    .oi-err { background: rgba(239,83,80,0.12); border: 1px solid #ef5350; border-radius: 8px; padding: 0.6rem 0.7rem; color: var(--primary-text); }
    .oi-msg, .oi-none { color: var(--secondary-text, #888); font-size: 0.9rem; }
    .oi-filters { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.6rem; }
    .oi-filters select, .oi-search { border: 1px solid var(--border-color); border-radius: 8px; padding: 0.45rem 0.55rem; font-size: 0.85rem; background: var(--secondary-background); color: var(--primary-text); font-family: inherit; }
    .oi-search { flex: 1 1 220px; min-width: 180px; }
    .oi-count { color: var(--secondary-text, #888); font-size: 0.78rem; margin-bottom: 0.4rem; }
    .oi-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .oi-card { border: 1px solid var(--border-color); border-radius: 10px; overflow: hidden; background: var(--secondary-background); }
    .oi-row { width: 100%; display: grid; grid-template-columns: 64px 100px 1fr 76px 120px 54px 20px; gap: 0.6rem; align-items: center; text-align: left;
              background: transparent; border: none; color: var(--primary-text); padding: 0.6rem 0.8rem; cursor: pointer; font-family: inherit; font-size: 0.9rem; }
    .oi-loto-cell { text-align: right; }
    .oi-loto { font-size: 0.72rem; font-weight: 700; color: #fff; background: #EC407A; padding: 0.15rem 0.35rem; border-radius: 6px; white-space: nowrap; }
    .oi-badge { font-weight: 800; font-size: 0.72rem; text-align: center; padding: 0.2rem 0; border-radius: 6px; background: #42A5F5; color: #fff; }
    .oi-badge.snow { background: #EC407A; }
    .oi-wonum { font-weight: 700; }
    .oi-desc { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .oi-status { font-size: 0.78rem; color: var(--secondary-text, #888); }
    .oi-loc { font-size: 0.78rem; color: var(--secondary-text, #888); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .oi-caret { text-align: center; color: var(--secondary-text, #888); }
    .oi-body { padding: 0.4rem 0.9rem 0.9rem; border-top: 1px solid var(--border-color); }
    .oi-detail-btn { margin: 0.6rem 0 0.2rem; background: transparent; border: 1px solid var(--accent-color, #26C6DA); color: var(--accent-color, #26C6DA); border-radius: 8px; padding: 0.45rem 0.8rem; font-weight: 700; font-size: 0.85rem; cursor: pointer; }
    .oi-meta { display: flex; flex-wrap: wrap; gap: 0.8rem; color: var(--secondary-text, #888); font-size: 0.8rem; margin: 0.5rem 0; }
    .oi-h { margin: 0.6rem 0 0.4rem; font-size: 0.9rem; }
    .oi-notes { list-style: none; padding: 0; margin: 0 0 0.6rem; display: flex; flex-direction: column; gap: 0.4rem; }
    .oi-note { border-left: 3px solid #EC407A; background: var(--card-bg, rgba(236,64,122,0.06)); border-radius: 0 6px 6px 0; padding: 0.4rem 0.6rem; }
    .oi-note-txt { white-space: pre-wrap; font-size: 0.88rem; }
    .oi-note-meta { font-size: 0.72rem; color: var(--secondary-text, #888); margin-top: 0.2rem; }
    .oi-add { display: flex; flex-direction: column; gap: 0.4rem; }
    .oi-add textarea { width: 100%; box-sizing: border-box; border: 1px solid var(--border-color); border-radius: 8px; padding: 0.5rem; font-family: inherit; font-size: 0.9rem; background: var(--card-bg, var(--secondary-background)); color: var(--primary-text); resize: vertical; }
    .oi-save { align-self: flex-start; background: #EC407A; color: #fff; border: none; border-radius: 8px; padding: 0.45rem 0.8rem; font-weight: 700; cursor: pointer; }
    .oi-save:disabled { opacity: 0.5; cursor: default; }
  `]
})
export class MaximoOutageItemsPageComponent implements OnInit {
  private api = inject(MaximoApiService);

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
      case 'target':   list.sort((a, b) => s(a.targetStart).localeCompare(s(b.targetStart))); break; // soonest first
      case 'wonum':    list.sort((a, b) => s(a.wonum).localeCompare(s(b.wonum))); break;
      case 'type':     list.sort((a, b) => s(a.outageType).localeCompare(s(b.outageType))); break;
      case 'status':   list.sort((a, b) => s(a.status).localeCompare(s(b.status))); break;
      case 'location': list.sort((a, b) => s(a.location).localeCompare(s(b.location))); break;
      case 'noloto':   list.sort((a, b) => (a.lotoNoteCount ? 1 : 0) - (b.lotoNoteCount ? 1 : 0)); break; // needs-note first
      default:         list.sort((a, b) => s(b.reportdate).localeCompare(s(a.reportdate))); // newest reported
    }
    return list;
  });
  notes = signal<Record<string, MaximoWorklog[]>>({});
  notesLoading = signal<Record<string, boolean>>({});
  draft = signal<Record<string, string>>({});
  saving = signal<string | null>(null);
  detailWo = signal<MaximoWorkOrder | null>(null);   // the WO whose full tabbed detail dialog is open

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true); this.error.set(null);
    this.api.listOutageWorkOrders(300).subscribe({
      next: list => { this.wos.set(list); this.loading.set(false); },
      error: () => { this.error.set('Couldn’t load outage work orders — Maximo may be unreachable. Tap Refresh to retry.'); this.loading.set(false); }
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
      next: n => {
        this.notes.set({ ...this.notes(), [wo.href]: n });
        this.syncCount(wo.href, n.length);
        this.setDraft(wo.href, '');
        this.saving.set(null);
      },
      error: () => { this.error.set('Could not save the isolation note.'); this.saving.set(null); }
    });
  }
}
