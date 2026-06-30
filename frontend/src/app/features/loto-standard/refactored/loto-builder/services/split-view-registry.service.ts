import { Injectable, signal } from '@angular/core';
import { FileDto } from '../../../../../models/file/file.model';

/**
 * Loto-builder split-view registry. Components that own the split-view UI
 * (currently {@code LotoBuilderRightPanelComponent}) register a handler
 * here on mount, unregister on destroy. The file-list context menu calls
 * {@link openIfAvailable} when the user picks "Open in split view"; if a
 * handler is registered, it runs — otherwise the call is a no-op.
 *
 * <p>This indirection lets a globally-provided {@code FileContextMenuService}
 * surface the menu item without taking a hard dependency on the loto-builder
 * component (a cross-feature coupling we want to avoid). The menu item still
 * appears in every file-list context menu, but it ONLY does something when
 * the loto-builder is mounted — outside that scope it's a silent no-op.
 *
 * <p>Singleton ({@code providedIn: 'root'}) so all consumers see the same
 * handler reference. {@code signal} for the handler is a deliberate choice
 * over a plain field — lets the context menu service compute action
 * visibility reactively if it ever wants to (currently it doesn't bother;
 * silent no-op is fine).
 */
@Injectable({ providedIn: 'root' })
export class SplitViewRegistryService {
  /** Active handler, or null when no loto-builder is mounted. */
  private handler = signal<((file: FileDto) => void) | null>(null);

  isAvailable = () => this.handler() !== null;

  setHandler(handler: ((file: FileDto) => void) | null): void {
    this.handler.set(handler);
  }

  openIfAvailable(file: FileDto): void {
    const h = this.handler();
    if (h) h(file);
  }
}
