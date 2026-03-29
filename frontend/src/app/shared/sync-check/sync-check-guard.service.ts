import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, of, switchMap } from 'rxjs';
import { EntitySyncCheckService } from '../../services/sync/entity-sync-check.service';
import { SyncCheckDialogComponent, SyncCheckDialogData } from './sync-check-dialog.component';

/**
 * Pre-operation sync check guard.
 * Checks if an entity is in sync before a critical operation.
 * If out of sync, shows a warning dialog with Pull/Push + Continue Anyway / Cancel.
 */
@Injectable({ providedIn: 'root' })
export class SyncCheckGuardService {
  private dialog = inject(MatDialog);
  private syncCheckService = inject(EntitySyncCheckService);

  /**
   * Check sync status before performing an action.
   * @returns Observable<boolean> — true to proceed, false to cancel.
   * If entity is in sync, returns true immediately (no dialog).
   * If out of sync, shows warning dialog and returns user's choice.
   */
  confirmSyncBeforeAction(entityType: string, entityId: number, actionLabel: string): Observable<boolean> {
    return this.syncCheckService.checkEntity(entityType, entityId).pipe(
      switchMap(status => {
        if (status.status === 'IN_SYNC') {
          return of(true); // In sync — proceed without dialog
        }

        // Out of sync — show warning dialog
        const dialogRef = this.dialog.open(SyncCheckDialogComponent, {
          data: {
            entityType,
            entityId,
            actionLabel
          } as SyncCheckDialogData,
          width: '480px',
          disableClose: false
        });

        return dialogRef.afterClosed().pipe(
          switchMap(result => of(result === true))
        );
      })
    );
  }

  /**
   * Open sync check dialog without a guard context (just informational).
   */
  openSyncCheckDialog(entityType: string, entityId: number): void {
    this.dialog.open(SyncCheckDialogComponent, {
      data: { entityType, entityId } as SyncCheckDialogData,
      width: '480px'
    });
  }
}
