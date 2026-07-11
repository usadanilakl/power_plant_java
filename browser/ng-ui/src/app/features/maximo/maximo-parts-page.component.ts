import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, catchError, debounceTime, of, switchMap } from 'rxjs';
import { MainLayoutComponent } from '../../layouts/main-layout/main-layout.component';
import { MaximoApiService } from './maximo-api.service';
import { MaximoBarcodeScannerComponent } from './maximo-barcode-scanner.component';
import { MaximoInventoryItem, MaximoLocation, PartsCheckoutRequest, PartsCheckoutResult } from './maximo.model';

@Component({
  selector: 'app-maximo-parts-page',
  standalone: true,
  imports: [MainLayoutComponent, MaximoBarcodeScannerComponent],
  template: `
    <app-main-layout [header]="'Parts Checkout'">
      <ng-container main-content>
        <div class="pc-container">
          <button class="pc-back" (click)="back()">← Maximo</button>

          @if (result(); as r) {
            <div class="pc-done">
              <div class="pc-done-icon">✓</div>
              <p class="pc-done-title">Checked out on {{ r.wonum }}</p>
              <p class="pc-done-sub">Status {{ r.status }}@if (r.actmatcost != null) { · cost {{ r.actmatcost }} }</p>
              <button class="pc-btn" (click)="reset()">New checkout</button>
            </div>
          } @else {
            <!-- Work order target -->
            <label class="pc-field">Location <span class="pc-req">*</span>
              <input type="text" [value]="locationQuery()" (input)="onLocationInput($event)" placeholder="Search a location">
            </label>
            @if (location()) { <p class="pc-picked">Location: <b>{{ location() }}</b> <button class="pc-clear" (click)="clearLocation()">clear</button></p> }
            @if (locResults().length) {
              <div class="pc-results">
                @for (l of locResults(); track l.location) { <button class="pc-res" (click)="pickLocation(l)"><b>{{ l.location }}</b> {{ l.description }}</button> }
              </div>
            }

            <div class="pc-row">
              <label class="pc-field grow">Work type
                <select [value]="worktype()" (change)="worktype.set($any($event.target).value)">
                  @for (w of worktypes; track w) { <option [value]="w">{{ w }}</option> }
                </select>
              </label>
            </div>
            <label class="pc-field">Description (optional)
              <input type="text" [value]="description()" (input)="description.set($any($event.target).value)" placeholder="What's it for">
            </label>

            <!-- Part search -->
            <h3 class="pc-h3">Add parts</h3>
            <div class="pc-search-row">
              <input class="pc-search" type="search" [value]="partQuery()" (input)="onPartInput($event)" placeholder="Search item number or description">
              <button class="pc-scan" (click)="scanning.set(true)" title="Scan barcode">📷</button>
            </div>
            @if (partResults().length) {
              <div class="pc-results">
                @for (p of partResults(); track p.itemnum + p.storeroom) {
                  <button class="pc-res" (click)="addLine(p)">
                    <b>{{ p.itemnum }}</b> {{ p.description }}
                    <span class="pc-res-meta">{{ p.storeroom }} · {{ p.curbal ?? '?' }} {{ p.issueunit }}@if (p.status === 'OBSOLETE') { · <span class="pc-obs">OBSOLETE</span> }</span>
                  </button>
                }
              </div>
            }

            <!-- Lines -->
            @if (lines().length) {
              <div class="pc-lines">
                @for (ln of lines(); track ln.item.itemnum + ln.item.storeroom; let i = $index) {
                  <div class="pc-line" [class.obs]="ln.item.status === 'OBSOLETE'">
                    <div class="pc-line-info">
                      <span class="pc-line-id">{{ ln.item.itemnum }}</span>
                      <span class="pc-line-desc">{{ ln.item.description }}</span>
                      @if (ln.item.status === 'OBSOLETE') { <span class="pc-obs">OBSOLETE — can't issue</span> }
                    </div>
                    <input class="pc-qty" type="number" min="1" step="1" [value]="ln.qty" (input)="setQty(i, $any($event.target).value)">
                    <button class="pc-rm" (click)="removeLine(i)">✕</button>
                  </div>
                }
              </div>
            }

            @if (error()) { <p class="pc-err">{{ error() }}</p> }
            <button class="pc-submit" [disabled]="!canSubmit()" (click)="checkout()">
              {{ submitting() ? 'Checking out…' : 'Check out' }}
            </button>
          }

          @if (scanning()) {
            <app-maximo-barcode-scanner (scanned)="onScanned($event)" (close)="scanning.set(false)"></app-maximo-barcode-scanner>
          }
        </div>
      </ng-container>
    </app-main-layout>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; }
    .pc-container { padding: 1rem; max-width: 640px; margin: 0 auto; width: 100%; box-sizing: border-box; padding-bottom: 3rem; }
    .pc-back { background: none; border: none; color: var(--accent-color); font-size: 0.9rem; padding: 0.2rem 0; cursor: pointer; margin-bottom: 0.5rem; }
    .pc-field { display: flex; flex-direction: column; gap: 0.3rem; font-size: 0.82rem; font-weight: 700; color: var(--secondary-text, #888); margin-bottom: 0.8rem; }
    .pc-field.grow { flex: 1; }
    .pc-field input, .pc-field select { padding: 0.55rem 0.7rem; border: 1px solid var(--border-color); border-radius: 10px; font-size: 1rem; background: var(--secondary-background); color: var(--primary-text); font-family: inherit; font-weight: 400; box-sizing: border-box; }
    .pc-req { color: #e74c3c; }
    .pc-row { display: flex; gap: 0.6rem; }
    .pc-picked { font-size: 0.85rem; color: var(--primary-text); margin: -0.4rem 0 0.8rem; }
    .pc-clear { background: none; border: none; color: var(--accent-color); font-size: 0.78rem; cursor: pointer; }
    .pc-h3 { font-size: 0.95rem; font-weight: 700; color: var(--primary-text); margin: 0.6rem 0 0.5rem; }
    .pc-search-row { display: flex; gap: 0.4rem; margin-bottom: 0.5rem; }
    .pc-search { flex: 1; box-sizing: border-box; padding: 0.6rem 0.8rem; border: 1px solid var(--border-color); border-radius: 10px; font-size: 1rem; background: var(--card-bg, var(--secondary-background)); color: var(--primary-text); }
    .pc-scan { flex-shrink: 0; background: var(--accent-color); color: #fff; border: none; border-radius: 10px; padding: 0 0.9rem; font-size: 1.2rem; cursor: pointer; }
    .pc-results { display: flex; flex-direction: column; gap: 0.3rem; margin: 0 0 0.9rem; max-height: 260px; overflow-y: auto; }
    .pc-res { text-align: left; background: var(--card-bg, var(--secondary-background)); border: 1px solid var(--border-color); border-radius: 8px; padding: 0.5rem 0.6rem; font-size: 0.82rem; color: var(--primary-text); cursor: pointer; font-family: inherit; }
    .pc-res-meta { display: block; font-size: 0.72rem; color: var(--secondary-text, #888); margin-top: 0.15rem; }
    .pc-obs { color: #e74c3c; font-weight: 700; }
    .pc-lines { display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 0.9rem; }
    .pc-line { display: flex; align-items: center; gap: 0.5rem; padding: 0.55rem 0.65rem; border: 1px solid var(--border-color); border-radius: 10px; }
    .pc-line.obs { border-color: #e74c3c; }
    .pc-line-info { flex: 1; display: flex; flex-direction: column; gap: 0.1rem; min-width: 0; }
    .pc-line-id { font-weight: 700; color: var(--primary-text); font-size: 0.85rem; }
    .pc-line-desc { font-size: 0.8rem; color: var(--secondary-text, #888); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .pc-qty { width: 56px; padding: 0.4rem; border: 1px solid var(--border-color); border-radius: 8px; font-size: 0.95rem; text-align: center; background: var(--secondary-background); color: var(--primary-text); }
    .pc-rm { background: none; border: none; color: var(--secondary-text, #888); font-size: 1rem; cursor: pointer; }
    .pc-err { color: #e74c3c; font-size: 0.85rem; margin: 0 0 0.8rem; }
    .pc-submit { width: 100%; background: #27ae60; color: #fff; border: none; border-radius: 10px; padding: 0.85rem; font-size: 1rem; font-weight: 700; cursor: pointer; font-family: inherit; }
    .pc-submit:disabled { opacity: 0.5; cursor: default; }
    .pc-done { text-align: center; padding: 2.5rem 1rem; }
    .pc-done-icon { width: 3.5rem; height: 3.5rem; line-height: 3.5rem; margin: 0 auto 0.75rem; border-radius: 50%; background: #27ae60; color: #fff; font-size: 2rem; }
    .pc-done-title { color: var(--primary-text); font-size: 1.1rem; font-weight: 700; margin: 0 0 0.25rem; }
    .pc-done-sub { color: var(--secondary-text, #888); margin: 0 0 1.5rem; }
    .pc-btn { background: var(--accent-color); color: #fff; border: none; border-radius: 8px; padding: 0.55rem 1rem; font-size: 0.9rem; font-weight: 700; cursor: pointer; font-family: inherit; }
  `]
})
export class MaximoPartsPageComponent {
  private api = inject(MaximoApiService);
  private router = inject(Router);

