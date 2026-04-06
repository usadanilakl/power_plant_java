import { Injectable, inject, DestroyRef, NgZone, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subject, BehaviorSubject, combineLatest } from 'rxjs';
import { environment } from '../../../environments/environment';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../auth.service';

export interface FieldChangeDto {
  entityType: string;
  entityId: number;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  timestamp: string;
  originMachineId: string;
  originMachineName: string;
}

export interface EntityUpdateEvent {
  type: 'entity_updated';
  entityType: string;
  entityId: number;
  changes: FieldChangeDto[];
  timestamp: number;
}

export interface SyncCompleteEvent {
  type: 'sync_complete';
  changesApplied: number;
  changesReceived: number;
  timestamp: number;
}

export interface SyncActivityEvent {
  direction: 'SENDING' | 'RECEIVING';
  entityType: string;
  entityId: string;
  changeType: 'CREATE' | 'UPDATE' | 'DELETE';
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
  timestamp: number;
}

type SyncEvent = EntityUpdateEvent | SyncCompleteEvent;

/**
 * Service that listens to Server-Sent Events (SSE) from the backend
 * to receive real-time sync updates when entities are modified by server sync.
 */
@Injectable({
  providedIn: 'root'
})
export class SyncUpdateService {
  private ngZone = inject(NgZone);
  private destroyRef = inject(DestroyRef);
  private platformId = inject(PLATFORM_ID);
  private authService = inject(AuthService);

  private eventSource: EventSource | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private baseReconnectDelay = 1000;
  private maxReconnectDelay = 60000;

  /** Unique ID for this browser tab — server uses it to evict stale emitters on reconnect */
  private readonly clientId = crypto.randomUUID();

  // Connection state
  private connectionStateSubject = new BehaviorSubject<'connected' | 'disconnected' | 'connecting'>('disconnected');
  connectionState$ = this.connectionStateSubject.asObservable();

  // Subject for entity updates - components can subscribe to this
  private entityUpdatedSubject = new Subject<EntityUpdateEvent>();
  entityUpdated$ = this.entityUpdatedSubject.asObservable();

  // Subject for sync complete events
  private syncCompleteSubject = new Subject<SyncCompleteEvent>();
  syncComplete$ = this.syncCompleteSubject.asObservable();

  // Subject for sync activity events (real-time feed)
  private syncActivitySubject = new Subject<SyncActivityEvent>();
  syncActivity$ = this.syncActivitySubject.asObservable();

  // Subject for specific entity type updates (e.g., 'LotoPoint')
  private entityTypeUpdatedSubjects = new Map<string, Subject<EntityUpdateEvent>>();

  constructor() {
    // Only connect in browser environment (not during SSR/prerendering)
    if (isPlatformBrowser(this.platformId)) {
      // Only keep the SSE connection alive for authenticated users.
      combineLatest([this.authService.authChecked$, this.authService.isLoggedIn$])
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(([checked, isLoggedIn]) => {
          if (!checked) {
            return;
          }

          if (isLoggedIn) {
            this.connect();
          } else {
            this.reconnectAttempts = 0;
            this.disconnect();
          }
        });

      // Cleanup on destroy
      this.destroyRef.onDestroy(() => {
        this.disconnect();
      });
    }
  }

