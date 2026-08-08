import { Injectable } from '@angular/core';

/** Distinct buzz patterns, in ms. Kept short — this is confirmation, not an alarm. */
const PATTERNS: Record<HapticKind, number | number[]> = {
  tap: 10,
  success: 18,
  error: [30, 60, 30],
  warn: [20, 50, 20],
};

export type HapticKind = 'tap' | 'success' | 'error' | 'warn';

/**
 * Short vibration feedback for field actions — confirming a Pass/Fail tap or a QR scan without
 * having to read a sun-washed screen at arm's length.
 *
 * Android/Chrome only: iOS Safari does not implement the Vibration API at all, so every call is a
 * silent no-op there. Treat haptics as an enhancement and never as the only confirmation of an
 * action; each call site also shows a visual state change.
 */
@Injectable({ providedIn: 'root' })
export class HapticsService {
  private readonly supported = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';

  /** Fire a short pattern. No-ops when unsupported, or when the OS asks for reduced motion. */
  tap(kind: HapticKind = 'tap'): void {
    if (!this.supported || this.reducedMotion()) return;
    try {
      navigator.vibrate(PATTERNS[kind]);
    } catch {
      // Some browsers throw when the document isn't focused or has had no user gesture yet.
      // Feedback is optional; never let it break the interaction that triggered it.
    }
  }

  private reducedMotion(): boolean {
    return typeof window !== 'undefined'
      && typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
}
