import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MainLayoutComponent } from '../../layouts/main-layout/main-layout.component';
import { RouterMenuComponent } from '../../shared/menus/router-menu/router-menu.component';
import { LotoStandardApiService } from './loto-standard-api.service';
import { LotoStandardStore } from './loto-standard-store.service';
import { LotoStandard, statusPhase } from './loto-standard.model';

@Component({
  selector: 'app-loto-standards-list',
  standalone: true,
  imports: [MainLayoutComponent, RouterMenuComponent],
  template: `
    <app-main-layout [header]="'LOTO Standards'">
      <ng-container header>
        <app-router-menu [layout]="'row'"></app-router-menu>
      </ng-container>
      <ng-container main-content>
        <div class="ls-container">
          <div class="ls-cta-row">
            <button class="ls-cta" (click)="openNewStandard()">+ New Standard</button>
            <button class="ls-cta" (click)="openNewPoint()">+ New Point</button>
          </div>
          <!-- Standard-independent walkdown entry point. Cross-links to a mode that lets the walker
               bulk-verify LOTO points across multiple standards or by location/system. -->
          <button class="ls-points-cta" (click)="openPointsWalkdown()">
            <span>🎯 Walk down LOTO points</span>
            <span class="ls-points-cta-sub">Pick standards, a location, or a system</span>
          </button>
          <input class="ls-search" type="search" placeholder="Search standards…"
                 [value]="search()" (input)="onSearch($event)">

          @if (loading()) {
            <p class="ls-msg">Loading…</p>
          } @else if (error()) {
            <p class="ls-msg ls-error">{{ error() }}</p>
          } @else if (filtered().length === 0) {
            <p class="ls-msg">No standards found.</p>
          } @else {
            <div class="ls-list">
              @for (s of filtered(); track s.id) {
                <button class="ls-item" (click)="open(s)">
                  <span class="ls-name">{{ s.name || '(unnamed)' }}</span>
                  <span class="ls-meta">
                    <span class="ls-badge" [class]="badgeClass(s)">{{ phase(s) }}</span>
                    <span class="ls-count">{{ s.lotoPoints?.length || 0 }} pts</span>
                  </span>
                </button>
              }
            </div>
          }
        </div>
      </ng-container>
    </app-main-layout>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; }
    .ls-container { padding: 1rem; max-width: 720px; margin: 0 auto; width: 100%; box-sizing: border-box; }
    .ls-search {
      width: 100%; box-sizing: border-box; padding: 0.7rem 0.9rem; margin-bottom: 1rem;
      border: 1px solid var(--border-color); border-radius: 10px; font-size: 1rem;
      background: var(--card-bg, var(--secondary-background)); color: var(--primary-text);
    }
    .ls-msg { text-align: center; color: var(--secondary-text); padding: 2rem 1rem; }
    .ls-error { color: var(--danger-text); }
    .ls-list { display: flex; flex-direction: column; gap: 0.6rem; }
    .ls-item {
      display: flex; flex-direction: column; align-items: flex-start; gap: 0.4rem;
      padding: 0.9rem 1rem; border: 1px solid var(--border-color); border-radius: 12px;
      background: var(--card-bg, var(--secondary-background)); cursor: pointer; text-align: left;
      font-family: inherit; transition: border-color 0.15s ease, transform 0.1s ease;
    }
    .ls-item:hover { border-color: var(--accent-color); }
    .ls-item:active { transform: scale(0.995); }
    .ls-name { font-size: 1.05rem; font-weight: 600; color: var(--primary-text); }
    .ls-meta { display: flex; align-items: center; gap: 0.6rem; }
    .ls-badge { font-size: 0.72rem; font-weight: 700; padding: 0.15rem 0.55rem; border-radius: 999px; color: var(--on-solid); }
    .ls-badge.b-active { background: var(--success-solid); }
    .ls-badge.b-walkdown { background: var(--accent-color); }
    .ls-badge.b-verification { background: var(--warning-solid); }
    .ls-badge.b-draft { background: var(--secondary-text); }
    .ls-count { font-size: 0.8rem; color: var(--secondary-text); }
    .ls-points-cta {
      display: flex; flex-direction: column; align-items: flex-start; gap: 0.25rem;
      width: 100%; padding: 0.85rem 1rem; margin-bottom: 0.8rem;
      background: var(--accent-color); color: var(--on-solid); border: none; border-radius: 12px;
      font-family: inherit; font-size: 1rem; font-weight: 700; cursor: pointer; text-align: left;
    }
    .ls-points-cta-sub { font-size: 0.78rem; font-weight: 500; opacity: 0.85; }
    .ls-cta-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 0.6rem; }
    .ls-cta { min-height: 44px; padding: 0.7rem; background: var(--card-bg, var(--secondary-background)); color: var(--primary-text); border: 1px solid var(--accent-color); border-radius: 10px; font: inherit; font-weight: 700; cursor: pointer; }
  `]
})
export class LotoStandardsListComponent implements OnInit {
  private api = inject(LotoStandardApiService);
  private store = inject(LotoStandardStore);
  private router = inject(Router);

  standards = signal<LotoStandard[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  search = signal('');

  filtered = computed(() => {
    const q = this.search().toLowerCase().trim();
    const list = this.standards();
    if (!q) return list;
    return list.filter(s => (s.name ?? '').toLowerCase().includes(q));
  });

  ngOnInit(): void {
    const cached = this.store.getCachedList();
    if (cached) { this.standards.set(cached.list); this.loading.set(false); }
    this.api.getAll().subscribe({
      next: list => { this.standards.set(list ?? []); this.store.cacheList(list ?? []); this.loading.set(false); },
      error: () => {
        if (!cached) this.error.set('Could not load standards. You may be offline — connect once to cache the list.');
        this.loading.set(false);
      }
    });
  }

  onSearch(e: Event): void { this.search.set((e.target as HTMLInputElement).value); }
  open(s: LotoStandard): void { this.router.navigate(['/loto-standards', s.id]); }
  openPointsWalkdown(): void { this.router.navigate(['/loto-points-walkdown']); }
  openNewStandard(): void { this.router.navigate(['/loto-standards/new']); }
  openNewPoint(): void { this.router.navigate(['/loto-points/new']); }
  phase(s: LotoStandard): string { return statusPhase(s.developmentStatus?.name); }
  badgeClass(s: LotoStandard): string {
    switch (this.phase(s)) {
      case 'Active': return 'ls-badge b-active';
      case 'Walked down': return 'ls-badge b-walkdown';
      case 'Verification': return 'ls-badge b-verification';
      default: return 'ls-badge b-draft';
    }
  }
}
