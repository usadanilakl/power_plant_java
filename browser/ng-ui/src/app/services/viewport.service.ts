import { Injectable } from '@angular/core';

/**
 * Read-only queries about the current viewport.
 *
 * This used to rewrite the <meta name="viewport"> tag on every resize and force the page back to
 * "mobile view" whenever `innerWidth > screen.width * 1.5`. That heuristic was unreliable, and on a
 * tablet where someone had deliberately asked for the desktop site it overrode their choice. The
 * static meta tag in index.html is the single source of truth now — it already sets
 * `width=device-width, viewport-fit=cover` and keeps pinch-zoom available via `maximum-scale=5`.
 */
@Injectable({
  providedIn: 'root'
})
export class ViewportService {

  /** True when running as an installed PWA rather than a browser tab. */
  isStandalone(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  }

  /** Coarse device class by width. Matches the 768px breakpoint used across the app's CSS. */
  getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const width = window.innerWidth;

    if (width < 768) {
      return 'mobile';
    } else if (width < 1024) {
      return 'tablet';
    } else {
      return 'desktop';
    }
  }
}
