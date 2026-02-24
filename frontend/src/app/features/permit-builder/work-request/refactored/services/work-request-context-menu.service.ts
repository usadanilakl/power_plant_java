import { inject, Injectable } from '@angular/core';
import { ContextMenuService } from '../../../../../shared/menu/context-menu/context-menu.service';
import { ContextMenuAction } from '../../../../../shared/menu/context-menu/context-menu.component';
import { WorkRequestDto } from '../../../../../models/permits/work-request.model';
import { RfWorkRequestStateService } from './rf-work-request-state.service';
import { CorrespondenceDialogService } from '../../../../../shared/correspondence-dialog/correspondence-dialog.service';
import { WrDetailDialogService } from '../../../../../shared/wr-detail-dialog/wr-detail-dialog.service';

@Injectable({
  providedIn: 'root',
})
export class WorkRequestContextMenuService extends ContextMenuService {
  private stateService = inject(RfWorkRequestStateService);
  private correspondenceDialogService = inject(CorrespondenceDialogService);
  private wrDetailDialogService = inject(WrDetailDialogService);

  constructor() {
    super();
    this.contextMenuActions = this.buildContextMenuActions();
  }

  private buildContextMenuActions(): ContextMenuAction[] {
    return [
      {
        id: 'processed',
        label: 'Mark as Processed',
        icon: '✅',
        action: (item) => this.handleMarkAsProcessed(item),
      },
      {
        id: 'request-details',
        label: 'Request More Details',
        icon: '✉️',
        action: (item) => this.handleRequestMoreDetails(item),
      },
      {
        id: 'cancel',
        label: 'Cancel',
        icon: '🚫',
        action: (item) => this.handleCancel(item),
      },
      {
        id: 'divider1',
        label: '',
        divider: true,
        action: () => {},
      },
      {
        id: 'correspondence',
        label: 'View Correspondence',
        icon: '📬',
        action: (item) => this.handleViewCorrespondence(item),
      },
      {
        id: 'view',
        label: 'View Details',
        icon: '👁️',
        action: (item) => this.handleViewDetails(item),
      },
    ];
  }

  private handleMarkAsProcessed(item: WorkRequestDto): void {
    if (!item.id) {
      console.warn('Cannot mark as processed: No ID provided');
      return;
    }
    this.stateService.markAsProcessed(item.id);
    this.closeContextMenu();
  }

  private handleRequestMoreDetails(item: WorkRequestDto): void {
    if (!item.id) {
      console.warn('Cannot request details: No ID provided');
      return;
    }

    const message = prompt('Optional: Add details about what information is needed');
    if (message !== null) {
      this.stateService.requestMoreDetails(item.id, message || undefined);
      this.closeContextMenu();
    }
  }

  private handleCancel(item: WorkRequestDto): void {
    if (!item.id) {
      console.warn('Cannot cancel: No ID provided');
      return;
    }

    const confirmed = confirm(
      `Are you sure you want to cancel this work request?\n\n` +
        `Work Scope: ${item.workScope}\n` +
        `Location: ${item.location}`
    );

    if (confirmed) {
      this.stateService.cancelWorkRequest(item.id);
      this.closeContextMenu();
    }
  }

  private handleViewCorrespondence(item: WorkRequestDto): void {
    if (item?.id) {
      this.correspondenceDialogService.open('WorkRequest', item.id);
      this.closeContextMenu();
    }
  }

  override handleViewDetails(item: WorkRequestDto): void {
    if (item?.id) {
      this.wrDetailDialogService.open(item.id);
      this.closeContextMenu();
    }
  }
}
