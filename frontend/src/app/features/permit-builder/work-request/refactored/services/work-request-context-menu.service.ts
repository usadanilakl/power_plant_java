import { inject, Injectable } from '@angular/core';
import { ContextMenuService } from '../../../../../shared/menu/context-menu/context-menu.service';
import { ContextMenuAction } from '../../../../../shared/menu/context-menu/context-menu.component';
import { WorkRequestDto } from '../../../../../models/permits/work-request.model';
import { RfWorkRequestStateService } from './rf-work-request-state.service';

@Injectable({
  providedIn: 'root',
})
export class WorkRequestContextMenuService extends ContextMenuService {
  private stateService = inject(RfWorkRequestStateService);

  constructor() {
    super();
    this.contextMenuActions = this.buildContextMenuActions();
  }

  private buildContextMenuActions(): ContextMenuAction[] {
    return [
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
        id: 'view',
        label: 'View Details',
        icon: '👁️',
        action: (item) => this.handleViewDetails(item),
      },
    ];
  }

  private handleRequestMoreDetails(item: WorkRequestDto): void {
    if (!item.id) {
      console.warn('Cannot request details: No ID provided');
      return;
    }

    const message = prompt('Optional: Add details about what information is needed');
    if (message !== null) {
      // User didn't cancel prompt
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

  override handleViewDetails(item: WorkRequestDto): void {
    if (item?.id) {
      // Trigger view/edit - this can be overridden based on your view strategy
      console.log('[WorkRequest] View details for:', item);
      // You can emit an event or navigate to a detail page here
      this.closeContextMenu();
    }
  }
}
