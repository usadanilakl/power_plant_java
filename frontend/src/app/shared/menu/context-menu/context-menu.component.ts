
import { Component, inject, input, output, ViewChild, ElementRef, AfterViewInit, effect, DestroyRef, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { fromEvent } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export interface ContextMenuAction {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  divider?: boolean;
  action: (item: any) => void;
}

@Component({
  selector: 'app-context-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './context-menu.component.html',
  styleUrl: './context-menu.component.css'
})
export class ContextMenuComponent implements AfterViewInit {
  @ViewChild('menuContainer') menuContainer!: ElementRef<HTMLDivElement>;

  private destroyRef = inject(DestroyRef);
  private platformId = inject(PLATFORM_ID);

  selectedItem = input<any | null>(null);
  isVisible = input<boolean>(false);
  position = input<{ x: number; y: number }>({ x: 0, y: 0 });
  actions = input<ContextMenuAction[]>([]);

  actionSelected = output<{ action: ContextMenuAction; item: any }>();
  closeMenu = output<void>();
  positionAdjusted = output<{ x: number; y: number }>();

  constructor() {
    // Listen for clicks on document to close menu when clicking outside
    // Only run in browser environment (not during SSR)
    if (isPlatformBrowser(this.platformId)) {
      fromEvent<MouseEvent>(document, 'mousedown')
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((event) => {
          if (!this.isVisible()) return;

          // Check if click is outside the menu container
          if (this.menuContainer && !this.menuContainer.nativeElement.contains(event.target as Node)) {
            this.closeMenu.emit();
          }
        });
    }

    // React to visibility changes to adjust position
    effect(() => {
      if (this.isVisible()) {
        setTimeout(() => this.adjustPositionIfNeeded(), 0);
      }
    });
  }

  ngAfterViewInit(): void {
    this.adjustPositionIfNeeded();
  }

  private adjustPositionIfNeeded(): void {
    if (!this.menuContainer) return;

    const menu = this.menuContainer.nativeElement;
    const rect = menu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const padding = 10;

    let adjustedX = this.position().x;
    let adjustedY = this.position().y;

    // Adjust for right overflow
    if (rect.right + padding > viewportWidth) {
      adjustedX = viewportWidth - rect.width - padding;
    }

    // Adjust for bottom overflow
    if (rect.bottom + padding > viewportHeight) {
      adjustedY = viewportHeight - rect.height - padding;
    }

    // Ensure not off-screen left/top
    adjustedX = Math.max(padding, adjustedX);
    adjustedY = Math.max(padding, adjustedY);

    if (adjustedX !== this.position().x || adjustedY !== this.position().y) {
      this.positionAdjusted.emit({ x: adjustedX, y: adjustedY });
      menu.style.left = `${adjustedX}px`;
      menu.style.top = `${adjustedY}px`;
    }
  }

  onActionClick(action: ContextMenuAction): void {
    console.log('[ContextMenu] onActionClick - action:', action.id, action.label);
    const item = this.selectedItem();
    console.log('[ContextMenu] onActionClick - selectedItem:', item);
    if (item && !action.disabled) {
      console.log('[ContextMenu] Executing action...');
      action.action(item);
      this.actionSelected.emit({ action, item });
      this.closeMenu.emit();
    } else {
      console.log('[ContextMenu] Action skipped - item:', !!item, 'disabled:', action.disabled);
    }
  }
}