  readonly worktypes = ['CM', 'PM', 'EM', 'INSP'];

  location = signal('');
  locationQuery = signal('');
  locResults = signal<MaximoLocation[]>([]);
  worktype = signal('CM');
  description = signal('');
  partQuery = signal('');
  partResults = signal<MaximoInventoryItem[]>([]);
  lines = signal<{ item: MaximoInventoryItem; qty: number }[]>([]);
  scanning = signal(false);
  submitting = signal(false);
  error = signal<string | null>(null);
  result = signal<PartsCheckoutResult | null>(null);

  private locSearch$ = new Subject<string>();
  private partSearch$ = new Subject<string>();

  canSubmit = computed(() =>
    !!this.location() && this.lines().length > 0 && !this.submitting() &&
    this.lines().every(l => l.qty > 0 && l.item.status !== 'OBSOLETE'));

  constructor() {
    this.locSearch$.pipe(
      debounceTime(300),
      switchMap(q => q.trim().length < 2 ? of([]) : this.api.searchLocations(q.trim()).pipe(catchError(() => of([]))))
    ).subscribe(r => this.locResults.set(r));
    this.partSearch$.pipe(
      debounceTime(350),
      switchMap(q => q.trim().length < 2 ? of([]) : this.api.searchInventory(q.trim()).pipe(catchError(() => of([]))))
    ).subscribe(r => this.partResults.set(r));
  }

