import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ContextMenuAction } from '../../../../../shared/menu/context-menu/context-menu.component';
import { ContextMenuService } from '../../../../../shared/menu/context-menu/context-menu.service';
import { WorkRequestDto } from '../../../../../models/permits/work-request.model';
import { RfWorkRequestStateService } from './rf-work-request-state.service';
import { CorrespondenceDialogService } from '../../../../../shared/correspondence-dialog/correspondence-dialog.service';
import { WrDetailDialogService } from '../../../../../shared/wr-detail-dialog/wr-detail-dialog.service';
import { ProcessWrDialogService } from '../../../../../shared/process-wr-dialog/process-wr-dialog.service';

@Injectable({
  providedIn: 'root',
})
export class WorkRequestContextMenuService extends ContextMenuService {
  private stateService = inject(RfWorkRequestStateService);
  private correspondenceDialogService = inject(CorrespondenceDialogService);
  private wrDetailDialogService = inject(WrDetailDialogService);
  private processWrDialogService = inject(ProcessWrDialogService);
  private router = inject(Router);

  constructor() {
    super();
    this.contextMenuActions = this.buildContextMenuActions();
  }

  private buildContextMenuActions(): ContextMenuAction[] {
    return [
      {
        id: 'processed',
        label: 'Mark as Processed',
        icon: '✓',
        action: (item) => this.handleMarkAsProcessed(item),
      },
      {
        id: 'active',
        label: 'Mark as Active',
        icon: '↩',
        action: (item) => this.handleMarkAsActive(item),
      },
      {
        id: 'request-details',
        label: 'Request More Details',
        icon: '✉',
        action: (item) => this.handleRequestMoreDetails(item),
      },
      {
        id: 'cancel',
        label: 'Cancel',
        icon: '⛔',
        action: (item) => this.handleCancel(item),
      },
      {
        id: 'process',
        label: 'Process',
        icon: '▶',
        action: (item) => this.handleProcess(item),
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
        icon: '👁',
        action: (item) => this.handleViewDetails(item),
      },
      {
        id: 'divider2',
        label: '',
        divider: true,
        action: () => {},
      },
      {
        id: 'reissue',
        label: 'Reissue',
        icon: '🔄',
        action: (item) => this.handleReissue(item),
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

  private handleMarkAsActive(item: WorkRequestDto): void {
    if (!item.id) {
      console.warn('Cannot mark as active: No ID provided');
      return;
    }
    this.stateService.markAsActive(item.id);
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
    console.log('[Correspondence] handleViewCorrespondence called, item.id:', item?.id);
    if (item?.id) {
      this.correspondenceDialogService.open('WorkRequest', item.id);
      console.log('[Correspondence] dialogService.open() called, isVisible:', this.correspondenceDialogService.isVisible());
      this.closeContextMenu();
    }
  }

  private handleProcess(item: WorkRequestDto): void {
    if (item.id == null) return;
    this.processWrDialogService.open(item.id);
    this.closeContextMenu();
  }

  override handleViewDetails(item: WorkRequestDto): void {
    if (item?.id) {
      this.wrDetailDialogService.open(item.id);
      this.closeContextMenu();
    }
  }

  private handleReissue(item: WorkRequestDto): void {
    if (!item?.id) return;

    let previousDay = '';
    if (item.dateOfWorkToBePerformed) {
      previousDay = this.getPreviousDay(item.dateOfWorkToBePerformed);
    }

    const location = item.location?.trim() || item.workArea?.name?.trim() || '';
    this.router.navigate(['/permit-builder/daily-packages'], {
      queryParams: {
        reissueFromWr: item.id,
        scope: item.workScope || '',
        date: previousDay,
        location,
      }
    });
    this.closeContextMenu();
  }

  private getPreviousDay(rawDate: string): string {
    const trimmed = rawDate?.trim();
    if (!trimmed) {
      return '';
    }

    const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      return this.shiftDate(Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3]));
    }

    const usMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
    if (usMatch) {
      const year = usMatch[3].length === 2 ? 2000 + Number(usMatch[3]) : Number(usMatch[3]);
      return this.shiftDate(year, Number(usMatch[1]), Number(usMatch[2]));
    }

    return '';
  }

  private shiftDate(year: number, month: number, day: number): string {
    const date = new Date(year, month - 1, day);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    date.setDate(date.getDate() - 1);
    const adjustedYear = date.getFullYear();
    const adjustedMonth = `${date.getMonth() + 1}`.padStart(2, '0');
    const adjustedDay = `${date.getDate()}`.padStart(2, '0');
    return `${adjustedYear}-${adjustedMonth}-${adjustedDay}`;
  }
}
