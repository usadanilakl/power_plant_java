import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WrDetailDialogService {
  private _isVisible = signal(false);
  private _workRequestId = signal(0);
  private _onOpen = new Subject<void>();
  private _onAction = new Subject<void>();

  isVisible = this._isVisible.asReadonly();
  workRequestId = this._workRequestId.asReadonly();
  onOpen$ = this._onOpen.asObservable();
  /** Emits when a status-changing action completes (mark processed, cancel, etc.) */
  onAction$ = this._onAction.asObservable();

  open(workRequestId: number): void {
    this._workRequestId.set(workRequestId);
    this._isVisible.set(true);
    this._onOpen.next();
  }

  close(): void {
    this._isVisible.set(false);
    this._workRequestId.set(0);
  }

  notifyAction(): void {
    this._onAction.next();
  }
}