  onLocationInput(e: Event): void { const v = (e.target as HTMLInputElement).value; this.locationQuery.set(v); this.locSearch$.next(v); }
  pickLocation(l: MaximoLocation): void { this.location.set(l.location); this.locationQuery.set(l.location); this.locResults.set([]); }
  clearLocation(): void { this.location.set(''); this.locationQuery.set(''); this.locResults.set([]); }

  onPartInput(e: Event): void { const v = (e.target as HTMLInputElement).value; this.partQuery.set(v); this.partSearch$.next(v); }

  /** A scanned barcode: look it up and add the exact/single match straight to the lines, else show options. */
  onScanned(code: string): void {
    this.scanning.set(false);
    if (!code) return;
    this.partQuery.set(code);
    this.api.searchInventory(code).subscribe({
      next: res => {
        const exact = res.find(r => r.itemnum.toLowerCase() === code.toLowerCase());
        if (exact) this.addLine(exact);
        else if (res.length === 1) this.addLine(res[0]);
        else { this.partResults.set(res); if (!res.length) this.error.set(`No part found for "${code}".`); }
      },
      error: () => this.partResults.set([])
    });
  }
  addLine(p: MaximoInventoryItem): void {
    if (this.lines().some(l => l.item.itemnum === p.itemnum && l.item.storeroom === p.storeroom)) return;
    this.lines.set([...this.lines(), { item: p, qty: 1 }]);
    this.partResults.set([]); this.partQuery.set('');
  }
  setQty(i: number, v: string): void {
    const q = Math.max(1, Math.floor(Number(v) || 1));
    const list = [...this.lines()]; if (list[i]) list[i] = { ...list[i], qty: q };
    this.lines.set(list);
  }
  removeLine(i: number): void { const list = [...this.lines()]; list.splice(i, 1); this.lines.set(list); }

  checkout(): void {
    if (!this.canSubmit()) return;
    const req: PartsCheckoutRequest = {
      location: this.location(),
      worktype: this.worktype(),
      description: this.description().trim() || undefined,
      lines: this.lines().map(l => ({ itemnum: l.item.itemnum, quantity: l.qty, storeroom: l.item.storeroom })),
    };
    this.submitting.set(true); this.error.set(null);
    this.api.checkoutParts(req).subscribe({
      next: r => { this.submitting.set(false); if (r) this.result.set(r); else this.error.set('Checked out, but no result came back. Verify in Maximo.'); },
      error: e => { this.submitting.set(false); this.error.set(e?.error?.message || e?.message || 'Checkout failed. You need a connection.'); }
    });
  }

  reset(): void {
    this.location.set(''); this.locationQuery.set(''); this.locResults.set([]);
    this.worktype.set('CM'); this.description.set(''); this.partQuery.set(''); this.partResults.set([]);
    this.lines.set([]); this.error.set(null); this.result.set(null);
  }
  back(): void { this.router.navigate(['/maximo']); }
}
