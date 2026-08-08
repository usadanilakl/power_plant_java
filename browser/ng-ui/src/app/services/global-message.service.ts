import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type MessageColor = 'red' | 'green' | 'white' | 'yellow' | 'orange';
export type MessageType = 'blocking' | 'informational' | 'loading' | 'confirm' | 'prompt';

export interface Message {
  text: string;
  color: MessageColor;
  durationMs: number;
  type: MessageType;
  isMinimized: boolean;
  /** confirm/prompt only — button labels. */
  confirmLabel?: string;
  cancelLabel?: string;
  /** prompt only — placeholder and seed value for the text field. */
  placeholder?: string;
  initialValue?: string;
  /**
   * confirm/prompt only — settled by the component when the user picks. Confirm resolves boolean;
   * prompt resolves the entered string, or null on cancel.
   */
  resolve?: (value: any) => void;
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
    this.settlePending();

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

  /**
   * Show a spinner while an operation is in flight. Never auto-hides - the caller
   * replaces it with showSuccess/showError, or calls hideMessage().
   */
  showLoading(text: string, color: MessageColor = 'white') {
    this.show(text, color, 0, 'loading');
  }

  /**
   * In-app replacement for window.confirm(). Native dialogs render as "site says…" on Android,
   * are dismissed by rotation, and look broken in an installed PWA — so ask inside the app instead.
   * Resolves true when confirmed, false on cancel / backdrop dismiss.
   */
  confirm(text: string, opts: { confirmLabel?: string; cancelLabel?: string; color?: MessageColor } = {}): Promise<boolean> {
    this.clearTimeouts();
    this.settlePending();
    return new Promise<boolean>(resolve => {
      this.messageSubject.next({
        text,
        color: opts.color ?? 'yellow',
        durationMs: 0,
        type: 'confirm',
        isMinimized: false,
        confirmLabel: opts.confirmLabel ?? 'OK',
        cancelLabel: opts.cancelLabel ?? 'Cancel',
        resolve: (v: boolean) => resolve(v),
      });
    });
  }

  /** In-app replacement for window.prompt(). Resolves the entered text, or null on cancel. */
  promptText(text: string, opts: { placeholder?: string; initialValue?: string; confirmLabel?: string; cancelLabel?: string } = {}): Promise<string | null> {
    this.clearTimeouts();
    this.settlePending();
    return new Promise<string | null>(resolve => {
      this.messageSubject.next({
        text,
        color: 'white',
        durationMs: 0,
        type: 'prompt',
        isMinimized: false,
        placeholder: opts.placeholder ?? '',
        initialValue: opts.initialValue ?? '',
        confirmLabel: opts.confirmLabel ?? 'Save',
        cancelLabel: opts.cancelLabel ?? 'Cancel',
        resolve: (v: string | null) => resolve(v),
      });
    });
  }

  private show(text: string, color: MessageColor, durationMs: number, type: MessageType) {
    this.clearTimeouts();
    this.settlePending();

    this.messageSubject.next({
      text,
      color,
      durationMs,
      type,
      isMinimized: false
    });

    // durationMs of 0 means "stay until explicitly dismissed" (loading)
    if (durationMs > 0) {
      this.timeoutId = setTimeout(() => {
        this.hideMessage();
      }, durationMs);
    }
  }

  private minimizeMessage() {
    const current = this.messageSubject.value;
    if (current && current.type === 'informational') {
      this.messageSubject.next({ ...current, isMinimized: true });
    }
  }

  hideMessage() {
    this.clearTimeouts();
    this.settlePending();
    this.messageSubject.next(null);
  }

  /**
   * Settle an in-flight confirm/prompt as "cancelled" so an awaiting caller can never hang — e.g.
   * a navigation, or any newer message superseding the dialog while it is still open.
   */
  private settlePending() {
    const current = this.messageSubject.value;
    if (current?.resolve) {
      current.resolve(current.type === 'confirm' ? false : null);
      // Drop the resolver so a later hideMessage() can't settle the same promise twice.
      this.messageSubject.next({ ...current, resolve: undefined });
    }
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
