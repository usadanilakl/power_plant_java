/**
 * WindowLayoutManager - Persists and restores window positions/sizes across app restarts.
 * Saves window-layout.json to getWorkingDir() following the DeviceConfigManager pattern.
 *
 * File format:
 * {
 *   "windows": { "main": { x, y, width, height, isMaximized }, ... },
 *   "openWindows": ["permits-monitor", "pjm-voyager"]
 * }
 */

import { BrowserWindow, screen } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { getWorkingDir } from '../paths';
import type { WindowBounds, WindowLayoutConfig } from '../../shared/types';

const LAYOUT_FILE = 'window-layout.json';

interface LayoutFile {
  windows: WindowLayoutConfig;
  openWindows: string[];
}

export class WindowLayoutManager {
  private data: LayoutFile;
  private workingDir: string;

  constructor() {
    this.workingDir = getWorkingDir();
    this.data = this.load();
  }

  /** Get saved bounds for a window, validated against current displays. Returns null if invalid or not saved. */
  public getBounds(id: string): WindowBounds | null {
    const saved = this.data.windows[id];
    if (!saved) return null;

    // Validate that saved position overlaps at least one available display
    const rect = { x: saved.x, y: saved.y, width: saved.width, height: saved.height };
    const display = screen.getDisplayMatching(rect);
    const db = display.bounds;

    const overlaps =
      saved.x < db.x + db.width &&
      saved.x + saved.width > db.x &&
      saved.y < db.y + db.height &&
      saved.y + saved.height > db.y;

    if (!overlaps) {
      console.log(`[Layout] Saved bounds for '${id}' don't overlap any display — using defaults`);
      return null;
    }

    return saved;
  }

  /** Get list of secondary window IDs that were open at last quit (excludes 'main'). */
  public getOpenWindows(): string[] {
    return this.data.openWindows.filter(id => id !== 'main');
  }

  /** Save current bounds of a single window. */
  public saveBounds(id: string, win: BrowserWindow): void {
    if (win.isDestroyed()) return;

    const isMaximized = win.isMaximized();
    // Use normal bounds (not maximized bounds) so restore position works correctly
    const bounds = isMaximized ? win.getNormalBounds() : win.getBounds();

    this.data.windows[id] = {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      isMaximized,
    };

    this.persist();
  }

  /** Save bounds of all provided windows at once + record which are open. */
  public saveAll(windows: Record<string, BrowserWindow | null>): void {
    const openWindows: string[] = [];

    for (const [id, win] of Object.entries(windows)) {
      if (win && !win.isDestroyed()) {
        const isMaximized = win.isMaximized();
        const bounds = isMaximized ? win.getNormalBounds() : win.getBounds();
        this.data.windows[id] = {
          x: bounds.x,
          y: bounds.y,
          width: bounds.width,
          height: bounds.height,
          isMaximized,
        };
        if (id !== 'main') {
          openWindows.push(id);
        }
      }
    }

    this.data.openWindows = openWindows;
    this.persist();
    console.log(`[Layout] Saved layout for ${Object.keys(windows).filter(k => windows[k] && !windows[k]!.isDestroyed()).length} window(s), open: [${openWindows.join(', ')}]`);
  }

  /** Attach move/resize/close listeners to auto-save window bounds (debounced). */
  public trackWindow(id: string, win: BrowserWindow): void {
    let saveTimeout: NodeJS.Timeout | null = null;

    const debouncedSave = () => {
      if (win.isDestroyed()) return;
      if (saveTimeout) clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        if (!win.isDestroyed()) {
          this.saveBounds(id, win);
        }
      }, 1000);
    };

    win.on('move', debouncedSave);
    win.on('resize', debouncedSave);
    win.on('close', () => {
      if (saveTimeout) clearTimeout(saveTimeout);
      if (!win.isDestroyed()) {
        this.saveBounds(id, win);
      }
    });
  }

  private load(): LayoutFile {
    const filePath = path.join(this.workingDir, LAYOUT_FILE);
    if (!fs.existsSync(filePath)) {
      return { windows: {}, openWindows: [] };
    }

    try {
      const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

      // New format: { windows: {...}, openWindows: [...] }
      if (raw.windows && typeof raw.windows === 'object' && !raw.windows.x) {
        const data = raw as LayoutFile;
        if (!Array.isArray(data.openWindows)) data.openWindows = [];
        console.log(`[Layout] Loaded layout (${Object.keys(data.windows).length} window(s), open: [${data.openWindows.join(', ')}])`);
        return data;
      }

      // Old flat format: { "main": { x, y, ... }, ... } — migrate
      console.log('[Layout] Migrating old flat layout format');
      const windows = raw as WindowLayoutConfig;
      return { windows, openWindows: [] };
    } catch (err) {
      console.error('[Layout] Error loading window-layout.json:', err);
      return { windows: {}, openWindows: [] };
    }
  }

  private persist(): void {
    const filePath = path.join(this.workingDir, LAYOUT_FILE);
    try {
      fs.writeFileSync(filePath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[Layout] Error saving window-layout.json:', err);
    }
  }
}
