import { Injectable, signal } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { BoxUpdateRequest } from '../models/loto-box.model';
import { LoggerService } from './logger.service';

interface QueuedUpdate {
  id: string;
  request: BoxUpdateRequest;
  timestamp: Date;
  retryCount: number;
  nextRetry?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class SyncQueueService {
  // Signal for pending updates
  pendingUpdates = signal<QueuedUpdate[]>([]);

  private readonly MAX_RETRIES = 5;
  private readonly RETRY_DELAYS = [1000, 2000, 4000, 8000, 16000]; // Exponential backoff
  private processingSubscription?: Subscription;

  constructor(private logger: LoggerService) {
    this.loadQueue();
    this.startProcessing();
  }

  /**
   * Queue an update for retry
   */
  queueUpdate(request: BoxUpdateRequest): void {
    const queuedUpdate: QueuedUpdate = {
      id: this.generateId(),
      request,
      timestamp: new Date(),
      retryCount: 0,
      nextRetry: new Date(Date.now() + this.RETRY_DELAYS[0])
    };

    const queue = [...this.pendingUpdates(), queuedUpdate];
    this.pendingUpdates.set(queue);
    this.saveQueue();

    this.logger.warn(`Queued update for box ${request.boxNumber}`, {
      boxNumber: request.boxNumber
    });
  }

  /**
   * Process pending queue
   */
  processPendingQueue(): void {
    const now = new Date();
    const queue = this.pendingUpdates();
    const toProcess = queue.filter(update =>
      update.nextRetry && update.nextRetry <= now
    );

    if (toProcess.length === 0) {
      return;
    }

    this.logger.info(`Processing ${toProcess.length} pending updates`);

    toProcess.forEach(update => {
      this.retryUpdate(update);
    });
  }

  /**
   * Retry a failed update
   */
  private retryUpdate(update: QueuedUpdate): void {
    // In a real implementation, this would call the WLED service
    // For now, we'll simulate success/failure
    const success = Math.random() > 0.3; // 70% success rate

    if (success) {
      this.removeFromQueue(update.id);
      this.logger.success(`Successfully synced box ${update.request.boxNumber}`, {
        boxNumber: update.request.boxNumber,
        retryCount: update.retryCount
      });
    } else {
      update.retryCount++;

      if (update.retryCount >= this.MAX_RETRIES) {
        this.removeFromQueue(update.id);
        this.logger.error(`Failed to sync box ${update.request.boxNumber} after ${this.MAX_RETRIES} attempts`, {
          boxNumber: update.request.boxNumber,
          retryCount: update.retryCount
        });
      } else {
        // Schedule next retry with exponential backoff
        const delay = this.RETRY_DELAYS[update.retryCount] || this.RETRY_DELAYS[this.RETRY_DELAYS.length - 1];
        update.nextRetry = new Date(Date.now() + delay);

        const queue = this.pendingUpdates();
        const index = queue.findIndex(u => u.id === update.id);
        if (index !== -1) {
          queue[index] = update;
          this.pendingUpdates.set([...queue]);
          this.saveQueue();
        }

        this.logger.warn(`Retry ${update.retryCount}/${this.MAX_RETRIES} for box ${update.request.boxNumber}`, {
          boxNumber: update.request.boxNumber,
          retryCount: update.retryCount
        });
      }
    }
  }

  /**
   * Remove update from queue
   */
  private removeFromQueue(id: string): void {
    const queue = this.pendingUpdates().filter(u => u.id !== id);
    this.pendingUpdates.set(queue);
    this.saveQueue();
  }

  /**
   * Clear all pending updates
   */
  clearQueue(): void {
    this.pendingUpdates.set([]);
    this.saveQueue();
    this.logger.info('Cleared sync queue');
  }

  /**
   * Get pending count
   */
  getPendingCount(): number {
    return this.pendingUpdates().length;
  }

  /**
   * Check if box has pending updates
   */
  hasPendingUpdate(boxNumber: number): boolean {
    return this.pendingUpdates().some(u => u.request.boxNumber === boxNumber);
  }

  /**
   * Start automatic processing
   */
  private startProcessing(): void {
    // Process queue every 5 seconds
    this.processingSubscription = interval(5000).subscribe(() => {
      this.processPendingQueue();
    });
  }

  /**
   * Stop automatic processing
   */
  stopProcessing(): void {
    if (this.processingSubscription) {
      this.processingSubscription.unsubscribe();
    }
  }

  /**
   * Load queue from localStorage
   */
  private loadQueue(): void {
    const stored = localStorage.getItem('sync-queue');
    if (stored) {
      try {
        const queue = JSON.parse(stored);
        this.pendingUpdates.set(queue.map((update: any) => ({
          ...update,
          timestamp: new Date(update.timestamp),
          nextRetry: update.nextRetry ? new Date(update.nextRetry) : undefined
        })));
      } catch (e) {
        console.error('Failed to load sync queue', e);
      }
    }
  }

  /**
   * Save queue to localStorage
   */
  private saveQueue(): void {
    localStorage.setItem('sync-queue', JSON.stringify(this.pendingUpdates()));
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup on destroy
   */
  ngOnDestroy(): void {
    this.stopProcessing();
  }
}
