import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CommentsDialogService {
  private _isVisible = signal(false);
  private _entityType = signal('');
  private _entityId = signal(0);
  private _onOpen = new Subject<void>();

  isVisible = this._isVisible.asReadonly();
  entityType = this._entityType.asReadonly();
  entityId = this._entityId.asReadonly();
  onOpen$ = this._onOpen.asObservable();

  open(entityType: string, entityId: number): void {
    this._entityType.set(entityType);
    this._entityId.set(entityId);
    this._isVisible.set(true);
    this._onOpen.next();
  }

  close(): void {
    this._isVisible.set(false);
    this._entityType.set('');
    this._entityId.set(0);
  }
}
