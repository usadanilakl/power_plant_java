import { Component, Input, inject, signal, OnInit } from '@angular/core';
import { Subject, debounceTime } from 'rxjs';
import { LotoPermitApiService } from './loto-permit-api.service';
import { MaximoApiService } from '../maximo/maximo-api.service';
import { MaximoWorkOrder } from '../maximo/maximo.model';

type Filter = 'all' | 'outage' | 'toi';

/**
 * LOTO→WO linking: the "Linked Work Orders" panel shown on a LOTO permit. Lists the WOs already linked and lets
 * the user search Maximo WOs — filtered to All / Outage (PLAN-SNOW) / TOI-TMOD — and attach one. The link lives
 * on the LOTO ({@code linkedWonums}); this adds/removes a wonum.
 */
@Component({
  selector: 'app-loto-wo-link',
  standalone: true,
  imports: [],
  template: `
    <div class="lw">
      <div class="lw-hd">🔧 Linked Work Orders</div>
      @if (loading()) { <p class="lw-msg">Loading…</p> }
      @else if (!linkedWonums().length) { <p class="lw-none">No work orders linked.</p> }
      @else {
        @for (w of linkedWonums(); track w) {
          <div class="lw-row"><span class="lw-wo">{{ w }}</span>
            <button class="lw-x" [disabled]="busy()" (click)="unlink(w)">Unlink</button></div>
        }
      }

      @if (!picking()) {
        <button class="lw-add" (click)="startPick()">+ Link a work order</button>
      } @else {
        <div class="lw-filters">
          <button class="lw-f" [class.on]="filter() === 'outage'" (click)="setFilter('outage')">Outage</button>
          <button class="lw-f" [class.on]="filter() === 'toi'" (click)="setFilter('toi')">TOI/TMOD</button>
          <button class="lw-f" [class.on]="filter() === 'all'" (click)="setFilter('all')">All WOs</button>
        </div>
        <input class="lw-search" type="search"
               [placeholder]="filter() === 'all' ? 'Search WO # or text…' : 'Filter by #, tag, description…'"
               [value]="search()" (input)="onSearch($any($event.target).value)">
        @if (searching()) { <p class="lw-msg">Searching…</p> }
        @else {
          <div class="lw-results">
            @for (w of results(); track w.href) {
              <button class="lw-res" [disabled]="busy()" (click)="link(w)">
                <b>{{ w.wonum }}</b> <span class="lw-status">{{ w.status }}</span> — {{ w.description || '(no description)' }}
              </button>
            }
            @if (!results().length) { <p class="lw-none">{{ filter() === 'all' && !search().trim() ? 'Type to search work orders.' : 'No matching work orders.' }}</p> }
          </div>
        }
        <button class="lw-cancel" (click)="picking.set(false)">Cancel</button>
      }
      @if (error()) { <p class="lw-err">{{ error() }}</p> }
    </div>
  `,
  styles: [`
    .lw { border: 1px solid var(--border-color); border-radius: 10px; padding: 0.6rem 0.7rem; margin: 0.5rem 0; }
    .lw-hd { font-weight: 700; font-size: 0.88rem; margin-bottom: 0.4rem; }
    .lw-msg, .lw-none { color: var(--secondary-text, #888); font-size: 0.82rem; }
    .lw-row { display: flex; align-items: center; gap: 0.5rem; padding: 0.35rem 0; border-bottom: 1px solid var(--border-color); }
    .lw-wo { font-weight: 700; font-size: 0.85rem; }
    .lw-x { margin-left: auto; background: transparent; border: 1px solid #ef5350; color: #ef5350; border-radius: 6px; padding: 0.2rem 0.5rem; font-size: 0.75rem; font-weight: 700; cursor: pointer; }
    .lw-add { margin-top: 0.5rem; background: transparent; border: 1px solid #7E57C2; color: #7E57C2; border-radius: 8px; padding: 0.45rem 0.7rem; font-weight: 700; font-size: 0.82rem; cursor: pointer; }
    .lw-filters { display: flex; gap: 0.3rem; margin: 0.5rem 0 0.3rem; }
    .lw-f { flex: 1; background: transparent; border: 1px solid var(--border-color); color: var(--secondary-text, #888); border-radius: 8px; padding: 0.35rem; font-size: 0.78rem; font-weight: 700; cursor: pointer; }
    .lw-f.on { background: var(--accent-color); border-color: var(--accent-color); color: #fff; }
    .lw-search { width: 100%; box-sizing: border-box; margin-bottom: 0.3rem; border: 1px solid var(--border-color); border-radius: 8px; padding: 0.45rem 0.6rem; font-size: 0.88rem; background: var(--secondary-background); color: var(--primary-text); }
    .lw-results { max-height: 240px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.25rem; }
    .lw-res { text-align: left; background: var(--secondary-background); border: 1px solid var(--border-color); border-radius: 8px; padding: 0.45rem 0.55rem; font-size: 0.82rem; color: var(--primary-text); cursor: pointer; font-family: inherit; }
    .lw-status { font-weight: 600; font-size: 0.72rem; color: var(--secondary-text, #888); }
    .lw-cancel { margin-top: 0.4rem; background: transparent; border: none; color: var(--secondary-text, #888); font-weight: 700; cursor: pointer; }
    .lw-err { color: #ef5350; font-size: 0.8rem; margin-top: 0.3rem; }
  `]
})
export class LotoWoLinkComponent implements OnInit {
  @Input({ required: true }) lotoId!: number;
  private lotoApi = inject(LotoPermitApiService);
  private mx = inject(MaximoApiService);

