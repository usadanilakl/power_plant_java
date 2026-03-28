import { Injectable, inject, DestroyRef, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SyncUpdateService } from '../../services/sync/sync-update.service';

@Injectable({
  providedIn: 'root'
})
export class ConversationDialogService {
  private syncUpdateService = inject(SyncUpdateService);
  private destroyRef = inject(DestroyRef);

  private _isVisible = signal(false);
  private _entityType = signal('');
  private _entityId = signal(0);
  private _selectedConversationId = signal<number | null>(null);
  private _isComposing = signal(false);
  private _onOpen = new Subject<void>();

  private _conversationChanged = new Subject<{ entityType: string; entityId: number } | null>();
  conversationChanged$ = this._conversationChanged.pipe(debounceTime(300));

  isVisible = this._isVisible.asReadonly();
  entityType = this._entityType.asReadonly();
  entityId = this._entityId.asReadonly();
  selectedConversationId = this._selectedConversationId.asReadonly();
  isComposing = this._isComposing.asReadonly();
  onOpen$ = this._onOpen.asObservable();

  constructor() {
    // Subscribe to Conversation SSE events
    this.syncUpdateService.getEntityTypeUpdates$('Conversation')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        const entityTypeChange = event.changes?.find((c: any) => c.fieldName === 'entityType');
        const entityIdChange = event.changes?.find((c: any) => c.fieldName === 'entityId');
        if (entityTypeChange?.newValue && entityIdChange?.newValue) {
          try {
            const parentType = JSON.parse(entityTypeChange.newValue);
            const parentId = Number(JSON.parse(entityIdChange.newValue));
            this._conversationChanged.next({ entityType: parentType, entityId: parentId });
          } catch {
            this._conversationChanged.next(null);
          }
        } else {
          this._conversationChanged.next(null);
        }
      });

    // Also listen to Message changes
    this.syncUpdateService.getEntityTypeUpdates$('Message')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this._conversationChanged.next(null);
      });
  }

  emitConversationChanged(entityType: string, entityId: number): void {
    this._conversationChanged.next({ entityType, entityId });
  }

  open(entityType: string, entityId: number, conversationId: number | null = null): void {
    this._entityType.set(entityType);
    this._entityId.set(entityId);
    this._selectedConversationId.set(conversationId);
    this._isVisible.set(true);
    this._onOpen.next();
  }

  openConversation(conversationId: number): void {
    this._selectedConversationId.set(conversationId);
    this._isComposing.set(false);
  }

  startComposing(): void {
    this._isComposing.set(true);
    this._selectedConversationId.set(null);
  }

  stopComposing(): void {
    this._isComposing.set(false);
  }

  backToList(): void {
    this._selectedConversationId.set(null);
    this._isComposing.set(false);
  }

  close(): void {
    this._isVisible.set(false);
    this._entityType.set('');
    this._entityId.set(0);
    this._selectedConversationId.set(null);
    this._isComposing.set(false);
  }
}
