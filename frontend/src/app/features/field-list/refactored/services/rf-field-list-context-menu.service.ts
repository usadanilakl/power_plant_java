import { Injectable, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { ContextMenuService } from '../../../../shared/menu/context-menu/context-menu.service';
import { ContextMenuAction } from '../../../../shared/menu/context-menu/context-menu.component';
import { RfFieldListApiService } from './rf-field-list-api.service';
import { RfFieldListStateService } from './rf-field-list-state.service';

@Injectable({ providedIn: 'root' })
export class RfFieldListContextMenuService extends ContextMenuService {
  private fieldListApi = inject(RfFieldListApiService);
  private fieldListState = inject(RfFieldListStateService);

  // Events the page subscribes to
  viewDetails$ = new Subject<any>();
  editItem$ = new Subject<any>();

  override contextMenuActions: ContextMenuAction[] = [
    {
      id: 'view',
      label: 'View Details',
      icon: '👁️',
      action: (item) => this.handleViewDetails(item),
    },
    {
      id: 'edit',
      label: 'Edit',
      icon: '✏️',
      action: (item) => this.handleEdit(item),
    },
    {
      id: 'divider1',
      label: '',
      divider: true,
      action: () => {},
    },
    {
      id: 'close-item',
      label: 'Close Item',
      icon: '✓',
      action: (item) => this.changeStatus(item, 'Closed'),
    },
    {
      id: 'reopen',
      label: 'Reopen',
      icon: '↩',
      action: (item) => this.changeStatus(item, 'Open'),
    },
    {
      id: 'in-progress',
      label: 'Mark In Progress',
      icon: '⏳',
      action: (item) => this.changeStatus(item, 'In Progress'),
    },
    {
      id: 'resolved',
      label: 'Mark Resolved',
      icon: '✔',
      action: (item) => this.changeStatus(item, 'Resolved'),
    },
    {
      id: 'divider2',
      label: '',
      divider: true,
      action: () => {},
    },
    {
      id: 'sync-check',
      label: 'Check Sync Status',
      icon: '🔄',
      action: (item) => this.handleSyncCheck(item),
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: '🗑️',
      action: (item) => this.handleDelete(item),
    },
  ];

  override handleViewDetails(item: any): void {
    this.closeContextMenu();
    this.viewDetails$.next(item);
  }

  override handleEdit(item: any): void {
    this.closeContextMenu();
    this.editItem$.next(item);
  }

  private changeStatus(item: any, status: string): void {
    if (!item?.id) return;
    this.closeContextMenu();
    this.fieldListApi.changeStatus(item.id, status).subscribe({
      next: () => this.fieldListState.loadAll(),
      error: err => console.warn('[FieldList] Status change failed:', err.message)
    });
  }

  override handleDelete(item: any): void {
    if (!item?.id) return;
    if (!confirm(`Delete "${item.title}"?`)) return;
    this.closeContextMenu();
    this.fieldListApi.delete(item.id).subscribe({
      error: err => console.warn('[FieldList] Delete failed:', err.message)
    });
  }
}
