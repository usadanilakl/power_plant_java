import { Injectable, signal } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { LotoBox, LotoBoxStatus, STATUS_COLORS, BoxUpdateRequest, BulkUpdateRequest } from '../models/loto-box.model';
import { WLEDService } from './wled.service';
import { LoggerService } from './logger.service';
import { SyncQueueService } from './sync-queue.service';

@Injectable({
  providedIn: 'root'
})
export class LotoBoxService {
  // Signal for reactive state
  boxes = signal<LotoBox[]>([]);

  // Initial box configuration from hardware specs
  private readonly INITIAL_BOXES: LotoBox[] = [
    // Strip 0 - Boxes 1-12
    { number: 1, strip: 0, rangeStart: 0, rangeEnd: 17, r: 0, g: 0, b: 32, brightness: 255 },
    { number: 2, strip: 0, rangeStart: 20, rangeEnd: 37, r: 0, g: 0, b: 32, brightness: 255 },
    { number: 3, strip: 0, rangeStart: 40, rangeEnd: 57, r: 0, g: 0, b: 32, brightness: 255 },
    { number: 4, strip: 0, rangeStart: 60, rangeEnd: 77, r: 0, g: 0, b: 32, brightness: 255 },
    { number: 5, strip: 0, rangeStart: 80, rangeEnd: 97, r: 0, g: 0, b: 32, brightness: 255 },
    { number: 6, strip: 0, rangeStart: 100, rangeEnd: 117, r: 0, g: 0, b: 32, brightness: 255 },
    { number: 7, strip: 0, rangeStart: 120, rangeEnd: 137, r: 0, g: 0, b: 32, brightness: 255 },
    { number: 8, strip: 0, rangeStart: 140, rangeEnd: 157, r: 0, g: 0, b: 32, brightness: 255 },
    { number: 9, strip: 0, rangeStart: 160, rangeEnd: 177, r: 0, g: 0, b: 32, brightness: 255 },
    { number: 10, strip: 0, rangeStart: 180, rangeEnd: 197, r: 0, g: 0, b: 32, brightness: 255 },
    { number: 11, strip: 0, rangeStart: 202, rangeEnd: 219, r: 0, g: 0, b: 32, brightness: 255 },
    { number: 12, strip: 0, rangeStart: 222, rangeEnd: 240, r: 0, g: 0, b: 32, brightness: 255 },

    // Strip 1 - Boxes 13-24
    { number: 13, strip: 1, rangeStart: 0, rangeEnd: 17, r: 0, g: 0, b: 32, brightness: 255 },
    { number: 14, strip: 1, rangeStart: 21, rangeEnd: 37, r: 0, g: 0, b: 32, brightness: 255 },
    { number: 15, strip: 1, rangeStart: 41, rangeEnd: 57, r: 0, g: 0, b: 32, brightness: 255 },
    { number: 16, strip: 1, rangeStart: 60, rangeEnd: 77, r: 0, g: 0, b: 32, brightness: 255 },
    { number: 17, strip: 1, rangeStart: 82, rangeEnd: 98, r: 0, g: 0, b: 32, brightness: 255 },
    { number: 18, strip: 1, rangeStart: 100, rangeEnd: 117, r: 0, g: 0, b: 32, brightness: 255 },
    { number: 19, strip: 1, rangeStart: 120, rangeEnd: 137, r: 0, g: 0, b: 32, brightness: 255 },
    { number: 20, strip: 1, rangeStart: 140, rangeEnd: 156, r: 0, g: 0, b: 32, brightness: 255 },
    { number: 21, strip: 1, rangeStart: 158, rangeEnd: 175, r: 0, g: 0, b: 32, brightness: 255 },
    { number: 22, strip: 1, rangeStart: 177, rangeEnd: 194, r: 0, g: 0, b: 32, brightness: 255 },
    { number: 23, strip: 1, rangeStart: 197, rangeEnd: 214, r: 0, g: 0, b: 32, brightness: 255 },
    { number: 24, strip: 1, rangeStart: 217, rangeEnd: 237, r: 0, g: 0, b: 32, brightness: 255 },

    // Strip 2 - Boxes 25-36
    { number: 25, strip: 2, rangeStart: 0, rangeEnd: 17, r: 0, g: 0, b: 32, brightness: 255 },
    { number: 26, strip: 2, rangeStart: 20, rangeEnd: 37, r: 0, g: 0, b: 32, brightness: 255 },
    { number: 27, strip: 2, rangeStart: 40, rangeEnd: 57, r: 0, g: 0, b: 32, brightness: 255 },
    { number: 28, strip: 2, rangeStart: 60, rangeEnd: 77, r: 0, g: 0, b: 32, brightness: 255 },
    { number: 29, strip: 2, rangeStart: 80, rangeEnd: 97, r: 0, g: 0, b: 32, brightness: 255 },
    { number: 30, strip: 2, rangeStart: 100, rangeEnd: 117, r: 0, g: 0, b: 32, brightness: 255 },
    { number: 31, strip: 2, rangeStart: 120, rangeEnd: 137, r: 0, g: 0, b: 32, brightness: 255 },
    { number: 32, strip: 2, rangeStart: 139, rangeEnd: 156, r: 0, g: 0, b: 32, brightness: 255 },
    { number: 33, strip: 2, rangeStart: 159, rangeEnd: 176, r: 0, g: 0, b: 32, brightness: 255 },
    { number: 34, strip: 2, rangeStart: 178, rangeEnd: 195, r: 0, g: 0, b: 32, brightness: 255 },
    { number: 35, strip: 2, rangeStart: 197, rangeEnd: 214, r: 0, g: 0, b: 32, brightness: 255 },
    { number: 36, strip: 2, rangeStart: 217, rangeEnd: 237, r: 0, g: 0, b: 32, brightness: 255 },

    // Strip 3 - Boxes 37-48
    { number: 37, strip: 3, rangeStart: 0, rangeEnd: 24, r: 255, g: 0, b: 0, brightness: 255 },
    { number: 38, strip: 3, rangeStart: 28, rangeEnd: 43, r: 0, g: 0, b: 32, brightness: 255 },
    { number: 39, strip: 3, rangeStart: 46, rangeEnd: 63, r: 0, g: 0, b: 32, brightness: 255 },
    { number: 40, strip: 3, rangeStart: 65, rangeEnd: 83, r: 255, g: 0, b: 0, brightness: 255 },
    { number: 41, strip: 3, rangeStart: 85, rangeEnd: 103, r: 0, g: 0, b: 32, brightness: 255 },
    { number: 42, strip: 3, rangeStart: 105, rangeEnd: 123, r: 255, g: 0, b: 0, brightness: 255 },
    { number: 43, strip: 3, rangeStart: 125, rangeEnd: 143, r: 0, g: 0, b: 32, brightness: 255 },
    { number: 44, strip: 3, rangeStart: 145, rangeEnd: 163, r: 0, g: 0, b: 32, brightness: 255 },
    { number: 45, strip: 3, rangeStart: 165, rangeEnd: 182, r: 0, g: 0, b: 32, brightness: 255 },
    { number: 46, strip: 3, rangeStart: 184, rangeEnd: 201, r: 255, g: 0, b: 0, brightness: 255 },
    { number: 47, strip: 3, rangeStart: 203, rangeEnd: 220, r: 0, g: 0, b: 32, brightness: 255 },
    { number: 48, strip: 3, rangeStart: 222, rangeEnd: 245, r: 255, g: 0, b: 0, brightness: 255 },

    // Strip 4 - Boxes 49-60
    { number: 49, strip: 4, rangeStart: 0, rangeEnd: 17, r: 0, g: 0, b: 32, brightness: 255 },
    { number: 50, strip: 4, rangeStart: 20, rangeEnd: 37, r: 0, g: 0, b: 32, brightness: 255 },
    { number: 51, strip: 4, rangeStart: 43, rangeEnd: 57, r: 0, g: 0, b: 32, brightness: 255 },
    { number: 52, strip: 4, rangeStart: 62, rangeEnd: 81, r: 0, g: 0, b: 32, brightness: 255 },
    { number: 53, strip: 4, rangeStart: 83, rangeEnd: 100, r: 0, g: 0, b: 32, brightness: 255 },
    { number: 54, strip: 4, rangeStart: 102, rangeEnd: 120, r: 0, g: 0, b: 32, brightness: 255 },
    { number: 55, strip: 4, rangeStart: 123, rangeEnd: 140, r: 0, g: 0, b: 32, brightness: 255 },
    { number: 56, strip: 4, rangeStart: 142, rangeEnd: 160, r: 0, g: 0, b: 32, brightness: 255 },
    { number: 57, strip: 4, rangeStart: 162, rangeEnd: 180, r: 0, g: 0, b: 32, brightness: 255 },
    { number: 58, strip: 4, rangeStart: 182, rangeEnd: 200, r: 0, g: 0, b: 32, brightness: 255 },
    { number: 59, strip: 4, rangeStart: 202, rangeEnd: 220, r: 0, g: 0, b: 32, brightness: 255 },
    { number: 60, strip: 4, rangeStart: 222, rangeEnd: 245, r: 0, g: 0, b: 32, brightness: 255 },

    // Strip 5 - Boxes 61-72
    { number: 61, strip: 5, rangeStart: 0, rangeEnd: 27, r: 159, g: 0, b: 255, brightness: 255 },
    { number: 62, strip: 5, rangeStart: 30, rangeEnd: 47, r: 0, g: 0, b: 32, brightness: 255 },
    { number: 63, strip: 5, rangeStart: 50, rangeEnd: 69, r: 0, g: 0, b: 32, brightness: 255 },
    { number: 64, strip: 5, rangeStart: 72, rangeEnd: 90, r: 0, g: 0, b: 32, brightness: 255 },
    { number: 65, strip: 5, rangeStart: 92, rangeEnd: 110, r: 0, g: 0, b: 32, brightness: 255 },
    { number: 66, strip: 5, rangeStart: 112, rangeEnd: 130, r: 0, g: 0, b: 32, brightness: 255 },
    { number: 67, strip: 5, rangeStart: 136, rangeEnd: 154, r: 0, g: 0, b: 32, brightness: 255 },
    { number: 68, strip: 5, rangeStart: 157, rangeEnd: 177, r: 0, g: 0, b: 32, brightness: 255 },
    { number: 69, strip: 5, rangeStart: 177, rangeEnd: 197, r: 0, g: 0, b: 32, brightness: 255 },
    { number: 70, strip: 5, rangeStart: 199, rangeEnd: 217, r: 0, g: 0, b: 32, brightness: 255 },
    { number: 71, strip: 5, rangeStart: 220, rangeEnd: 237, r: 0, g: 0, b: 32, brightness: 255 },
    { number: 72, strip: 5, rangeStart: 245, rangeEnd: 260, r: 0, g: 0, b: 32, brightness: 255 }
  ];

