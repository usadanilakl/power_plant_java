import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MainLayoutComponent } from '../../../../layout/refactored/main-layout.component';
import { RouterMenuComponent } from '../../../../shared/menu/router-menu/router-menu.component';
import { RfInventoryApiService } from '../services/rf-inventory-api.service';
import { RfInventoryStateService } from '../services/rf-inventory-state.service';
import { InventoryItemDto } from '../../../../models/inventory/inventory-item.model';

@Component({
  selector: 'app-rf-inventory-audit',
  standalone: true,
  imports: [CommonModule, MainLayoutComponent, RouterMenuComponent],
  template: `
    <app-main-layout>
      <ng-container header>
        <app-router-menu [layout]="'row'"></app-router-menu>
      </ng-container>
      <ng-container main-content>
        <div class="content-area">
          <div class="toolbar">
            <h2>Inventory Audit</h2>
            <div class="actions">
              <label class="days-filter">
                Overdue threshold:
                <select [value]="thresholdDays()" (change)="onThresholdChange($event)">
                  <option [value]="7">7 days</option>
                  <option [value]="14">14 days</option>
                  <option [value]="30">30 days</option>
                  <option [value]="60">60 days</option>
                  <option [value]="90">90 days</option>
                </select>
              </label>
              <button class="btn-action" (click)="loadAll()">Refresh</button>
              <button class="btn-action" (click)="goToInventory()">Back to Inventory</button>
            </div>
          </div>

          <div class="dashboard">
            <!-- Overdue -->
            <section class="audit-card overdue">
              <div class="card-header">
                <span class="card-icon">&#x23F1;</span>
                <h3>Overdue ({{ thresholdDays() }}+ days out)</h3>
                <span class="count-badge">{{ overdue().length }}</span>
              </div>
              @if (loading()) {
                <div class="loading">Loading...</div>
              } @else if (overdue().length === 0) {
                <div class="empty">No overdue items</div>
              } @else {
                <div class="audit-list">
                  @for (item of overdue(); track item.id) {
                    <button class="audit-row" (click)="openDetail(item)">
                      <div class="row-main">
                        <span class="row-title">{{ item.title }}</span>
                        <span class="row-sub">{{ item.serialNumber }}</span>
                      </div>
                      <div class="row-meta">
                        <span class="holder">{{ item.currentHolderName || 'Unknown' }}</span>
                        <span class="days">{{ daysOut(item) }}d out</span>
                      </div>
                    </button>
                  }
                </div>
              }
            </section>

            <!-- Missing -->
            <section class="audit-card missing">
              <div class="card-header">
                <span class="card-icon">&#x2753;</span>
                <h3>Missing</h3>
                <span class="count-badge">{{ missing().length }}</span>
              </div>
              @if (loading()) {
                <div class="loading">Loading...</div>
              } @else if (missing().length === 0) {
                <div class="empty">No missing items</div>
              } @else {
                <div class="audit-list">
                  @for (item of missing(); track item.id) {
                    <button class="audit-row" (click)="openDetail(item)">
                      <div class="row-main">
                        <span class="row-title">{{ item.title }}</span>
                        <span class="row-sub">{{ item.serialNumber }}</span>
                      </div>
                      <div class="row-meta">
                        <span class="holder">Last: {{ item.currentLocation || '—' }}</span>
                      </div>
                    </button>
                  }
                </div>
              }
            </section>

            <!-- Most used -->
            <section class="audit-card most-used">
              <div class="card-header">
                <span class="card-icon">&#x1F525;</span>
                <h3>Most Used</h3>
                <span class="count-badge">{{ mostUsed().length }}</span>
              </div>
              @if (loading()) {
                <div class="loading">Loading...</div>
              } @else if (mostUsed().length === 0) {
                <div class="empty">No usage recorded yet</div>
              } @else {
                <div class="audit-list">
                  @for (item of mostUsed(); track item.id) {
                    <button class="audit-row" (click)="openDetail(item)">
                      <div class="row-main">
                        <span class="row-title">{{ item.title }}</span>
                        <span class="row-sub">{{ item.itemTypeName }}</span>
                      </div>
                      <div class="row-meta">
                        <span class="uses">{{ item.usageCount }} uses</span>
                      </div>
                    </button>
                  }
                </div>
              }
            </section>
          </div>
        </div>
      </ng-container>
    </app-main-layout>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
    .content-area { display: flex; flex-direction: column; flex: 1; min-height: 0; height: 100%;
      overflow: hidden; padding: 0; }
    .toolbar { display: flex; justify-content: space-between; align-items: center; gap: 8px;
      flex-shrink: 0; margin-bottom: 0.5rem; }
    .toolbar h2 { margin: 0; font-size: 1.1rem; color: var(--primary-text); }
    .actions { display: flex; gap: 8px; align-items: center; }
    .days-filter { font-size: 13px; color: var(--secondary-text); display: flex; gap: 6px; align-items: center; }
    .days-filter select { padding: 4px 8px; border: 1px solid var(--border-color); border-radius: 4px;
      background: var(--card-background); color: var(--primary-text); font-size: 13px; }
    .btn-action { padding: 6px 14px; border: 1px solid var(--border-color); border-radius: 4px;
      background: var(--card-background); color: var(--primary-text); cursor: pointer; font-size: 13px; }
    .btn-action:hover { background: var(--hover-background); }
    .dashboard { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 16px; flex: 1; min-height: 0; overflow-y: auto; padding-bottom: 16px; }
    .audit-card { border: 1px solid var(--border-color); border-radius: 8px;
      background: var(--card-background); display: flex; flex-direction: column; }
    .audit-card.overdue { border-top: 3px solid #f57f17; }
    .audit-card.missing { border-top: 3px solid #c62828; }
    .audit-card.most-used { border-top: 3px solid #1976d2; }
    .card-header { display: flex; align-items: center; gap: 8px; padding: 12px 16px;
      border-bottom: 1px solid var(--border-color); }
    .card-icon { font-size: 18px; }
    .card-header h3 { margin: 0; font-size: 14px; flex: 1; color: var(--primary-text); }
    .count-badge { background: var(--secondary-background); color: var(--secondary-text);
      font-size: 12px; font-weight: 600; padding: 2px 10px; border-radius: 10px; }
    .loading, .empty { padding: 24px; text-align: center; color: var(--secondary-text); font-size: 13px; }
    .audit-list { display: flex; flex-direction: column; }
    .audit-row { display: flex; align-items: center; justify-content: space-between; gap: 12px;
      padding: 10px 16px; border: none; border-bottom: 1px solid var(--border-color);
      background: var(--card-background); cursor: pointer; font-family: inherit; text-align: left; }
    .audit-row:hover { background: var(--hover-background, rgba(0,0,0,0.04)); }
    .audit-row:last-child { border-bottom: none; }
    .row-main { display: flex; flex-direction: column; min-width: 0; }
    .row-title { font-size: 14px; font-weight: 500; color: var(--primary-text);
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .row-sub { font-size: 12px; color: var(--secondary-text); }
    .row-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; white-space: nowrap; }
    .holder { font-size: 12px; color: var(--secondary-text); }
    .days { font-size: 12px; font-weight: 600; color: #f57f17; }
    .uses { font-size: 13px; font-weight: 600; color: #1976d2; }
  `]
})
export class RfInventoryAuditComponent implements OnInit {
  private apiService = inject(RfInventoryApiService);
  private stateService = inject(RfInventoryStateService);
  private router = inject(Router);

