import { Component, Input, computed, inject, signal, OnInit } from '@angular/core';
import { LotoPermitApiService, LotoLink } from '../loto-permit/loto-permit-api.service';

/**
 * WO→LOTO linking for ANY work order: shows the LOTOs already linked to this WO and lets the user attach a
 * current (not-closed) LOTO. Drop-in for the WO detail sheet and the outage/TOI views. The link lives on the
 * LOTO (its {@code linkedWonums}); this just adds/removes this WO's number.
 */
@Component({
  selector: 'app-maximo-wo-loto-link',
  standalone: true,
  imports: [],
  template: `
    <div class="wl">
      <div class="wl-hd">🔒 Linked LOTO(s)</div>
      @if (loading()) { <p class="wl-msg">Loading…</p> }
      @else if (!linked().length) { <p class="wl-none">No LOTO linked to this work order.</p> }
      @else {
        @for (l of linked(); track l.id) {
          <div class="wl-row">
            <span class="wl-perm">{{ l.permitNumber || ('LOTO ' + l.id) }} <span class="wl-status">{{ l.status }}</span></span>
            @if (l.equipmentSystem) { <span class="wl-eq">{{ l.equipmentSystem }}</span> }
            <button class="wl-x" [disabled]="busy()" (click)="unlink(l)">Unlink</button>
          </div>
        }
      }

      @if (!picking()) {
        <button class="wl-add" (click)="startPick()">+ Link a LOTO</button>
      } @else {
        <input class="wl-search" type="search" placeholder="Search active LOTO — permit # / equipment…"
               [value]="search()" (input)="search.set($any($event.target).value)">
        @if (loadingActive()) { <p class="wl-msg">Loading LOTOs…</p> }
        @else {
          <div class="wl-pick">
            @for (l of filteredActive(); track l.id) {
              <button class="wl-pick-row" [disabled]="busy()" (click)="link(l)">
                <b>{{ l.permitNumber || ('LOTO ' + l.id) }}</b> <span class="wl-status">{{ l.status }}</span> — {{ l.equipmentSystem || '(no system)' }}
              </button>
            }
            @if (!filteredActive().length) { <p class="wl-none">No matching active LOTO.</p> }
          </div>
        }
        <button class="wl-cancel" (click)="picking.set(false)">Cancel</button>
      }
      @if (error()) { <p class="wl-err">{{ error() }}</p> }
    </div>
  `,
  styles: [`
    .wl { border: 1px solid var(--border-color); border-radius: 10px; padding: 0.6rem 0.7rem; margin: 0.5rem 0; }
    .wl-hd { font-weight: 700; font-size: 0.88rem; margin-bottom: 0.4rem; }
    .wl-msg, .wl-none { color: var(--secondary-text, #888); font-size: 0.82rem; }
    .wl-row { display: flex; align-items: center; gap: 0.5rem; padding: 0.35rem 0; border-bottom: 1px solid var(--border-color); }
    .wl-perm { font-weight: 700; font-size: 0.85rem; }
    .wl-status { font-weight: 600; font-size: 0.72rem; color: var(--secondary-text, #888); }
    .wl-eq { flex: 1; font-size: 0.8rem; color: var(--secondary-text, #888); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .wl-x { margin-left: auto; background: transparent; border: 1px solid #ef5350; color: #ef5350; border-radius: 6px; padding: 0.2rem 0.5rem; font-size: 0.75rem; font-weight: 700; cursor: pointer; }
    .wl-add { margin-top: 0.5rem; background: transparent; border: 1px solid #7E57C2; color: #7E57C2; border-radius: 8px; padding: 0.45rem 0.7rem; font-weight: 700; font-size: 0.82rem; cursor: pointer; }
    .wl-search { width: 100%; box-sizing: border-box; margin: 0.5rem 0 0.3rem; border: 1px solid var(--border-color); border-radius: 8px; padding: 0.45rem 0.6rem; font-size: 0.88rem; background: var(--secondary-background); color: var(--primary-text); }
    .wl-pick { max-height: 220px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.25rem; }
    .wl-pick-row { text-align: left; background: var(--secondary-background); border: 1px solid var(--border-color); border-radius: 8px; padding: 0.45rem 0.55rem; font-size: 0.82rem; color: var(--primary-text); cursor: pointer; font-family: inherit; }
    .wl-cancel { margin-top: 0.4rem; background: transparent; border: none; color: var(--secondary-text, #888); font-weight: 700; cursor: pointer; }
    .wl-err { color: #ef5350; font-size: 0.8rem; margin-top: 0.3rem; }
  `]
})
export class MaximoWoLotoLinkComponent implements OnInit {
  @Input({ required: true }) wonum!: string;
  private api = inject(LotoPermitApiService);

  linked = signal<LotoLink[]>([]);
  active = signal<LotoLink[]>([]);
  loading = signal(false); loadingActive = signal(false); busy = signal(false);
  picking = signal(false); search = signal(''); error = signal<string | null>(null);

  filteredActive = computed(() => {
    const q = this.search().toLowerCase().trim();
    const already = new Set(this.linked().map(l => l.id));
    return this.active().filter(l => !already.has(l.id)
      && (!q || [l.permitNumber, l.equipmentSystem, l.lotoRequestor].some(f => (f || '').toLowerCase().includes(q))));
  });

  ngOnInit(): void { this.load(); }
  load(): void {
    if (!this.wonum) return;
    this.loading.set(true);
    this.api.lotosForWonum(this.wonum).subscribe({
      next: l => { this.linked.set(l); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
  startPick(): void {
    this.picking.set(true); this.search.set('');
    if (!this.active().length) {
      this.loadingActive.set(true);
      this.api.activeLotos().subscribe({
        next: a => { this.active.set(a); this.loadingActive.set(false); },
        error: () => this.loadingActive.set(false),
      });
    }
  }
  link(l: LotoLink): void {
    if (this.busy()) return;
    this.busy.set(true); this.error.set(null);
    this.api.linkWo(l.id, this.wonum).subscribe({
      next: () => { this.busy.set(false); this.picking.set(false); this.load(); },
      error: () => { this.error.set('Could not link the LOTO.'); this.busy.set(false); },
    });
  }
  unlink(l: LotoLink): void {
    if (this.busy()) return;
    this.busy.set(true); this.error.set(null);
    this.api.unlinkWo(l.id, this.wonum).subscribe({
      next: () => { this.busy.set(false); this.load(); },
      error: () => { this.error.set('Could not unlink.'); this.busy.set(false); },
    });
  }
}
