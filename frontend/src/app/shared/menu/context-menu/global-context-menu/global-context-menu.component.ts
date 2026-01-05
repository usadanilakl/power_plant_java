import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContextMenuComponent } from '../context-menu.component';
import { ContextMenuRegistryService } from '../context-menu-registry.service';

/**
 * Global context menu component that renders a single context menu instance.
 * It dynamically uses whichever context menu service is currently active.
 *
 * This component should be placed once at the app root level to avoid
 * multiple context menu instances causing race conditions.
 */
@Component({
  selector: 'app-global-context-menu',
  standalone: true,
  imports: [CommonModule, ContextMenuComponent],
  template: `
    @if (activeService()) {
      <app-context-menu
        [selectedItem]="selectedItem()"
        [isVisible]="isVisible()"
        [position]="position()"
        [actions]="actions()"
        (closeMenu)="closeMenu()"
      ></app-context-menu>
    }
  `,
})
export class GlobalContextMenuComponent {
  private registry = inject(ContextMenuRegistryService);

  activeService = this.registry.activeService;

  selectedItem = computed(() => this.activeService()?.contextMenuSelectedItem() ?? null);
  isVisible = computed(() => this.activeService()?.contextMenuVisible() ?? false);
  position = computed(() => this.activeService()?.contextMenuPosition() ?? { x: 0, y: 0 });
  actions = computed(() => this.activeService()?.contextMenuActions ?? []);

  closeMenu(): void {
    this.activeService()?.closeContextMenu();
  }
}
