import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, timeout } from 'rxjs/operators';
import {
  WLEDHardwareConfig,
  WLEDStateUpdate,
  WLEDSegment,
  WLEDControllerInfo
} from '../models/wled-config.model';

@Injectable({
  providedIn: 'root'
})
export class WLEDService {
  private readonly REQUEST_TIMEOUT = 5000; // 5 seconds

  // Controller configuration based on hardware setup
  private readonly CONTROLLERS: WLEDControllerInfo[] = [
    {
      id: 1,
      ip: '192.168.190.145',  // Update with actual IP
      name: 'Controller 1',
      strips: [0, 1, 2],
      online: false
    },
    {
      id: 2,
      ip: '192.168.190.146',  // Update with actual IP
      name: 'Controller 2',
      strips: [3, 4, 5],
      online: false
    }
  ];

  constructor(private http: HttpClient) {}

  /**
   * Get all controllers
   */
  getControllers(): WLEDControllerInfo[] {
    return [...this.CONTROLLERS];
  }

  /**
   * Get controller by strip number
   */
  getControllerByStrip(stripNumber: number): WLEDControllerInfo | undefined {
    return this.CONTROLLERS.find(c => c.strips.includes(stripNumber));
  }

  /**
   * Configure hardware (pins, LED counts)
   * WARNING: This triggers ESP reboot!
   */
  configureHardware(controllerId: number, config: WLEDHardwareConfig): Observable<any> {
    const controller = this.CONTROLLERS.find(c => c.id === controllerId);
    if (!controller) {
      return throwError(() => new Error(`Controller ${controllerId} not found`));
    }

    const url = `http://${controller.ip}/json`;
    return this.http.post(url, config, { responseType: 'text' }).pipe(
      timeout(this.REQUEST_TIMEOUT),
      catchError(this.handleError)
    );
  }

  /**
   * Update state (colors, brightness, segments)
   */
  updateState(controllerId: number, state: WLEDStateUpdate): Observable<any> {
    const controller = this.CONTROLLERS.find(c => c.id === controllerId);
    if (!controller) {
      return throwError(() => new Error(`Controller ${controllerId} not found`));
    }

    const url = `http://${controller.ip}/json/state`;
    return this.http.post(url, state, { responseType: 'text' }).pipe(
      timeout(this.REQUEST_TIMEOUT),
      catchError(this.handleError)
    );
  }

  /**
   * Get current state
   */
  getState(controllerId: number): Observable<any> {
    const controller = this.CONTROLLERS.find(c => c.id === controllerId);
    if (!controller) {
      return throwError(() => new Error(`Controller ${controllerId} not found`));
    }

    const url = `http://${controller.ip}/json/state`;
    return this.http.get(url).pipe(
      timeout(this.REQUEST_TIMEOUT),
      catchError(this.handleError)
    );
  }

  /**
   * Get device info
   */
  getInfo(controllerId: number): Observable<any> {
    const controller = this.CONTROLLERS.find(c => c.id === controllerId);
    if (!controller) {
      return throwError(() => new Error(`Controller ${controllerId} not found`));
    }

    const url = `http://${controller.ip}/json/info`;
    return this.http.get(url).pipe(
      timeout(this.REQUEST_TIMEOUT),
      catchError(this.handleError)
    );
  }

  /**
   * Set box color by box number
   */
  setBoxColor(
    boxNumber: number,
    r: number,
    g: number,
    b: number,
    brightness: number = 255
  ): Observable<any> {
    // This will be implemented to find the right controller and segment
    // For now, return a mock observable
    console.log(`Setting box ${boxNumber} to RGB(${r}, ${g}, ${b}), brightness: ${brightness}`);
    return of({ success: true });
  }

  /**
   * Set segment color
   */
  setSegmentColor(
    controllerId: number,
    segmentId: number,
    start: number,
    stop: number,
    r: number,
    g: number,
    b: number,
    brightness: number = 255
  ): Observable<any> {
    const segment: WLEDSegment = {
      id: segmentId,
      start,
      stop,
      col: [[r, g, b]],
      bri: brightness
    };

    const state: WLEDStateUpdate = {
      on: true,
      bri: brightness,
      transition: 0,
      seg: [segment]
    };

    return this.updateState(controllerId, state);
  }

  /**
   * Batch set colors (multiple boxes at once)
   */
  batchSetColors(updates: Array<{
    boxNumber: number;
    r: number;
    g: number;
    b: number;
    brightness: number;
  }>): Observable<any[]> {
    // Group updates by controller
    // For now, return mock observable
    console.log(`Batch updating ${updates.length} boxes`);
    return of(updates.map(() => ({ success: true })));
  }

  /**
   * Check if controller is reachable
   */
  ping(controllerId: number): Observable<boolean> {
    const startTime = Date.now();
    return this.getInfo(controllerId).pipe(
      map(() => {
        const responseTime = Date.now() - startTime;
        const controller = this.CONTROLLERS.find(c => c.id === controllerId);
        if (controller) {
          controller.online = true;
          controller.lastPing = new Date();
          controller.responseTime = responseTime;
        }
        return true;
      }),
      catchError(() => {
        const controller = this.CONTROLLERS.find(c => c.id === controllerId);
        if (controller) {
          controller.online = false;
        }
        return of(false);
      })
    );
  }

  /**
   * Turn off all LEDs on a controller
   */
  turnOff(controllerId: number): Observable<any> {
    const state: WLEDStateUpdate = {
      on: false
    };
    return this.updateState(controllerId, state);
  }

  /**
   * Turn on all LEDs on a controller
   */
  turnOn(controllerId: number, brightness: number = 255): Observable<any> {
    const state: WLEDStateUpdate = {
      on: true,
      bri: brightness
    };
    return this.updateState(controllerId, state);
  }

  /**
   * Error handler
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }

    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
