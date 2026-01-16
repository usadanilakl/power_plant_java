import { Injectable, inject, DestroyRef, NgZone } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

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

  private eventSource: EventSource | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000; // 3 seconds

  // Connection state
  private connectionStateSubject = new BehaviorSubject<'connected' | 'disconnected' | 'connecting'>('disconnected');
  connectionState$ = this.connectionStateSubject.asObservable();

  // Subject for entity updates - components can subscribe to this
  private entityUpdatedSubject = new Subject<EntityUpdateEvent>();
  entityUpdated$ = this.entityUpdatedSubject.asObservable();

  // Subject for sync complete events
  private syncCompleteSubject = new Subject<SyncCompleteEvent>();
  syncComplete$ = this.syncCompleteSubject.asObservable();

  // Subject for specific entity type updates (e.g., 'LotoPoint')
  private entityTypeUpdatedSubjects = new Map<string, Subject<EntityUpdateEvent>>();

  constructor() {
    // Auto-connect on service initialization
    this.connect();

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      this.disconnect();
    });
  }

  /**
   * Connect to the SSE endpoint
   */
  connect(): void {
    if (this.eventSource) {
      return; // Already connected
    }

    this.connectionStateSubject.next('connecting');
    const url = `${environment.apiUrl}/sync-updates/stream`;

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
   * Handle reconnection with exponential backoff
   */
  private handleReconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * this.reconnectAttempts;
      console.log(`SSE reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.warn('SSE max reconnect attempts reached. Manual reconnect required.');
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
