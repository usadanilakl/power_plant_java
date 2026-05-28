import { Injectable, inject } from '@angular/core';
import { ContextMenuService } from '../../../../shared/menu/context-menu/context-menu.service';
import { ContextMenuAction } from '../../../../shared/menu/context-menu/context-menu.component';
import { RfSdsApiService } from './rf-sds-api.service';
import { RfSdsStateService } from './rf-sds-state.service';

@Injectable({ providedIn: 'root' })
export class RfSdsContextMenuService extends ContextMenuService {
  private sdsApi = inject(RfSdsApiService);
  private sdsState = inject(RfSdsStateService);

  override contextMenuActions: ContextMenuAction[] = [
    { id: 'view', label: 'View Details', icon: '👁️', action: (item) => this.handleViewDetails(item) },
    { id: 'edit', label: 'Edit', icon: '✏️', action: (item) => this.handleEdit(item) },
    { id: 'divider1', label: '', divider: true, action: () => {} },
    { id: 'pending', label: 'Mark Pending', icon: '🕒', action: (item) => this.changeStatus(item, 'Pending') },
    { id: 'filed', label: 'Mark Filed', icon: '✓', action: (item) => this.changeStatus(item, 'Filed') },
    { id: 'removed', label: 'Mark Removed', icon: '⏸', action: (item) => this.changeStatus(item, 'Removed') },
    { id: 'divider2', label: '', divider: true, action: () => {} },
    { id: 'delete', label: 'Delete', icon: '🗑️', action: (item) => this.handleDelete(item) },
  ];

  override handleViewDetails(item: any): void {
    this.closeContextMenu();
    this.sdsState.openDetail(item);
  }

  override handleEdit(item: any): void {
    this.closeContextMenu();
    this.sdsState.openProcessForm(item);
  }

  private changeStatus(item: any, status: string): void {
    if (!item?.id) return;
    this.closeContextMenu();
    this.sdsApi.changeStatus(item.id, status).subscribe({
      next: () => this.sdsState.loadAll(),
      error: err => console.warn('[SDS] Status change failed:', err.message)
    });
  }

  override handleDelete(item: any): void {
    if (!item?.id) return;
    if (!confirm(`Delete "${item.primaryName || 'this SDS'}"?`)) return;
    this.closeContextMenu();
    this.sdsApi.delete(item.id).subscribe({
      error: err => console.warn('[SDS] Delete failed:', err.message)
    });
  }
}
