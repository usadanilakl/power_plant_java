import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MainLayoutComponent } from '../../layouts/main-layout/main-layout.component';
import { MaximoOfflineStore } from './maximo-offline.service';
import { MaximoSyncService } from './maximo-sync.service';
import { MaximoGrab, MaximoWorkOrder, statusClass } from './maximo.model';
import { MaximoWoDetailComponent } from './maximo-wo-detail.component';

/**
 * Grabbed PMs held on this device — reopenable with no signal to perform, and a view of what's queued to submit
 * on reconnect. Grabbing marks the WO in-progress on the server; a completed grab is removed automatically.
 */
@Component({
  selector: 'app-maximo-grabbed-page',
  standalone: true,
  imports: [MainLayoutComponent, MaximoWoDetailComponent],
  template: `
    <app-main-layout [header]="'Grabbed PMs'">
      <ng-container main-content>
        <div class="gb-container">
          <button class="gb-back" (click)="back()">← Maximo</button>

          @if (pending() > 0) {
            <div class="gb-pending">⏳ {{ pending() }} completion{{ pending() === 1 ? '' : 's' }} queued — will submit when you reconnect.</div>
          }

          @if (grabs().length === 0) {
            <p class="gb-msg">Nothing grabbed. Open a PM and tap <b>⚡ Grab for offline</b> to work it with no signal.</p>
          } @else {
            <div class="gb-list">
              @for (g of grabs(); track g.wo.wonum) {
                <button class="gb-item" (click)="open(g)">
                  <div class="gb-top">
                    <span class="gb-id">{{ g.wo.wonum }}</span>
                    <span class="gb-badge" [class]="badgeClass(g)">{{ badge(g) }}</span>
                  </div>
                  <div class="gb-desc">{{ g.wo.description || '(no description)' }}</div>
                  <div class="gb-meta">
                    @if (g.wo.assetnum || g.wo.location) { <span>{{ g.wo.assetnum || g.wo.location }}</span> }
                    <span>📋 {{ formLabel(g) }}</span>
                  </div>
                </button>
              }
            </div>
          }
        </div>

        @if (detail(); as w) {
          <app-maximo-wo-detail [wo]="w" (close)="onClose()" (completed)="reload()"></app-maximo-wo-detail>
        }
      </ng-container>
    </app-main-layout>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; }
    .gb-container { padding: 0.85rem; max-width: 720px; margin: 0 auto; width: 100%; box-sizing: border-box; }
    .gb-back { background: none; border: none; color: var(--accent-color); font-size: 0.9rem; padding: 0.2rem 0; cursor: pointer; margin-bottom: 0.5rem; }
    .gb-pending { background: rgba(230,126,34,0.15); color: #e67e22; border: 1px solid #e67e22; border-radius: 10px; padding: 0.5rem 0.7rem; font-size: 0.82rem; font-weight: 700; margin-bottom: 0.8rem; }
    .gb-msg { text-align: center; color: var(--secondary-text, #888); padding: 2rem 1rem; }
    .gb-list { display: flex; flex-direction: column; gap: 0.55rem; }
    .gb-item { display: flex; flex-direction: column; gap: 0.25rem; padding: 0.75rem 0.85rem; border: 1px solid var(--border-color); border-radius: 12px; background: var(--card-bg, var(--secondary-background)); cursor: pointer; text-align: left; font-family: inherit; }
    .gb-top { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
    .gb-id { font-weight: 700; color: var(--primary-text); }
    .gb-desc { font-size: 0.9rem; color: var(--primary-text); }
    .gb-meta { display: flex; flex-wrap: wrap; gap: 0.15rem 0.7rem; font-size: 0.78rem; color: var(--secondary-text, #888); }
    .gb-badge { font-size: 0.66rem; font-weight: 700; padding: 0.12rem 0.5rem; border-radius: 999px; color: #fff; white-space: nowrap; }
    .b-queued { background: #e67e22; } .b-failed { background: #e74c3c; } .b-open { background: #2980b9; }
  `]
})
export class MaximoGrabbedPageComponent implements OnInit {
  private store = inject(MaximoOfflineStore);
  private sync = inject(MaximoSyncService);
  private router = inject(Router);

  grabs = signal<MaximoGrab[]>([]);
  detail = signal<MaximoWorkOrder | null>(null);
  pending = this.sync.pendingCount;

  ngOnInit(): void { this.reload(); }

  reload(): void {
    this.grabs.set(this.store.listGrabs());
    this.sync.refreshPendingCount();
  }
  onClose(): void { this.detail.set(null); this.reload(); }
  open(g: MaximoGrab): void { this.detail.set(g.wo); }

  badge(g: MaximoGrab): string {
    const ds = this.store.draftsFor(g.wo.wonum);
    if (ds.some(d => d.status === 'pending')) return 'queued';
    if (ds.some(d => d.status === 'failed')) return 'failed';
    return g.wo.status || 'INPRG';
  }
  badgeClass(g: MaximoGrab): string {
    const ds = this.store.draftsFor(g.wo.wonum);
    if (ds.some(d => d.status === 'pending')) return 'gb-badge b-queued';
    if (ds.some(d => d.status === 'failed')) return 'gb-badge b-failed';
    return 'gb-badge b-open';
  }
  /** Short label of the assigned form(s) for the grabbed-list card. */
  formLabel(g: MaximoGrab): string {
    const fs = g.formTemplates ?? (g.formTemplate ? [g.formTemplate] : []);
    if (fs.length === 0) return 'manual';
    if (fs.length === 1) return fs[0].formName;
    return `${fs.length} forms`;
  }
  chip(s: string | undefined): string { return statusClass(s); }
  back(): void { this.router.navigate(['/maximo']); }
}
