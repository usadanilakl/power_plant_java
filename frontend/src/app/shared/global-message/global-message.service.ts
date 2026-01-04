import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type MessageColor = 'red' | 'green' | 'white' | 'yellow';
export type MessageType = 'blocking' | 'informational';

export interface Message {
  text: string;
  color: MessageColor;
  durationMs: number;
  type: MessageType;
  isMinimized: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class GlobalMessageService {
  private messageSubject = new BehaviorSubject<Message | null>(null);
  public message$: Observable<Message | null> = this.messageSubject.asObservable();
  private timeoutId: any;
  private minimizeTimeoutId: any;

  /**
   * Show a blocking message that stays centered until dismissed or timeout
   */
  showMessage(text: string, color: MessageColor = 'white', durationMs = 3000) {
    this.show(text, color, durationMs, 'blocking');
  }

  /**
   * Show an informational message that starts centered then moves to corner
   * @param minimizeAfterMs Time before message moves to corner (default 1500ms)
   */
  showInfo(text: string, color: MessageColor = 'green', durationMs = 8000, minimizeAfterMs = 1500) {
    this.clearTimeouts();

    this.messageSubject.next({
      text,
      color,
      durationMs,
      type: 'informational',
      isMinimized: false
    });

    // Minimize after specified time
    this.minimizeTimeoutId = setTimeout(() => {
      this.minimizeMessage();
    }, minimizeAfterMs);

    // Hide after total duration
    this.timeoutId = setTimeout(() => {
      this.hideMessage();
    }, durationMs);
  }

  /**
   * Show a success message (informational, moves to corner)
   */
  showSuccess(text: string, durationMs = 8000) {
    this.showInfo(text, 'green', durationMs);
  }

  /**
   * Show an error message (blocking, stays centered)
   */
  showError(text: string, durationMs = 5000) {
    this.show(text, 'red', durationMs, 'blocking');
  }

  /**
   * Show a warning message (blocking, stays centered)
   */
  showWarning(text: string, durationMs = 4000) {
    this.show(text, 'yellow', durationMs, 'blocking');
  }

  private show(text: string, color: MessageColor, durationMs: number, type: MessageType) {
    this.clearTimeouts();

    this.messageSubject.next({
      text,
      color,
      durationMs,
      type,
      isMinimized: false
    });

    this.timeoutId = setTimeout(() => {
      this.hideMessage();
    }, durationMs);
  }

  private minimizeMessage() {
    const current = this.messageSubject.value;
    if (current && current.type === 'informational') {
      this.messageSubject.next({ ...current, isMinimized: true });
    }
  }

  hideMessage() {
    this.clearTimeouts();
    this.messageSubject.next(null);
  }

  private clearTimeouts() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (this.minimizeTimeoutId) {
      clearTimeout(this.minimizeTimeoutId);
      this.minimizeTimeoutId = null;
    }
  }
}