  thresholdDays = signal(30);
  loading = signal(false);

  overdue = signal<InventoryItemDto[]>([]);
  missing = signal<InventoryItemDto[]>([]);
  private allItems = signal<InventoryItemDto[]>([]);

  mostUsed = computed(() =>
    [...this.allItems()]
      .filter(i => i.usageCount > 0)
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 15)
  );

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loading.set(true);
    let pending = 3;
    const done = () => { if (--pending === 0) this.loading.set(false); };

    this.apiService.getCheckedOut(this.thresholdDays()).subscribe({
      next: res => { this.overdue.set((res.responseData || []).map((i: any) => InventoryItemDto.fromJson(i))); done(); },
      error: () => { this.overdue.set([]); done(); }
    });
    this.apiService.getMissing().subscribe({
      next: res => { this.missing.set((res.responseData || []).map((i: any) => InventoryItemDto.fromJson(i))); done(); },
      error: () => { this.missing.set([]); done(); }
    });
    this.apiService.getAll().subscribe({
      next: res => { this.allItems.set((res.responseData || []).map((i: any) => InventoryItemDto.fromJson(i))); done(); },
      error: () => { this.allItems.set([]); done(); }
    });
  }

  onThresholdChange(event: Event): void {
    this.thresholdDays.set(Number((event.target as HTMLSelectElement).value));
    this.loadAll();
  }

  daysOut(item: InventoryItemDto): number {
    if (!item.lastCheckedOutAt) return 0;
    const out = new Date(item.lastCheckedOutAt).getTime();
    if (isNaN(out)) return 0;
    return Math.floor((Date.now() - out) / 86400000);
  }

  openDetail(item: InventoryItemDto): void {
    this.stateService.openDetail(item);
    this.router.navigate(['/inventory']);
  }

  goToInventory(): void {
    this.router.navigate(['/inventory']);
  }
}
