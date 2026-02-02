import { Injectable, signal } from '@angular/core';

export interface WindowPosition {
  x: number;
  y: number;
}

export interface WindowSize {
  width: number;
  height: number;
}

export interface DraggableWindow {
  id: string;
  zIndex: number;
  position: WindowPosition;
  size: WindowSize;
}

@Injectable({
  providedIn: 'root'
})
export class DraggableWindowService {
  private baseZIndex = 500;
  private maxZIndex = signal<number>(this.baseZIndex);

  private windows = signal<Map<string, DraggableWindow>>(new Map());

  /**
   * Register a new draggable window
   */
  registerWindow(
    id: string,
    initialPosition?: WindowPosition,
    initialSize?: WindowSize
  ): DraggableWindow {
    const currentWindows = this.windows();

    // If window already exists, return it
    const existing = currentWindows.get(id);
    if (existing) {
      return existing;
    }

    const newZIndex = this.maxZIndex() + 1;
    this.maxZIndex.set(newZIndex);

    const window: DraggableWindow = {
      id,
      zIndex: newZIndex,
      position: initialPosition || { x: 0, y: 0 },
      size: initialSize || { width: 400, height: 300 }
    };

    const updatedWindows = new Map(currentWindows);
    updatedWindows.set(id, window);
    this.windows.set(updatedWindows);

    return window;
  }

  /**
   * Unregister a window when it's closed
   */
  unregisterWindow(id: string): void {
    const currentWindows = this.windows();
    const updatedWindows = new Map(currentWindows);
    updatedWindows.delete(id);
    this.windows.set(updatedWindows);
  }

  /**
   * Bring a window to the front (highest z-index).
   * Capped below context menu / modal z-index levels.
   */
  bringToFront(id: string): number {
    const currentWindows = this.windows();
    const window = currentWindows.get(id);

    if (!window) {
      return this.baseZIndex;
    }

    let newZIndex = this.maxZIndex() + 1;
    // Reset if approaching overlay/context-menu z-index territory
    if (newZIndex > 9000) {
      newZIndex = this.baseZIndex + 1;
      // Re-normalize all windows
      currentWindows.forEach((w, wId) => {
        if (wId !== id) {
          const updatedWindows = new Map(this.windows());
          updatedWindows.set(wId, { ...w, zIndex: this.baseZIndex });
          this.windows.set(updatedWindows);
        }
      });
    }
    this.maxZIndex.set(newZIndex);

    const updatedWindow = { ...window, zIndex: newZIndex };
    const updatedWindows = new Map(currentWindows);
    updatedWindows.set(id, updatedWindow);
    this.windows.set(updatedWindows);

    return newZIndex;
  }

  /**
   * Update window position
   */
  updatePosition(id: string, position: WindowPosition): void {
    const currentWindows = this.windows();
    const window = currentWindows.get(id);

    if (!window) {
      return;
    }

    const updatedWindow = { ...window, position };
    const updatedWindows = new Map(currentWindows);
    updatedWindows.set(id, updatedWindow);
    this.windows.set(updatedWindows);
  }

  /**
   * Update window size
   */
  updateSize(id: string, size: WindowSize): void {
    const currentWindows = this.windows();
    const window = currentWindows.get(id);

    if (!window) {
      return;
    }

    const updatedWindow = { ...window, size };
    const updatedWindows = new Map(currentWindows);
    updatedWindows.set(id, updatedWindow);
    this.windows.set(updatedWindows);
  }

  /**
   * Update both position and size
   */
  updatePositionAndSize(id: string, position: WindowPosition, size: WindowSize): void {
    const currentWindows = this.windows();
    const window = currentWindows.get(id);

    if (!window) {
      return;
    }

    const updatedWindow = { ...window, position, size };
    const updatedWindows = new Map(currentWindows);
    updatedWindows.set(id, updatedWindow);
    this.windows.set(updatedWindows);
  }

  /**
   * Get current z-index for a window
   */
  getZIndex(id: string): number {
    const window = this.windows().get(id);
    return window?.zIndex || this.baseZIndex;
  }

  /**
   * Get current position for a window
   */
  getPosition(id: string): WindowPosition | null {
    const window = this.windows().get(id);
    return window?.position || null;
  }

  /**
   * Get current size for a window
   */
  getSize(id: string): WindowSize | null {
    const window = this.windows().get(id);
    return window?.size || null;
  }

  /**
   * Get window state
   */
  getWindow(id: string): DraggableWindow | null {
    return this.windows().get(id) || null;
  }

  /**
   * Reset all windows
   */
  reset(): void {
    this.windows.set(new Map());
    this.maxZIndex.set(this.baseZIndex);
  }
}