  /**
   * Connect to the SSE endpoint
   */
  connect(): void {
    // Don't connect during SSR
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (this.eventSource) {
      return; // Already connected
    }

    this.connectionStateSubject.next('connecting');
    const url = `${environment.baseApiUrl}/api/sync-updates/stream?clientId=${this.clientId}`;

    try {
      this.eventSource = new EventSource(url);

      this.eventSource.onopen = () => {
        this.ngZone.run(() => {
          console.log('SSE connected to sync updates');
          this.connectionStateSubject.next('connected');
          this.reconnectAttempts = 0;
        });
      };

      // Listen for connection confirmation
      this.eventSource.addEventListener('connected', (event) => {
        this.ngZone.run(() => {
          console.log('SSE connection confirmed:', event.data);
        });
      });

      // Listen for entity updates
      this.eventSource.addEventListener('entity_updated', (event) => {
        this.ngZone.run(() => {
          try {
            const data: EntityUpdateEvent = JSON.parse(event.data);
            console.log('SSE entity update received:', data.entityType, '#', data.entityId);

            // Emit to general subject
            this.entityUpdatedSubject.next(data);

            // Emit to entity-type-specific subject if exists
            const typeSubject = this.entityTypeUpdatedSubjects.get(data.entityType);
            if (typeSubject) {
              typeSubject.next(data);
            }
          } catch (e) {
            console.error('Error parsing entity update:', e);
          }
        });
      });

      // Listen for sync complete events
      this.eventSource.addEventListener('sync_complete', (event) => {
        this.ngZone.run(() => {
          try {
            const data: SyncCompleteEvent = JSON.parse(event.data);
            console.log('SSE sync complete:', data);
            this.syncCompleteSubject.next(data);
          } catch (e) {
            console.error('Error parsing sync complete:', e);
          }
        });
      });

      // Listen for sync activity events (real-time feed)
      this.eventSource.addEventListener('sync_activity', (event) => {
        this.ngZone.run(() => {
          try {
            const data: SyncActivityEvent = JSON.parse(event.data);
            this.syncActivitySubject.next(data);
          } catch (e) {
            // Silently drop malformed activity events
          }
        });
      });

      this.eventSource.onerror = (error) => {
        this.ngZone.run(() => {
          console.error('SSE connection error:', error);
          this.connectionStateSubject.next('disconnected');
          this.handleReconnect();
        });
      };

    } catch (error) {
      console.error('Failed to create EventSource:', error);
      this.connectionStateSubject.next('disconnected');
      this.handleReconnect();
    }
  }

  /**
   * Handle reconnection with exponential backoff.
   * Delay doubles each attempt: 1s, 2s, 4s, 8s, 16s, 32s, 60s (capped), ...
   * With jitter to prevent thundering herd when server recovers.
   */
  private handleReconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;

      // Exponential backoff: baseDelay * 2^(attempt-1), capped at maxDelay
      const exponentialDelay = this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      const cappedDelay = Math.min(exponentialDelay, this.maxReconnectDelay);

      // Add jitter (±20%) to prevent thundering herd
      const jitter = cappedDelay * 0.2 * (Math.random() * 2 - 1);
      const delay = Math.round(cappedDelay + jitter);

      console.log(`SSE reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.warn('SSE max reconnect attempts reached. Will retry in 5 minutes or on manual reconnect.');
      // Auto-retry after 5 minutes even if max attempts reached
      setTimeout(() => {
        this.reconnectAttempts = 0;
        this.connect();
      }, 5 * 60 * 1000);
    }
  }

  /**
   * Disconnect from SSE
   */
  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      this.connectionStateSubject.next('disconnected');
      console.log('SSE disconnected');
    }
  }

  /**
   * Get an observable for updates to a specific entity type.
   * Creates a new subject if one doesn't exist.
   *
   * @param entityType The entity type to listen for (e.g., 'LotoPoint', 'Equipment')
   */
  getEntityTypeUpdates$(entityType: string): Subject<EntityUpdateEvent> {
    if (!this.entityTypeUpdatedSubjects.has(entityType)) {
      this.entityTypeUpdatedSubjects.set(entityType, new Subject<EntityUpdateEvent>());
    }
    return this.entityTypeUpdatedSubjects.get(entityType)!;
  }

  /**
   * Check if a specific entity was updated
   */
  wasEntityUpdated(event: EntityUpdateEvent, entityType: string, entityId: number): boolean {
    return event.entityType === entityType && event.entityId === entityId;
  }

  /**
   * Manual reconnect (for UI button)
   */
  reconnect(): void {
    this.reconnectAttempts = 0;
    this.disconnect();
    this.connect();
  }
}
