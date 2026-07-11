import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MainLayoutComponent } from '../../layouts/main-layout/main-layout.component';
import { MaximoApiService } from './maximo-api.service';
import { MaximoSyncService } from './maximo-sync.service';
import { MaximoWoDetailComponent } from './maximo-wo-detail.component';
import { MaximoOverview, MaximoWorkOrder, statusClass } from './maximo.model';

type Bucket = 'overdue' | 'due' | 'upcoming' | 'done';

@Component({
  selector: 'app-maximo-pm-page',
  standalone: true,
  imports: [MainLayoutComponent, DatePipe, MaximoWoDetailComponent],
  template: `
    <app-main-layout [header]="'PM Overview'">
      <ng-container main-content>
        <div class="pm-container">
          <div class="pm-header">
            <button class="pm-back" (click)="back()">← Maximo</button>
            <button class="pm-grabbed" (click)="goGrabbed()">⚡ Grabbed@if (pending() > 0) { <span class="pm-pending-badge">{{ pending() }}</span> }</button>
          </div>

          <div class="pm-mode">
            <button class="pm-mode-btn" [class.active]="mode() === 'leads'" (click)="setMode('leads')">Leads</button>
            <button class="pm-mode-btn" [class.active]="mode() === 'mine'" (click)="setMode('mine')">Mine</button>
          </div>

          <div class="pm-tabs">
            <button class="pm-tab" [class.active]="bucket() === 'overdue'" (click)="bucket.set('overdue')">
              Overdue <span class="pm-count over">{{ ov()?.overdue?.length || 0 }}</span>
            </button>
            <button class="pm-tab" [class.active]="bucket() === 'due'" (click)="bucket.set('due')">
              This week <span class="pm-count">{{ ov()?.dueThisWeek?.length || 0 }}</span>
            </button>
            <button class="pm-tab" [class.active]="bucket() === 'upcoming'" (click)="bucket.set('upcoming')">
              Upcoming <span class="pm-count">{{ ov()?.upcoming?.length || 0 }}</span>
            </button>
            <button class="pm-tab" [class.active]="bucket() === 'done'" (click)="bucket.set('done')">
              Done <span class="pm-count">{{ ov()?.completedThisWeek?.length || 0 }}</span>
            </button>
          </div>

          @if (loading()) {
            <p class="pm-msg">Loading…</p>
          } @else if (error()) {
            <p class="pm-msg pm-err">{{ error() }}</p>
          } @else if (list().length === 0) {
            <p class="pm-msg">Nothing here.</p>
          } @else {
            <div class="pm-list">
              @for (w of list(); track w.href) {
                <button class="pm-item" (click)="detail.set(w)">
                  <div class="pm-item-top">
                    <span class="pm-id">{{ w.wonum }}</span>
                    <span class="pm-chip" [class]="chip(w.status)">{{ w.status }}</span>
                  </div>
                  <div class="pm-desc">{{ w.description || '(no description)' }}</div>
                  <div class="pm-meta">
                    @if (w.leadCraft) { <span>{{ w.leadCraft }}</span> }
                    @if (w.assetnum || w.location) { <span>{{ w.assetnum || w.location }}</span> }
                    @if (dateOf(w)) { <span [class.pm-late]="bucket() === 'overdue'">{{ dateOf(w) | date:'MMM d' }}</span> }
                  </div>
                </button>
              }
            </div>
          }
        </div>

        @if (detail(); as w) {
          <app-maximo-wo-detail [wo]="w" (close)="detail.set(null)" (completed)="load()"></app-maximo-wo-detail>
        }
      </ng-container>
    </app-main-layout>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; }
    .pm-container { padding: 0.85rem; max-width: 720px; margin: 0 auto; width: 100%; box-sizing: border-box; }
    .pm-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem; }
    .pm-back { background: none; border: none; color: var(--accent-color); font-size: 0.9rem; padding: 0.2rem 0; cursor: pointer; }
    .pm-grabbed { background: transparent; border: 1px solid #e67e22; color: #e67e22; border-radius: 8px; padding: 0.3rem 0.6rem; font-size: 0.8rem; font-weight: 700; cursor: pointer; font-family: inherit; }
    .pm-pending-badge { display: inline-block; background: #e67e22; color: #fff; border-radius: 999px; font-size: 0.7rem; padding: 0.02rem 0.4rem; margin-left: 0.3rem; }
    .pm-mode { display: flex; gap: 0.3rem; margin-bottom: 0.7rem; }
    .pm-mode-btn { flex: 1; background: transparent; border: 1px solid var(--border-color); color: var(--secondary-text, #888); border-radius: 8px; padding: 0.4rem; font-size: 0.85rem; font-weight: 700; cursor: pointer; font-family: inherit; }
    .pm-mode-btn.active { background: var(--accent-color); border-color: var(--accent-color); color: #fff; }
    .pm-tabs { display: flex; gap: 0.3rem; margin-bottom: 0.8rem; overflow-x: auto; }
    .pm-tab { flex: 1; min-width: fit-content; background: transparent; border: none; border-bottom: 2px solid transparent; color: var(--secondary-text, #888); padding: 0.4rem 0.3rem; font-size: 0.8rem; font-weight: 700; cursor: pointer; font-family: inherit; white-space: nowrap; }
    .pm-tab.active { color: var(--primary-text); border-bottom-color: var(--accent-color); }
    .pm-count { display: inline-block; font-size: 0.68rem; background: var(--border-color); color: var(--primary-text); border-radius: 999px; padding: 0.02rem 0.4rem; margin-left: 0.15rem; }
    .pm-count.over { background: #e74c3c; color: #fff; }
    .pm-msg { text-align: center; color: var(--secondary-text, #888); padding: 2rem 1rem; }
    .pm-err { color: #e74c3c; }
    .pm-list { display: flex; flex-direction: column; gap: 0.55rem; }
    .pm-item { display: flex; flex-direction: column; gap: 0.25rem; padding: 0.75rem 0.85rem; border: 1px solid var(--border-color); border-radius: 12px; background: var(--card-bg, var(--secondary-background)); cursor: pointer; text-align: left; font-family: inherit; }
    .pm-item-top { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
    .pm-id { font-weight: 700; color: var(--primary-text); }
    .pm-desc { font-size: 0.9rem; color: var(--primary-text); }
    .pm-meta { display: flex; flex-wrap: wrap; gap: 0.15rem 0.7rem; font-size: 0.78rem; color: var(--secondary-text, #888); }
    .pm-late { color: #e74c3c; font-weight: 700; }
    .pm-chip { font-size: 0.68rem; font-weight: 700; padding: 0.14rem 0.5rem; border-radius: 999px; color: #fff; white-space: nowrap; }
    .st-done { background: #27ae60; } .st-active { background: #2980b9; } .st-wait { background: #e67e22; }
    .st-cancel { background: #95a5a6; } .st-open { background: #7f8c8d; }
    .pm-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: flex-end; justify-content: center; z-index: 900; }
    .pm-modal { background: var(--secondary-background, #1e1e1e); border-radius: 14px 14px 0 0; width: 100%; max-width: 720px; max-height: 88vh; overflow-y: auto; padding: 1rem 1.1rem 2rem; }
    .pm-modal-head { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; }
    .pm-modal-id { font-weight: 700; color: var(--primary-text); }
    .pm-x { margin-left: auto; background: none; border: none; color: var(--secondary-text, #888); font-size: 1.1rem; cursor: pointer; }
    .pm-modal-title { font-size: 1.1rem; font-weight: 700; color: var(--primary-text); margin: 0 0 0.5rem; }
    .pm-long { white-space: pre-wrap; color: var(--primary-text); font-size: 0.9rem; margin: 0 0 0.8rem; }
    .pm-facts { display: grid; grid-template-columns: auto 1fr; gap: 0.2rem 0.8rem; margin: 0 0 1rem; }
    .pm-facts dt { font-size: 0.75rem; font-weight: 700; color: var(--secondary-text, #888); }
    .pm-facts dd { margin: 0; font-size: 0.88rem; color: var(--primary-text); }
    .pm-soon { font-size: 0.8rem; font-style: italic; color: var(--secondary-text, #888); }
  `]
})
export class MaximoPmPageComponent implements OnInit {
  private api = inject(MaximoApiService);
  private sync = inject(MaximoSyncService);
  private router = inject(Router);
  pending = this.sync.pendingCount;