  linkedWonums = signal<string[]>([]);
  loading = signal(false); busy = signal(false); error = signal<string | null>(null);
  picking = signal(false);
  filter = signal<Filter>('outage');
  search = signal('');
  results = signal<MaximoWorkOrder[]>([]);
  searching = signal(false);
  private trigger = new Subject<void>();

  ngOnInit(): void {
    this.load();
    this.trigger.pipe(debounceTime(300)).subscribe(() => this.runSearch());
  }
  load(): void {
    this.loading.set(true);
    this.lotoApi.lotoLinks(this.lotoId).subscribe({
      next: l => { this.linkedWonums.set(l?.linkedWonums ?? []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
  startPick(): void { this.picking.set(true); this.runSearch(); }
  setFilter(f: Filter): void { this.filter.set(f); this.runSearch(); }
  onSearch(v: string): void { this.search.set(v); this.trigger.next(); }

  private runSearch(): void {
    const f = this.filter(); const q = this.search().trim();
    this.searching.set(true);
    const done = (list: MaximoWorkOrder[]) => { this.results.set(this.excludeLinked(list)); this.searching.set(false); };
    const fail = () => { this.results.set([]); this.searching.set(false); };
    if (f === 'outage') { this.mx.listOutageWorkOrders().subscribe({ next: l => done(this.clientFilter(l, q)), error: fail }); }
    else if (f === 'toi') { this.mx.listTois().subscribe({ next: l => done(this.clientFilter(l, q)), error: fail }); }
    else {
      if (!q) { this.results.set([]); this.searching.set(false); return; }
      const byNum = /\d{3,}/.test(q) && !/\s/.test(q);
      this.mx.listWorkOrders({ wonumContains: byNum ? q : undefined, textContains: byNum ? undefined : q, pageSize: 40 })
        .subscribe({ next: done, error: fail });
    }
  }
  private clientFilter(l: MaximoWorkOrder[], q: string): MaximoWorkOrder[] {
    if (!q) return l;
    const s = q.toLowerCase();
    return l.filter(w => [w.wonum, w.description, w.assetnum, w.location].some(f => (f || '').toLowerCase().includes(s)));
  }
  private excludeLinked(l: MaximoWorkOrder[]): MaximoWorkOrder[] {
    const set = new Set(this.linkedWonums().map(x => x.toLowerCase()));
    return l.filter(w => !set.has((w.wonum || '').toLowerCase()));
  }
  link(w: MaximoWorkOrder): void {
    if (this.busy() || !w.wonum) return;
    this.busy.set(true); this.error.set(null);
    this.lotoApi.linkWo(this.lotoId, w.wonum).subscribe({
      next: () => { this.busy.set(false); this.picking.set(false); this.load(); },
      error: () => { this.error.set('Could not link the work order.'); this.busy.set(false); },
    });
  }
  unlink(wonum: string): void {
    if (this.busy()) return;
    this.busy.set(true); this.error.set(null);
    this.lotoApi.unlinkWo(this.lotoId, wonum).subscribe({
      next: () => { this.busy.set(false); this.load(); },
      error: () => { this.error.set('Could not unlink.'); this.busy.set(false); },
    });
  }
}