  constructor(
    private wledService: WLEDService,
    private logger: LoggerService,
    private syncQueue: SyncQueueService
  ) {
    this.loadBoxes();
  }

  /**
   * Load boxes from storage or initialize with defaults
   */
  loadBoxes(): void {
    // Try to load from localStorage
    const stored = localStorage.getItem('loto-boxes');
    if (stored) {
      try {
        const boxes = JSON.parse(stored);
        this.boxes.set(boxes);
        this.logger.info('Loaded boxes from storage', { count: boxes.length });
      } catch (e) {
        console.error('Failed to parse stored boxes', e);
        this.initializeBoxes();
      }
    } else {
      this.initializeBoxes();
    }
  }

  /**
   * Initialize boxes with default configuration
   */
  private initializeBoxes(): void {
    const boxes = this.INITIAL_BOXES.map(box => ({
      ...box,
      status: this.getStatusFromColor(box.r, box.g, box.b),
      online: true,
      pendingSync: false,
      lastUpdated: new Date()
    }));
    this.boxes.set(boxes);
    this.saveBoxes();
    this.logger.info('Initialized boxes with default configuration', { count: boxes.length });
  }

  /**
   * Save boxes to storage
   */
  private saveBoxes(): void {
    localStorage.setItem('loto-boxes', JSON.stringify(this.boxes()));
  }