  mode = signal<'leads' | 'mine'>('leads');
  bucket = signal<Bucket>('overdue');
  ov = signal<MaximoOverview | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  detail = signal<MaximoWorkOrder | null>(null);

  list = computed<MaximoWorkOrder[]>(() => {
    const o = this.ov();
    if (!o) return [];
    switch (this.bucket()) {
      case 'overdue': return o.overdue ?? [];
      case 'due': return o.dueThisWeek ?? [];
      case 'upcoming': return o.upcoming ?? [];
      case 'done': return o.completedThisWeek ?? [];
    }
  });

  ngOnInit(): void { this.load(); }

  setMode(m: 'leads' | 'mine'): void { if (m === this.mode()) return; this.mode.set(m); this.load(); }

  load(): void {
    this.loading.set(true); this.error.set(null);
    this.api.getOverview(this.mode()).subscribe({
      next: o => { this.ov.set(o); this.loading.set(false); },
      error: e => { this.error.set(e?.error?.message || e?.message || 'Could not reach Maximo.'); this.loading.set(false); }
    });
  }

  chip(status: string | undefined): string { return statusClass(status); }
  dateOf(w: MaximoWorkOrder): string { return this.bucket() === 'done' ? (w.statusDate || w.targetStart) : (w.targetStart || w.reportdate); }
  goGrabbed(): void { this.router.navigate(['/maximo/grabbed']); }
  back(): void { this.router.navigate(['/maximo']); }
}
