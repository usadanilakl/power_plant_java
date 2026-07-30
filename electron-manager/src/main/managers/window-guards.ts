/**
 * Guards for BrowserWindows that render third-party web content.
 *
 * Electron's default `setWindowOpenHandler` behaviour is ALLOW — with no handler registered,
 * a `window.open()` from the page (or from any third-party ad iframe inside it) spawns a real,
 * visible, top-level window with no address bar. On 2026-07-30 that path popped a tech-support
 * scam locker (fullscreen "call this number" dialog loop) out of the *hidden* WeatherBug scraper
 * window on a plant desktop; a modal JS dialog loop blocks the app menu, so the only recovery
 * was Task Manager.
 *
 * Headless scraper windows never have a legitimate popup, so they deny unconditionally.
 */

import { app } from 'electron';
import type { BrowserWindow } from 'electron';

/**
 * Our own content — the renderer, and the Angular app served by the local Spring Boot process.
 * It opens popups legitimately (print views, file viewers, `popup-window.service`), so it keeps
 * the default behaviour. Everything else on the public internet does not.
 */
function isTrustedOrigin(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol === 'file:') return true;
    const host = u.hostname.toLowerCase();
    return host === 'localhost' || host === '127.0.0.1' || host === '::1';
  } catch {
    return false;   // '' (not yet navigated), about:blank, data: — treat as untrusted
  }
}

/**
 * App-wide backstop, installed once before any window is created. Guarantees that a
 * `BrowserWindow` added later without an explicit guard still cannot be used to pop a window
 * out of a remote page, which is exactly how the 2026-07-30 locker got on screen.
 *
 * Managers that need different behaviour register their own `setWindowOpenHandler` afterwards —
 * the last registration wins, so this is a default, not a ceiling.
 */
export function installGlobalWindowGuards(): void {
  app.on('web-contents-created', (_event, contents) => {
    contents.setWindowOpenHandler(({ url }) => {
      const opener = contents.getURL();
      if (isTrustedOrigin(opener)) return { action: 'allow' };
      console.warn(`[WindowGuard] blocked popup from ${opener || '<no url>'}: ${url}`);
      return { action: 'deny' };
    });

    // Lockers chain `beforeunload` handlers so the window cannot be closed. Remote pages lose
    // that ability; our own pages keep it, so real "unsaved changes" prompts still work.
    contents.on('will-prevent-unload', (event) => {
      const url = contents.getURL();
      if (isTrustedOrigin(url)) return;
      console.warn(`[WindowGuard] overrode beforeunload trap: ${url}`);
      event.preventDefault();   // preventDefault here = let the close proceed
    });
  });
}

/**
 * Deny every popup this window tries to open, and log the URL so the redirect chain is
 * recoverable after the fact.
 */
export function denyPopups(win: BrowserWindow, tag: string): void {
  win.webContents.setWindowOpenHandler(({ url }) => {
    console.warn(`[${tag}] blocked popup: ${url}`);
    return { action: 'deny' };
  });
}

/**
 * Deny popups AND pin top-level navigation to `allowedHosts` (host or any subdomain of it).
 * Without this a malvertising redirect can navigate the scrape target off-site entirely, after
 * which the scrape silently reports `unavailable` forever with no indication why.
 */
export function pinWindowToHosts(win: BrowserWindow, allowedHosts: string[], tag: string): void {
  denyPopups(win, tag);

  const hosts = allowedHosts.map(h => h.toLowerCase());
  const isAllowed = (url: string): boolean => {
    try {
      const host = new URL(url).hostname.toLowerCase();
      return hosts.some(h => host === h || host.endsWith(`.${h}`));
    } catch {
      return false;  // unparseable (data:, about:blank#blocked, javascript:) — not a real navigation
    }
  };

  const block = (event: { preventDefault: () => void }, url: string, kind: string): void => {
    if (isAllowed(url)) return;
    console.warn(`[${tag}] blocked ${kind}: ${url}`);
    event.preventDefault();
  };

  win.webContents.on('will-navigate', (event, url) => block(event, url, 'navigation'));
  win.webContents.on('will-redirect', (event, url) => block(event, url, 'redirect'));
}
