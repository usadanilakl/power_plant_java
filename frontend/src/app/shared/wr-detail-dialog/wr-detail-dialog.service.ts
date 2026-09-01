import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WrDetailDialogService {
  private _isVisible = signal(false);
  private _workRequestId = signal(0);
  private _showActions = signal(true);
  private _onOpen = new Subject<void>();
  private _onAction = new Subject<void>();

  isVisible = this._isVisible.asReadonly();
  workRequestId = this._workRequestId.asReadonly();
  /**
   * Whether the lifecycle actions (Process / Mark as Processed / Cancel / Revoke / Request Details)
   * are offered.
   *
   * <p>Off when the dialog is opened purely to READ a request — from inside a package, where the
   * request has already been processed. Cancelling or revoking from there would leave a live
   * package attached to a cancelled request: those services only flip `permitStatus`, they do not
   * detach the request from its package or touch the permits already generated from it.
   */
  showActions = this._showActions.asReadonly();
  onOpen$ = this._onOpen.asObservable();
  /** Emits when a status-changing action completes (mark processed, cancel, etc.) */
  onAction$ = this._onAction.asObservable();

  open(workRequestId: number, options?: { showActions?: boolean }): void {
    this._workRequestId.set(workRequestId);
    this._showActions.set(options?.showActions !== false);
    this._isVisible.set(true);
    this._onOpen.next();
  }

  close(): void {
    this._isVisible.set(false);
    this._workRequestId.set(0);
    // Back to the default, so the next caller that does not ask gets the full dialog.
    this._showActions.set(true);
  }

  notifyAction(): void {
    this._onAction.next();
  }
}
