import { Injectable, inject, DestroyRef, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SyncUpdateService } from '../../services/sync/sync-update.service';
import { EmailCorrespondenceDto } from '../../models/base/email-correspondence.model';

@Injectable({
  providedIn: 'root'
})
export class CorrespondenceDialogService {
  private syncUpdateService = inject(SyncUpdateService);
  private destroyRef = inject(DestroyRef);

  private _isVisible = signal(false);
  private _entityType = signal('');
  private _entityId = signal(0);
  private _preloadedItems = signal<EmailCorrespondenceDto[] | null>(null);
  private _dialogTitle = signal('');
  private _onOpen = new Subject<void>();

  // Correspondence change notification for real-time updates
  private _correspondenceChanged = new Subject<{ entityType: string; entityId: number } | null>();
  correspondenceChanged$ = this._correspondenceChanged.pipe(debounceTime(300));

  isVisible = this._isVisible.asReadonly();
  entityType = this._entityType.asReadonly();
  entityId = this._entityId.asReadonly();
  preloadedItems = this._preloadedItems.asReadonly();
  dialogTitle = this._dialogTitle.asReadonly();
  onOpen$ = this._onOpen.asObservable();

  constructor() {
    // Subscribe to EmailCorrespondence SSE events from other clients
    this.syncUpdateService.getEntityTypeUpdates$('EmailCorrespondence')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        const entityTypeChange = event.changes?.find((c: any) => c.fieldName === 'entityType');
        const entityIdChange = event.changes?.find((c: any) => c.fieldName === 'entityId');
        if (entityTypeChange?.newValue && entityIdChange?.newValue) {
          try {
            const parentType = JSON.parse(entityTypeChange.newValue);
            const parentId = Number(JSON.parse(entityIdChange.newValue));
            this._correspondenceChanged.next({ entityType: parentType, entityId: parentId });
          } catch {
            this._correspondenceChanged.next(null);
          }
        } else {
          this._correspondenceChanged.next(null);
        }
      });
  }

  emitCorrespondenceChanged(entityType: string, entityId: number): void {
    this._correspondenceChanged.next({ entityType, entityId });
  }

  open(entityType: string, entityId: number): void {
    this._entityType.set(entityType);
    this._entityId.set(entityId);
    this._preloadedItems.set(null);
    this._dialogTitle.set('');
    this._isVisible.set(true);
    this._onOpen.next();
  }

  openWithItems(title: string, items: EmailCorrespondenceDto[]): void {
    this._entityType.set('');
    this._entityId.set(0);
    this._preloadedItems.set(items);
    this._dialogTitle.set(title);
    this._isVisible.set(true);
    this._onOpen.next();
  }

  close(): void {
    this._isVisible.set(false);
    this._entityType.set('');
    this._entityId.set(0);
    this._preloadedItems.set(null);
    this._dialogTitle.set('');
  }
}
