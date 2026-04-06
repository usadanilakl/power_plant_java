import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom, map } from 'rxjs';
import { RfFieldListStateService } from '../services/rf-field-list-state.service';
import { RfFieldListTableComponent } from '../rf-field-list-table/rf-field-list-table.component';
import { RfFieldListFormComponent } from '../rf-field-list-form/rf-field-list-form.component';
import { RfFieldListDetailDialogComponent } from '../rf-field-list-detail-dialog/rf-field-list-detail-dialog.component';
import { RfPopupProjectionComponent } from '../../../../shared/popup-projection/rf-popup-projection.component';
import { SpSyncToolbarComponent } from '../../../../shared/sp-sync-toolbar/sp-sync-toolbar.component';
import { MainLayoutComponent } from '../../../../layout/refactored/main-layout.component';
import { RouterMenuComponent } from '../../../../shared/menu/router-menu/router-menu.component';
import { FieldListItemDto } from '../../../../models/field-list/field-list-item.model';
import { RfFieldListApiService } from '../services/rf-field-list-api.service';
import { RfFieldListContextMenuService } from '../services/rf-field-list-context-menu.service';

@Component({
  selector: 'app-rf-field-list-page',
  standalone: true,
  imports: [
    MainLayoutComponent,
    RouterMenuComponent,
    RfFieldListTableComponent,
    RfFieldListFormComponent,
    RfFieldListDetailDialogComponent,
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
              <button [class.active]="!stateService.selectedListType()"
                      (click)="onListTypeChange(null)">All</button>
              <button [class.active]="stateService.selectedListType() === 'Insulation Removal'"
                      (click)="onListTypeChange('Insulation Removal')">Insulation Removal</button>
              <button [class.active]="stateService.selectedListType() === 'Leaks'"
                      (click)="onListTypeChange('Leaks')">Leaks</button>
              <button [class.active]="stateService.selectedListType() === 'Winterization'"
                      (click)="onListTypeChange('Winterization')">Winterization</button>
            </div>
            <div class="actions">
              <button class="btn-action" (click)="onPrint()">Print</button>
              <button class="btn-action btn-new" (click)="onNew()">+ New Item</button>
            </div>
          </div>

          <app-sp-sync-toolbar
            [entityType]="'FieldListItem'"
            [entityIds]="displayedIds()"
            (syncComplete)="onSyncComplete()">
          </app-sp-sync-toolbar>

          <app-rf-field-list-table
            (selectedItemsEvent)="onSelectedItems($event)">
          </app-rf-field-list-table>

          @if (stateService.isFormOpen()) {
            <app-rf-popup-projection (close)="stateService.isFormOpen.set(false)">
              <app-rf-field-list-form></app-rf-field-list-form>
            </app-rf-popup-projection>
          }

          @if (isDetailOpen()) {
            <app-rf-field-list-detail-dialog
              [item]="detailItem()!"
              (close)="isDetailOpen.set(false)"
              (edit)="onEditFromDetail($event)"
              (deleted)="isDetailOpen.set(false)">
            </app-rf-field-list-detail-dialog>
          }
        </div>
      </ng-container>
    </app-main-layout>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
    .content-area {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      height: 100%;
      overflow: hidden;
    }
    .toolbar { display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-shrink: 0;
      margin-bottom: 0.5rem; }
    .list-type-tabs { display: flex; gap: 4px; flex-wrap: wrap; }
    .list-type-tabs button { padding: 6px 12px; border: 1px solid var(--border-color); border-radius: 4px;
      background: var(--card-background); color: var(--primary-text); cursor: pointer; font-size: 13px; }
    .list-type-tabs button.active { background: var(--accent-color); color: var(--header-text); border-color: var(--accent-color); }
    .list-type-tabs button:hover:not(.active) { background: var(--hover-background); }
    .actions { display: flex; gap: 4px; }
    .btn-action { padding: 6px 16px; border: 1px solid var(--border-color); border-radius: 4px;
      background: var(--card-background); color: var(--primary-text); cursor: pointer; font-size: 13px; }
    .btn-action:hover { background: var(--hover-background); }
    .btn-new { background: var(--accent-color); color: var(--header-text); border-color: var(--accent-color); }
    .btn-new:hover { opacity: 0.9; }
    app-rf-field-list-table {
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
      min-height: 0;
      overflow: hidden;
    }
  `]
})
export class RfFieldListPageComponent implements OnInit {
  stateService = inject(RfFieldListStateService);
  private apiService = inject(RfFieldListApiService);
  private contextMenuService = inject(RfFieldListContextMenuService);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  isDetailOpen = signal(false);
  detailItem = signal<FieldListItemDto | null>(null);

  displayedIds = toSignal(
    this.stateService.allItems$.pipe(
      map(items => items.map(i => i.id).filter((id): id is number => id != null))
    ),
    { initialValue: [] as number[] }
  );

  ngOnInit(): void {
    const listType = this.route.snapshot.paramMap.get('listType');
    if (listType) {
      this.stateService.loadByListType(decodeURIComponent(listType));
    } else {
      this.stateService.loadAll();
    }

    // Subscribe to context menu / double-click events
    this.contextMenuService.viewDetails$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(item => this.onRowDoubleClicked(item));

    this.contextMenuService.editItem$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(item => this.onEditFromDetail(item));
  }

  onListTypeChange(listType: string | null): void {
    this.stateService.loadByListType(listType);
  }

  onRowDoubleClicked(item: FieldListItemDto): void {
    this.detailItem.set(item);
    this.isDetailOpen.set(true);
  }

  onSelectedItems(items: FieldListItemDto[]): void {
    this.stateService.selectedItems.set(items);
    if (items.length === 1) {
      this.stateService.selectedItem.set(items[0]);
    }
  }

  onNew(): void {
    this.stateService.openNewForm();
  }

  onEditFromDetail(item: FieldListItemDto): void {
    this.isDetailOpen.set(false);
    this.stateService.selectedItem.set(item);
    this.stateService.isFormOpen.set(true);
  }

  onSyncComplete(): void {
    this.stateService.loadAll();
  }

  async onPrint(): Promise<void> {
    let items: FieldListItemDto[] = [];
    this.stateService.allItems$.subscribe(i => items = i).unsubscribe();
    if (items.length === 0) return;

    // Load attachments for all items
    const attachmentResults = await Promise.all(
      items.map(item =>
        item.id
          ? firstValueFrom(this.apiService.getAttachments(item.id)).catch(() => ({ responseData: [] as any[] }))
          : Promise.resolve({ responseData: [] as any[] })
      )
    );

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const listType = this.stateService.selectedListType() || 'All';
    const dateStr = new Date().toLocaleDateString();

    let html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
      <title>Field Lists - ${listType}</title>
      <style>
        * { box-sizing: border-box; }
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
        h1 { font-size: 18px; margin-bottom: 4px; }
        .print-date { font-size: 12px; color: #888; margin-bottom: 16px; }
        .item { border: 1px solid #ccc; border-radius: 8px; padding: 16px; margin-bottom: 20px; page-break-inside: avoid; }
        .item-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .item-type { font-weight: bold; color: #1976d2; text-transform: uppercase; font-size: 11px;
          padding: 3px 10px; border-radius: 4px; background: #e3f2fd; }
        .item-status { font-size: 11px; padding: 3px 10px; border-radius: 10px; background: #e0e0e0; }
        .item-title { font-size: 16px; font-weight: 600; margin-bottom: 10px; }
        .item-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 24px; margin-bottom: 8px; }
        .item-field { font-size: 13px; }
        .item-field strong { color: #555; display: inline-block; min-width: 80px; }
        .item-notes { background: #f5f5f5; padding: 10px 12px; border-radius: 4px; margin-top: 10px;
          white-space: pre-wrap; font-size: 13px; border-left: 3px solid #1976d2; }
        .item-images { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 12px; }
        .item-images img { max-width: 280px; max-height: 210px; border-radius: 4px; border: 1px solid #ddd; }
        .no-print-btn { position: fixed; top: 10px; right: 10px; padding: 8px 20px; background: #1976d2;
          color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; z-index: 100; }
        .no-print-btn:hover { background: #1565c0; }
        @media print {
          .item { break-inside: avoid; }
          .no-print-btn { display: none; }
          .item-images img { max-width: 240px; max-height: 180px; }
        }
      </style></head><body>
      <button class="no-print-btn" onclick="window.print()">Print</button>
      <h1>Field Lists — ${this.escapeHtml(listType)} (${items.length} items)</h1>
      <div class="print-date">Printed: ${dateStr}</div>`;

    items.forEach((item: FieldListItemDto, i: number) => {
      const attachments = (attachmentResults[i] as any)?.responseData || [];
      const images = attachments.filter((a: any) => a.contentType?.startsWith('image/'));

      html += `<div class="item">
        <div class="item-header">
          <span class="item-type">${this.escapeHtml(item.listTypeName)}</span>
          <span class="item-status">${this.escapeHtml(item.statusName)}</span>
        </div>
        <div class="item-title">${this.escapeHtml(item.title)}</div>
        <div class="item-fields">
          <div class="item-field"><strong>Date:</strong> ${this.escapeHtml(item.dateObserved)} ${this.escapeHtml(item.timeObserved || '')}</div>
          <div class="item-field"><strong>Location:</strong> ${this.escapeHtml(item.locationName)} ${item.specificLocation ? '— ' + this.escapeHtml(item.specificLocation) : ''}</div>
          <div class="item-field"><strong>Equipment:</strong> ${this.escapeHtml(item.equipmentTag || '—')}</div>
          <div class="item-field"><strong>Submitter:</strong> ${this.escapeHtml(item.submitterName || item.createdBy || '—')}</div>
        </div>`;

      if (item.notes) {
        html += `<div class="item-notes">${this.escapeHtml(item.notes)}</div>`;
      }

      if (images.length > 0) {
        html += `<div class="item-images">`;
        images.forEach((img: any) => {
          const src = img.base64Content?.startsWith('data:') ? img.base64Content : `data:${img.contentType};base64,${img.base64Content}`;
          html += `<img src="${src}" alt="${this.escapeHtml(img.fileName)}">`;
        });
        html += `</div>`;
      }

      html += `</div>`;
    });

    html += `</body></html>`;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => printWindow.print();
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