  /**
   * Get status from RGB color
   */
  private getStatusFromColor(r: number, g: number, b: number): LotoBoxStatus {
    for (const [status, color] of Object.entries(STATUS_COLORS)) {
      if (color.r === r && color.g === g && color.b === b) {
        return status as LotoBoxStatus;
      }
    }
    return LotoBoxStatus.CLOSED;
  }

  /**
   * Update a single box status
   */
  updateBoxStatus(boxNumber: number, status: LotoBoxStatus): Observable<any> {
    const box = this.boxes().find(b => b.number === boxNumber);
    if (!box) {
      return throwError(() => new Error(`Box ${boxNumber} not found`));
    }

    const color = STATUS_COLORS[status];
    const request: BoxUpdateRequest = {
      boxNumber,
      r: color.r,
      g: color.g,
      b: color.b,
      brightness: box.brightness,
      status
    };

    return this.updateBox(request);
  }

  /**
   * Update a single box
   */
  updateBox(request: BoxUpdateRequest): Observable<any> {
    const box = this.boxes().find(b => b.number === request.boxNumber);
    if (!box) {
      return of(null);
    }

    const controller = this.wledService.getControllerByStrip(box.strip);
    if (!controller) {
      this.logger.error(`No controller found for strip ${box.strip}`, { boxNumber: box.number });
      return of(null);
    }

    // Update WLED
    return this.wledService.setSegmentColor(
      controller.id,
      box.number,
      box.rangeStart,
      box.rangeEnd + 1, // WLED uses exclusive end
      request.r,
      request.g,
      request.b,
      request.brightness
    ).pipe(
      tap(() => {
        // Update local state
        const boxes = this.boxes();
        const index = boxes.findIndex(b => b.number === request.boxNumber);
        if (index !== -1) {
          boxes[index] = {
            ...boxes[index],
            r: request.r,
            g: request.g,
            b: request.b,
            brightness: request.brightness,
            status: request.status,
            lastUpdated: new Date(),
            online: true,
            pendingSync: false
          };
          this.boxes.set([...boxes]);
          this.saveBoxes();

          this.logger.success(`Updated box ${request.boxNumber}`, {
            boxNumber: request.boxNumber,
            r: request.r,
            g: request.g,
            b: request.b,
            brightness: request.brightness
          });
        }
      }),
      catchError(error => {
        this.logger.error(`Failed to update box ${request.boxNumber}`, {
          boxNumber: request.boxNumber,
          errorMessage: error.message
        });

        // Queue for retry
        this.syncQueue.queueUpdate(request);

        // Mark as pending sync
        const boxes = this.boxes();
        const index = boxes.findIndex(b => b.number === request.boxNumber);
        if (index !== -1) {
          boxes[index].pendingSync = true;
          this.boxes.set([...boxes]);
        }

        return of(null);
      })
    );
  }

