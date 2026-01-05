import { Injectable, signal } from '@angular/core';
import { ContextMenuService } from './context-menu.service';

/**
 * Registry service that tracks the currently active context menu service.
 * This allows a single global context menu component to work with multiple
 * entity-specific context menu services (File, LotoPoint, etc.)
 */
@Injectable({ providedIn: 'root' })
export class ContextMenuRegistryService {
  /** The currently active context menu service */
  activeService = signal<ContextMenuService | null>(null);

  /**
   * Set the active context menu service.
   * Called by entity-specific services when they show their context menu.
   */
  setActive(service: ContextMenuService): void {
    // Close any previously active context menu
    const current = this.activeService();
    if (current && current !== service) {
      current.closeContextMenu();
    }
    this.activeService.set(service);
  }

  /**
   * Clear the active service when context menu is closed.
   */
  clearActive(): void {
    this.activeService.set(null);
  }
}
