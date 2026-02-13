/**
 * WindowLayoutManager - Persists and restores window positions/sizes across app restarts.
 * Saves window-layout.json to getWorkingDir() following the DeviceConfigManager pattern.
 */

import { BrowserWindow, screen } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { getWorkingDir } from '../paths';
import type { WindowBounds, WindowLayoutConfig } from '../../shared/types';

const LAYOUT_FILE = 'window-layout.json';

export class WindowLayoutManager {
  private layout: WindowLayoutConfig;
  private workingDir: string;

  constructor() {
    this.workingDir = getWorkingDir();
    this.layout = this.load();
  }

  /** Get saved bounds for a window, validated against current displays. Returns null if invalid or not saved. */
  public getBounds(id: string): WindowBounds | null {
    const saved = this.layout[id];
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

  /** Save current bounds of a single window. */
  public saveBounds(id: string, win: BrowserWindow): void {
    if (win.isDestroyed()) return;

    const isMaximized = win.isMaximized();
    // Use normal bounds (not maximized bounds) so restore position works correctly
    const bounds = isMaximized ? win.getNormalBounds() : win.getBounds();

    this.layout[id] = {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      isMaximized,
    };

    this.persist();
  }

  /** Save bounds of all provided windows at once. */
  public saveAll(windows: Record<string, BrowserWindow | null>): void {
    for (const [id, win] of Object.entries(windows)) {
      if (win && !win.isDestroyed()) {
        const isMaximized = win.isMaximized();
        const bounds = isMaximized ? win.getNormalBounds() : win.getBounds();
        this.layout[id] = {
          x: bounds.x,
          y: bounds.y,
          width: bounds.width,
          height: bounds.height,
          isMaximized,
        };
      }
    }
    this.persist();
    console.log(`[Layout] Saved layout for ${Object.keys(windows).filter(k => windows[k] && !windows[k]!.isDestroyed()).length} window(s)`);
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

  private load(): WindowLayoutConfig {
    const filePath = path.join(this.workingDir, LAYOUT_FILE);
    if (!fs.existsSync(filePath)) {
      return {};
    }

    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      console.log(`[Layout] Loaded window layout (${Object.keys(data).length} window(s))`);
      return data as WindowLayoutConfig;
    } catch (err) {
      console.error('[Layout] Error loading window-layout.json:', err);
      return {};
    }
  }

  private persist(): void {
    const filePath = path.join(this.workingDir, LAYOUT_FILE);
    try {
      fs.writeFileSync(filePath, JSON.stringify(this.layout, null, 2), 'utf-8');
    } catch (err) {
      console.error('[Layout] Error saving window-layout.json:', err);
    }
  }
}
