import { Injectable, inject, DestroyRef, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SyncUpdateService } from '../../services/sync/sync-update.service';

@Injectable({
  providedIn: 'root'
})
export class CommentsDialogService {
  private syncUpdateService = inject(SyncUpdateService);
  private destroyRef = inject(DestroyRef);

  private _isVisible = signal(false);
  private _entityType = signal('');
  private _entityId = signal(0);
  private _onOpen = new Subject<void>();

  // Comment change notification for real-time updates
  private _commentChanged = new Subject<{ entityType: string; entityId: number } | null>();
  commentChanged$ = this._commentChanged.pipe(debounceTime(300));

  isVisible = this._isVisible.asReadonly();
  entityType = this._entityType.asReadonly();
  entityId = this._entityId.asReadonly();
  onOpen$ = this._onOpen.asObservable();

  constructor() {
    // Subscribe to Comment SSE events from other clients
    this.syncUpdateService.getEntityTypeUpdates$('Comment')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        // Try to extract parent entity info from field changes
        const entityTypeChange = event.changes?.find(c => c.fieldName === 'entityType');
        const entityIdChange = event.changes?.find(c => c.fieldName === 'entityId');
        if (entityTypeChange?.newValue && entityIdChange?.newValue) {
          try {
            const parentType = JSON.parse(entityTypeChange.newValue);
            const parentId = Number(JSON.parse(entityIdChange.newValue));
            this._commentChanged.next({ entityType: parentType, entityId: parentId });
          } catch {
            this._commentChanged.next(null);
          }
        } else {
          this._commentChanged.next(null); // broadcast to all
        }
      });
  }

  emitCommentChanged(entityType: string, entityId: number): void {
    this._commentChanged.next({ entityType, entityId });
  }

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
