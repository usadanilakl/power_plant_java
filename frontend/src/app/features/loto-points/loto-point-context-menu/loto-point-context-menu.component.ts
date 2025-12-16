
import { Component, inject, input, output, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LotoPointDto } from '../../../models/loto/loto-point.model';

export interface ContextMenuAction {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  divider?: boolean;
  action: (item: LotoPointDto) => void;
}

@Component({
  selector: 'app-loto-point-context-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loto-point-context-menu.component.html',
  styleUrl: './loto-point-context-menu.component.css'
})
export class LotoPointContextMenuComponent implements AfterViewInit {
  @ViewChild('menuContainer') menuContainer!: ElementRef<HTMLDivElement>;

  selectedItem = input<LotoPointDto | null>(null);
  isVisible = input<boolean>(false);
  position = input<{ x: number; y: number }>({ x: 0, y: 0 });
  actions = input<ContextMenuAction[]>([]);

  actionSelected = output<{ action: ContextMenuAction; item: LotoPointDto }>();
  closeMenu = output<void>();
  positionAdjusted = output<{ x: number; y: number }>();

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
    const item = this.selectedItem();
    if (item && !action.disabled) {
      action.action(item);
      this.actionSelected.emit({ action, item });
      this.closeMenu.emit();
    }
  }

  onBackdropClick(): void {
    this.closeMenu.emit();
  }
}


// import { Component, inject, input, output } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { LotoPointDto } from '../../../models/loto/loto-point.model';

// export interface ContextMenuAction {
//   id: string;
//   label: string;
//   icon?: string;
//   disabled?: boolean;
//   divider?: boolean;
//   action: (item: LotoPointDto) => void;
// }

// @Component({
//   selector: 'app-loto-point-context-menu',
//   standalone: true,
//   imports: [CommonModule],
//   templateUrl: './loto-point-context-menu.component.html',
//   styleUrl: './loto-point-context-menu.component.css'
// })
// export class LotoPointContextMenuComponent {
//   // Inputs
//   selectedItem = input<LotoPointDto | null>(null);
//   isVisible = input<boolean>(false);
//   position = input<{ x: number; y: number }>({ x: 0, y: 0 });
//   actions = input<ContextMenuAction[]>([]);

//   // Outputs
//   actionSelected = output<{ action: ContextMenuAction; item: LotoPointDto }>();
//   closeMenu = output<void>();

//   onActionClick(action: ContextMenuAction): void {
//     const item = this.selectedItem();
//     if (item && !action.disabled) {
//       action.action(item);
//       this.actionSelected.emit({ action, item });
//       this.closeMenu.emit();
//     }
//   }

//   onBackdropClick(): void {
//     this.closeMenu.emit();
//   }
// }