  /**
   * Bulk update multiple boxes
   */
  bulkUpdateBoxes(boxNumbers: number[], status: LotoBoxStatus): Observable<any[]> {
    const color = STATUS_COLORS[status];
    const updates = boxNumbers.map(boxNumber => {
      const box = this.boxes().find(b => b.number === boxNumber);
      return this.updateBox({
        boxNumber,
        r: color.r,
        g: color.g,
        b: color.b,
        brightness: box?.brightness || 255,
        status
      });
    });

    return forkJoin(updates).pipe(
      tap(() => {
        this.logger.success(`Bulk updated ${boxNumbers.length} boxes`, {
          bulkCount: boxNumbers.length,
          successCount: boxNumbers.length
        });
      })
    );
  }

  /**
   * Clear all boxes (set to CLOSED/dark blue)
   */
  clearAllBoxes(): Observable<any[]> {
    const boxNumbers = this.boxes().map(b => b.number);
    return this.bulkUpdateBoxes(boxNumbers, LotoBoxStatus.CLOSED);
  }

  /**
   * Update all boxes to sync current state to controllers
   */
  syncAllToControllers(): Observable<any[]> {
    const updates = this.boxes().map(box =>
      this.updateBox({
        boxNumber: box.number,
        r: box.r,
        g: box.g,
        b: box.b,
        brightness: box.brightness,
        status: box.status
      })
    );

    return forkJoin(updates).pipe(
      tap(() => {
        this.logger.success('Synced all boxes to controllers', {
          bulkCount: this.boxes().length
        });
      })
    );
  }

  /**
   * Get box by number
   */
  getBox(boxNumber: number): LotoBox | undefined {
    return this.boxes().find(b => b.number === boxNumber);
  }

  /**
   * Get boxes by status
   */
  getBoxesByStatus(status: LotoBoxStatus): LotoBox[] {
    return this.boxes().filter(b => b.status === status);
  }
}

function throwError(arg0: () => Error): Observable<any> {
  throw new Error('Function not implemented.');
}
