## Window Layout Persistence

Saves and restores Electron window positions, sizes, and maximized state across app restarts. Stored as `window-layout.json` in `getWorkingDir()` following the same config pattern as `device-config.json` and `pjm-config.json`.

## Tracked Windows

| Window ID | Created In | Default Size |
|-----------|-----------|-------------|
| `main` | `main-window.manager.ts` | 1200x800, centered |
| `permits-monitor` | `handlers.ts` (registerPermitsHandlers) | 1200x800 |
| `pjm-voyager` | `pjm.manager.ts` (showWindow) | 1400x900 |

## Save/Restore Strategy

- **Auto-save**: Each window's bounds saved on `move`/`resize` (debounced 1s) and on `close` (immediate)
- **Menu item**: File > "Save Window Layout" saves ALL open windows at once
- **Auto-restore**: When any tracked window is created, saved bounds are applied if valid
- **Multi-monitor validation**: `screen.getDisplayMatching(bounds)` checks if saved position overlaps an available display. If the saved position is on a disconnected monitor, window falls back to default position/size.

## Data Format

`window-layout.json`:
```json
{
  "main": { "x": 100, "y": 50, "width": 1400, "height": 900, "isMaximized": false },
  "permits-monitor": { "x": 1920, "y": 0, "width": 1200, "height": 800, "isMaximized": false },
  "pjm-voyager": { "x": 200, "y": 100, "width": 1400, "height": 900, "isMaximized": true }
}
```

## Implementation Details

### Main Process
- `window-layout.manager.ts` - Manages `window-layout.json` persistence
  - `constructor()` - Loads layout from `getWorkingDir()`
  - `getBounds(id)` - Returns saved bounds validated against current displays, or `null` if invalid/missing
  - `saveBounds(id, window)` - Captures current bounds + maximized state (uses `getNormalBounds()` when maximized)
  - `saveAll(windows)` - Saves all provided windows at once
  - `trackWindow(id, window)` - Attaches debounced move/resize + close listeners for auto-save

### Shared Types
```ts
interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  isMaximized: boolean;
}

interface WindowLayoutConfig {
  [windowId: string]: WindowBounds;
}
```

### Electron IPC Channels
- `layout:save` (invoke/handle) - Save all tracked window layouts at once

### Preload API
- `saveWindowLayout()` - Invoke to save all window positions

### Integration Points
- `MainWindowManager` - Accepts `WindowLayoutManager` in constructor, applies saved bounds in `createWindow()`, tracks window
- `IpcHandlers` - Accepts `WindowLayoutManager` in constructor, applies saved bounds for permits monitor window, exposes `saveAllWindowLayouts()` for menu item
- `PjmManager` - Accepts `WindowLayoutManager` in constructor, applies saved bounds for Voyager window
- `App.ts` - Creates `WindowLayoutManager` in `onReady()` after `ensureWorkingDir()`, passes to all managers. File > "Save Window Layout" menu item calls `saveAllWindowLayouts()`

### Multi-Monitor Validation
When restoring saved bounds, `getBounds()` checks that the saved rectangle overlaps at least one pixel of any available display using `screen.getDisplayMatching(rect)`. If the saved position doesn't overlap (monitor disconnected), returns `null` and the window uses its default position.
