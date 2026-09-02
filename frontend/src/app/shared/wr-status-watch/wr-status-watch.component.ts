import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { GlobalMessageService } from '../global-message/global-message.service';
import { SyncUpdateService } from '../../services/sync/sync-update.service';
import { WrDetailDialogService } from '../wr-detail-dialog/wr-detail-dialog.service';

/**
 * Tells an operator when a requester revokes or edits a work request, wherever they happen to be.
 *
 * <h2>Why this exists</h2>
 *
 * A requester can revoke a request from their phone at any time. Nothing cascades — the package the
 * operator already built stays attached and open, and the permits stay live. That is deliberate
 * (auto-cancelling someone else's permits would be worse), but it means the ONLY signal is a status
 * change on a row, and an operator looking at a LOTO page or the permits monitor never sees it.
 *
 * <p>The lab confirmed the whole chain: revoke sets the status, it propagates to every node in
 * seconds, and the package carries on looking entirely normal.
 *
 * <h2>Why it is mounted at the app root</h2>
 *
 * The work-request state service is `providedIn: 'root'` but is only ever injected by work-request
 * components and the package builder. So the change was already arriving on this machine — there
 * was simply nothing listening unless you were on the right screen. Mounting a template-less
 * component once in `app.component.html` fixes that without touching any feature.
 *
 * <h2>No backend change</h2>
 *
 * `SyncUpdateService` already carries `entity_updated` over SSE with per-entity-type subjects, and
 * `getEntityTypeUpdates$` already filters this tab's own echo — so an operator who did the thing
 * themselves is not told about it. Nothing new is published.
 */
@Component({
  selector: 'app-wr-status-watch',
  standalone: true,
  template: '',
})
export class WrStatusWatchComponent {
  private sync = inject(SyncUpdateService);
  private messages = inject(GlobalMessageService);
  private wrDialog = inject(WrDetailDialogService);
  private destroyRef = inject(DestroyRef);

  /** Statuses that mean the requester acted after submitting. */
  private static readonly WATCHED: Record<string, string> = {
    Revoked: 'withdrew',
    Cancelled: 'cancelled',
    Updated: 'edited',
  };

  /**
   * Ids already announced.
   *
   * <p>A single status change can arrive as more than one field-change event, and SSE is
   * at-most-once with a reconnect replay — without this an operator gets the same popup twice.
   */
  private announced = new Set<string>();

  constructor() {
    this.sync.getEntityTypeUpdates$('WorkRequest')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(event => this.onWorkRequestChanged(event));
  }

  private onWorkRequestChanged(event: any): void {
    const changes = event?.changes ?? [];

    // Only a status transition is worth interrupting someone for. Every other field change on a
    // work request is routine and would train operators to dismiss this without reading it.
    const statusChange = changes.find((c: any) =>
      (c?.fieldName === 'permitStatus' || c?.fieldName === 'status')
      && WrStatusWatchComponent.WATCHED[c?.newValue ?? '']);
    if (!statusChange) return;

    const verb = WrStatusWatchComponent.WATCHED[statusChange.newValue];
    const key = `${event.entityId}:${statusChange.newValue}`;
    if (this.announced.has(key)) return;
    this.announced.add(key);

    // Informational, not blocking: it must not sit on top of whatever the operator is doing. It
    // starts centred, then minimises to the corner and persists, so it survives being glanced past.
    this.messages.showInfo(
      `A requester ${verb} work request #${event.entityId}. `
      + `Any package already built from it is still open — check it.`,
      verb === 'edited' ? 'yellow' : 'orange',
      20000,
      2500,
    );
  }

  /** Open the request the notice refers to. Wired from the message when the host supports it. */
  openRequest(id: number): void {
    this.wrDialog.open(id, { showActions: false });
  }
}
