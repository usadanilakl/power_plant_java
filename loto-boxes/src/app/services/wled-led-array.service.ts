import { Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { WLEDService } from './wled.service';
import { LoggerService } from './logger.service';
import { LotoBox } from '../models/loto-box.model';

/**
 * LED state for individual LED control
 */
interface LEDState {
  r: number;
  g: number;
  b: number;
}

/**
 * Controller LED array state
 */
interface ControllerLEDState {
  controllerId: number;
  ledCount: number;
  leds: LEDState[];
  dirty: boolean; // Has unsent changes
}

@Injectable({
  providedIn: 'root'
})
export class WledLedArrayService {
  // LED state for each controller
  private readonly controllerStates = signal<Map<number, ControllerLEDState>>(new Map());

  // Controller configuration
  private readonly CONTROLLER_LED_COUNTS = [
    714, // Controller 1: 240 + 237 + 237
    750  // Controller 2: 245 + 245 + 260
  ];

  constructor(
    private wledService: WLEDService,
    private logger: LoggerService
  ) {
    this.initializeControllers();
  }

  /**
   * Initialize LED arrays for all controllers
   */
  private initializeControllers(): void {
    const states = new Map<number, ControllerLEDState>();

    this.CONTROLLER_LED_COUNTS.forEach((ledCount, index) => {
      const controllerId = index + 1; // Controller IDs are 1-based
      states.set(controllerId, {
        controllerId,
        ledCount,
        leds: Array(ledCount).fill({ r: 0, g: 0, b: 32 }), // Initialize to dark blue
        dirty: false
      });
    });

    this.controllerStates.set(states);
    this.logger.info('Initialized LED arrays for controllers', {
      count: this.CONTROLLER_LED_COUNTS.length
    });
  }

  /**
   * Update LEDs for a specific box range
   */
  updateBoxLEDs(
    controllerId: number,
    rangeStart: number,
    rangeEnd: number,
    r: number,
    g: number,
    b: number
  ): void {
    const state = this.controllerStates().get(controllerId);
    if (!state) {
      this.logger.error(`Controller ${controllerId} not found`);
      return;
    }

    // Update LED array for the box range
    const newLeds = [...state.leds];
    for (let i = rangeStart; i <= rangeEnd && i < newLeds.length; i++) {
      newLeds[i] = { r, g, b };
    }

    // Update state
    const newState: ControllerLEDState = {
      ...state,
      leds: newLeds,
      dirty: true
    };

    const states = new Map(this.controllerStates());
    states.set(controllerId, newState);
    this.controllerStates.set(states);
  }

  /**
   * Send LED state to WLED controller
   * Uses the "i" (individual LED) property
   */
  syncController(controllerId: number): Observable<any> {
    const state = this.controllerStates().get(controllerId);
    if (!state) {
      this.logger.error(`Controller ${controllerId} not found`);
      return new Observable(observer => observer.error('Controller not found'));
    }

    // Build the individual LED array for WLED
    // Format: [0, "RRGGBB", 1, "RRGGBB", 2, "RRGGBB", ...]
    const ledArray: (number | string)[] = [];
    state.leds.forEach((led, index) => {
      const hexColor = this.rgbToHex(led.r, led.g, led.b);
      ledArray.push(index);
      ledArray.push(hexColor);
    });

    // Create WLED state update with individual LED control
    const wledState = {
      on: true,
      bri: 255,
      transition: 0,
      seg: {
        i: ledArray // Individual LED colors
      }
    };

    return this.wledService.updateState(controllerId, wledState).pipe(
      tap(() => {
        // Mark as clean after successful sync
        const states = new Map(this.controllerStates());
        const updatedState = states.get(controllerId);
        if (updatedState) {
          updatedState.dirty = false;
          states.set(controllerId, updatedState);
          this.controllerStates.set(states);
        }

        this.logger.success(`Synced ${state.leds.length} LEDs to controller ${controllerId}`);
      }),
      catchError(error => {
        this.logger.error(`Failed to sync controller ${controllerId}`, {
          controllerId,
          errorMessage: error.message
        });
        throw error;
      })
    );
  }

  /**
   * Update multiple boxes and sync to controller
   * More efficient than individual updates
   */
  updateBoxesAndSync(
    controllerId: number,
    boxUpdates: Array<{
      rangeStart: number;
      rangeEnd: number;
      r: number;
      g: number;
      b: number;
    }>
  ): Observable<any> {
    // Apply all updates to LED array
    boxUpdates.forEach(update => {
      this.updateBoxLEDs(
        controllerId,
        update.rangeStart,
        update.rangeEnd,
        update.r,
        update.g,
        update.b
      );
    });

    // Sync once with all changes
    return this.syncController(controllerId);
  }

  /**
   * Clear all LEDs on a controller (set to dark blue)
   */
  clearController(controllerId: number): Observable<any> {
    const state = this.controllerStates().get(controllerId);
    if (!state) {
      this.logger.error(`Controller ${controllerId} not found`);
      return new Observable(observer => observer.error('Controller not found'));
    }

    // Set all LEDs to dark blue
    const newLeds = Array(state.ledCount).fill({ r: 0, g: 0, b: 32 });
    const newState: ControllerLEDState = {
      ...state,
      leds: newLeds,
      dirty: true
    };

    const states = new Map(this.controllerStates());
    states.set(controllerId, newState);
    this.controllerStates.set(states);

    return this.syncController(controllerId);
  }

  /**
   * Get LED state for a specific range
   */
  getLEDsInRange(controllerId: number, rangeStart: number, rangeEnd: number): LEDState[] {
    const state = this.controllerStates().get(controllerId);
    if (!state) {
      return [];
    }

    return state.leds.slice(rangeStart, rangeEnd + 1);
  }

  /**
   * Check if controller has unsent changes
   */
  isControllerDirty(controllerId: number): boolean {
    const state = this.controllerStates().get(controllerId);
    return state?.dirty || false;
  }

  /**
   * Convert RGB to hex string
   */
  private rgbToHex(r: number, g: number, b: number): string {
    return [r, g, b]
      .map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
      .toUpperCase();
  }

  /**
   * Get current LED count for controller
   */
  getControllerLEDCount(controllerId: number): number {
    const state = this.controllerStates().get(controllerId);
    return state?.ledCount || 0;
  }

  /**
   * Initialize LED array from box configuration
   */
  initializeFromBoxes(boxes: LotoBox[]): void {
    this.logger.info('Initializing LED arrays from box configuration');

    // Group boxes by controller
    const boxesByController = new Map<number, LotoBox[]>();
    boxes.forEach(box => {
      const controllerId = box.strip < 3 ? 1 : 2; // Controller 1: strips 0-2, Controller 2: strips 3-5
      if (!boxesByController.has(controllerId)) {
        boxesByController.set(controllerId, []);
      }
      boxesByController.get(controllerId)!.push(box);
    });

    // Apply box colors to LED arrays
    boxesByController.forEach((controllerBoxes, controllerId) => {
      controllerBoxes.forEach(box => {
        this.updateBoxLEDs(
          controllerId,
          box.rangeStart,
          box.rangeEnd,
          box.r,
          box.g,
          box.b
        );
      });

      // Mark as dirty but don't sync yet
      const states = new Map(this.controllerStates());
      const state = states.get(controllerId);
      if (state) {
        state.dirty = true;
        states.set(controllerId, state);
        this.controllerStates.set(states);
      }
    });

    this.logger.success('LED arrays initialized from boxes', {
      count: boxes.length
    });
  }

  /**
   * Sync all dirty controllers
   */
  syncAllDirty(): Observable<any[]> {
    const dirtyControllers: Observable<any>[] = [];

    this.controllerStates().forEach((state, controllerId) => {
      if (state.dirty) {
        dirtyControllers.push(this.syncController(controllerId));
      }
    });

    if (dirtyControllers.length === 0) {
      this.logger.info('No controllers need syncing');
      return new Observable(observer => {
        observer.next([]);
        observer.complete();
      });
    }

    return new Observable(observer => {
      let completed = 0;
      const results: any[] = [];

      dirtyControllers.forEach((obs, index) => {
        obs.subscribe({
          next: (result) => {
            results[index] = result;
          },
          error: (error) => {
            results[index] = { error };
            completed++;
            if (completed === dirtyControllers.length) {
              observer.next(results);
              observer.complete();
            }
          },
          complete: () => {
            completed++;
            if (completed === dirtyControllers.length) {
              observer.next(results);
              observer.complete();
            }
          }
        });
      });
    });
  }
}