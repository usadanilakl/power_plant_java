import { Injectable, inject } from '@angular/core';
import { ContextMenuService } from '../../../../shared/menu/context-menu/context-menu.service';
import { ContextMenuAction } from '../../../../shared/menu/context-menu/context-menu.component';
import { BradyPrinterModalService } from '../../../../shared/brady-printer-manager/brady-printer-modal.service';
import { RfInventoryApiService } from './rf-inventory-api.service';
import { RfInventoryStateService } from './rf-inventory-state.service';

@Injectable({ providedIn: 'root' })
export class RfInventoryContextMenuService extends ContextMenuService {
  private inventoryApi = inject(RfInventoryApiService);
  private inventoryState = inject(RfInventoryStateService);
  private bradyModal = inject(BradyPrinterModalService);

  override contextMenuActions: ContextMenuAction[] = [
    { id: 'view', label: 'View Details', icon: '👁️', action: (item) => this.handleViewDetails(item) },
    { id: 'edit', label: 'Edit', icon: '✏️', action: (item) => this.handleEdit(item) },
    { id: 'print', label: 'Print Label (QR)', icon: '🖨️', action: (item) => this.handlePrint(item) },
    { id: 'divider1', label: '', divider: true, action: () => {} },
    { id: 'available', label: 'Mark Available', icon: '✓', action: (item) => this.changeStatus(item, 'Available') },
    { id: 'checked-out', label: 'Mark Checked Out', icon: '📤', action: (item) => this.changeStatus(item, 'Checked Out') },
    { id: 'missing', label: 'Mark Missing', icon: '❓', action: (item) => this.changeStatus(item, 'Missing') },
    { id: 'retired', label: 'Mark Retired', icon: '⏸', action: (item) => this.changeStatus(item, 'Retired') },
    { id: 'divider2', label: '', divider: true, action: () => {} },
    { id: 'sync-check', label: 'Check Sync Status', icon: '🔄', action: (item) => this.handleSyncCheck(item) },
    { id: 'delete', label: 'Delete', icon: '🗑️', action: (item) => this.handleDelete(item) },
  ];

  override handleViewDetails(item: any): void {
    this.closeContextMenu();
    this.inventoryState.openDetail(item);
  }

  override handleEdit(item: any): void {
    this.closeContextMenu();
    this.inventoryState.selectedItem.set(item);
    this.inventoryState.isFormOpen.set(true);
  }

  handlePrint(item: any): void {
    this.closeContextMenu();
    if (!item) return;
    this.bradyModal.openWithData({
      line1: item.serialNumber || item.title || '',
      line2: [item.manufacturer, item.model].filter(Boolean).join(' '),
      withQr: true,
      qrData: item.qrToken ? `https://jacksongeneration.github.io/permits/inventory/form?scan=${item.qrToken}` : undefined,
    });
  }

  private changeStatus(item: any, status: string): void {
    if (!item?.id) return;
    this.closeContextMenu();
    this.inventoryApi.changeStatus(item.id, status).subscribe({
      next: () => this.inventoryState.loadAll(),
      error: err => console.warn('[Inventory] Status change failed:', err.message)
    });
  }

  override handleDelete(item: any): void {
    if (!item?.id) return;
    if (!confirm(`Delete "${item.title}"?`)) return;
    this.closeContextMenu();
    this.inventoryApi.delete(item.id).subscribe({
      error: err => console.warn('[Inventory] Delete failed:', err.message)
    });
  }
}
