import { Component, OnInit, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { RfInventoryStateService } from '../services/rf-inventory-state.service';
import { RfInventoryTableComponent } from '../rf-inventory-table/rf-inventory-table.component';
import { RfInventoryFormComponent } from '../rf-inventory-form/rf-inventory-form.component';
import { RfInventoryDetailDialogComponent } from '../rf-inventory-detail-dialog/rf-inventory-detail-dialog.component';
import { RfPopupProjectionComponent } from '../../../../shared/popup-projection/rf-popup-projection.component';
import { SpSyncToolbarComponent } from '../../../../shared/sp-sync-toolbar/sp-sync-toolbar.component';
import { BradyPrinterModalService } from '../../../../shared/brady-printer-manager/brady-printer-modal.service';
import { MainLayoutComponent } from '../../../../layout/refactored/main-layout.component';
import { RouterMenuComponent } from '../../../../shared/menu/router-menu/router-menu.component';
import { InventoryItemDto } from '../../../../models/inventory/inventory-item.model';

@Component({
  selector: 'app-rf-inventory-page',
  standalone: true,
  imports: [
    MainLayoutComponent,
    RouterMenuComponent,
    RfInventoryTableComponent,
    RfInventoryFormComponent,
    RfInventoryDetailDialogComponent,
    RfPopupProjectionComponent,
    SpSyncToolbarComponent,
  ],
  template: `
    <app-main-layout>
      <ng-container header>
        <app-router-menu [layout]="'row'"></app-router-menu>
      </ng-container>
      <ng-container main-content>
        <div class="content-area">
          <div class="toolbar">
            <div class="list-type-tabs">
              <button [class.active]="!stateService.selectedType()"
                      (click)="onTypeChange(null)">All</button>
              <button [class.active]="stateService.selectedType() === 'Tools'"
                      (click)="onTypeChange('Tools')">Tools</button>
              <button [class.active]="stateService.selectedType() === 'Safety Equipment'"
                      (click)="onTypeChange('Safety Equipment')">Safety</button>
              <button [class.active]="stateService.selectedType() === 'Spare Parts'"
                      (click)="onTypeChange('Spare Parts')">Parts</button>
              <button [class.active]="stateService.selectedType() === 'Test Equipment'"
                      (click)="onTypeChange('Test Equipment')">Test Eq.</button>
            </div>
            <div class="actions">
              <button class="btn-action" (click)="onAudit()">Audit</button>
              <button class="btn-action" (click)="onPrintSelected()" [disabled]="selected().length === 0">
                Print Labels ({{ selected().length }})
              </button>
              <button class="btn-action btn-new" (click)="onNew()">+ New Item</button>
            </div>
          </div>

          <app-sp-sync-toolbar
            [entityType]="'InventoryItem'"
            [entityIds]="displayedIds()"
            (syncComplete)="onSyncComplete()">
          </app-sp-sync-toolbar>

          <app-rf-inventory-table
            (selectedItemsEvent)="onSelectedItems($event)">
          </app-rf-inventory-table>

          @if (stateService.isFormOpen()) {
            <app-rf-popup-projection [isOpen]="true" (close)="stateService.isFormOpen.set(false)">
              <app-rf-inventory-form></app-rf-inventory-form>
            </app-rf-popup-projection>
          }

          @if (stateService.isDetailOpen()) {
            <app-rf-inventory-detail-dialog
              [item]="stateService.detailItem()!"
              (close)="stateService.closeDetail()"
              (edit)="onEditFromDetail($event)"
              (deleted)="stateService.closeDetail()">
            </app-rf-inventory-detail-dialog>
          }
        </div>
      </ng-container>
    </app-main-layout>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
    .content-area { display: flex; flex-direction: column; flex: 1; min-height: 0; height: 100%; overflow: hidden; }
    .toolbar { display: flex; justify-content: space-between; align-items: center; gap: 8px;
      flex-shrink: 0; margin-bottom: 0.5rem; }
    .list-type-tabs { display: flex; gap: 4px; flex-wrap: wrap; }
    .list-type-tabs button { padding: 6px 12px; border: 1px solid var(--border-color); border-radius: 4px;
      background: var(--card-background); color: var(--primary-text); cursor: pointer; font-size: 13px; }
    .list-type-tabs button.active { background: var(--accent-color); color: var(--header-text); border-color: var(--accent-color); }
    .list-type-tabs button:hover:not(.active) { background: var(--hover-background); }
    .actions { display: flex; gap: 4px; }
    .btn-action { padding: 6px 16px; border: 1px solid var(--border-color); border-radius: 4px;
      background: var(--card-background); color: var(--primary-text); cursor: pointer; font-size: 13px; }
    .btn-action:hover:not(:disabled) { background: var(--hover-background); }
    .btn-action:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-new { background: var(--accent-color); color: var(--header-text); border-color: var(--accent-color); }
    .btn-new:hover { opacity: 0.9; }
    app-rf-inventory-table { flex: 1 1 auto; display: flex; flex-direction: column;
      min-height: 0; overflow: hidden; }
  `]
})
export class RfInventoryPageComponent implements OnInit {
  stateService = inject(RfInventoryStateService);
  private bradyModal = inject(BradyPrinterModalService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  private selectedItems: InventoryItemDto[] = [];
  selected = () => this.selectedItems;

  displayedIds = toSignal(
    this.stateService.allItems$.pipe(
      map(items => items.map(i => i.id).filter((id): id is number => id != null))
    ),
    { initialValue: [] as number[] }
  );

  ngOnInit(): void {
    const type = this.route.snapshot.paramMap.get('type');
    if (type) {
      this.stateService.loadByType(decodeURIComponent(type));
    } else {
      this.stateService.loadAll();
    }
  }

  onTypeChange(type: string | null): void { this.stateService.loadByType(type); }

  onSelectedItems(items: InventoryItemDto[]): void {
    this.selectedItems = items;
    this.stateService.selectedItems.set(items);
  }

  onNew(): void { this.stateService.openNewForm(); }

  onEditFromDetail(item: InventoryItemDto): void {
    this.stateService.closeDetail();
    this.stateService.selectedItem.set(item);
    this.stateService.isFormOpen.set(true);
  }

  onSyncComplete(): void { this.stateService.loadAll(); }

  onAudit(): void { this.router.navigate(['/inventory/audit']); }

  onPrintSelected(): void {
    if (this.selectedItems.length === 0) return;
    if (this.selectedItems.length === 1) {
      const i = this.selectedItems[0];
      this.bradyModal.openWithData({
        line1: i.serialNumber || i.title || '',
        line2: [i.manufacturer, i.model].filter(Boolean).join(' '),
        withQr: true,
      });
    } else {
      const queue = this.selectedItems.map(i => ({
        id: String(i.id),
        line1: i.serialNumber || i.title || '',
        line2: [i.manufacturer, i.model].filter(Boolean).join(' '),
        withQr: true,
        status: 'pending' as const,
      }));
      this.bradyModal.openWithQueue(queue);
    }
  }
}
