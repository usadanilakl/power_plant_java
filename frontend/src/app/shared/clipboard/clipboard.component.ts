import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ClipboardService } from './clipboard.service';

@Component({
  selector: 'app-clipboard',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './clipboard.component.html',
  styleUrl: './clipboard.component.css',
})
export class ClipboardComponent {
  private clipboardService = inject(ClipboardService);

  sections = this.clipboardService.sections;
  activeSection = this.clipboardService.activeSection;
  isExpanded = this.clipboardService.isClipboardExpanded;

  // Dragging state
  iconPosition = signal<{ x: number; y: number }>({ x: 20, y: 80 });
  windowPosition = signal<{ x: number; y: number }>({ x: 20, y: 20 });
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private elementStartX = 0;
  private elementStartY = 0;
  private dragTarget: 'icon' | 'window' | null = null;

  // Dialog state for item details
  selectedItem = signal<any>(null);
  showItemDialog = signal<boolean>(false);

  // Computed signal to show item count
  itemCount = computed(() => {
    const active = this.activeSection();
    return active?.items.length ?? 0;
  });

  // Computed to get total item count across all sections
  totalItemCount = computed(() => {
    return this.sections().reduce((total, section) => total + section.items.length, 0);
  });

  toggleClipboard(): void {
    this.clipboardService.toggleExpanded();
  }

  setActiveSection(sectionId: string): void {
    this.clipboardService.setActiveSection(sectionId);
  }

  deleteSection(sectionId: string): void {
    this.clipboardService.deleteSection(sectionId);
  }

  clearSection(sectionId: string): void {
    this.clipboardService.clearSection(sectionId);
  }

  removeItem(sectionId: string, itemIndex: number): void {
    this.clipboardService.removeItemFromSection(sectionId, itemIndex);
  }

  copyToClipboard(item: any): void {
    const text = JSON.stringify(item, null, 2);
    navigator.clipboard.writeText(text).then(() => {
      console.log('Item copied to system clipboard');
    });
  }

  // ============ DRAGGING FUNCTIONALITY ============
  onDragStart(event: MouseEvent, target: 'icon' | 'window'): void {
    // For window, prevent drag if clicking on close button or interactive elements
    if (target === 'window') {
      const targetElement = event.target as HTMLElement;
      if (targetElement.closest('button') || targetElement.closest('.section-tab') || targetElement.closest('.item-actions')) {
        return;
      }
    }

    this.isDragging = true;
    this.dragTarget = target;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;

    const position = target === 'icon' ? this.iconPosition() : this.windowPosition();
    this.elementStartX = position.x;
    this.elementStartY = position.y;

    // Add document-level listeners
    document.addEventListener('mousemove', this.onDragMove);
    document.addEventListener('mouseup', this.onDragEnd);

    event.preventDefault();
  }

  private wasDragged = false;

  onIconClick(): void {
    // Only toggle if we didn't just finish dragging
    if (!this.wasDragged) {
      this.toggleClipboard();
    }
    this.wasDragged = false;
  }

  private onDragMove = (event: MouseEvent): void => {
    if (!this.isDragging || !this.dragTarget) return;

    const deltaX = event.clientX - this.dragStartX;
    const deltaY = event.clientY - this.dragStartY;

    // Mark as dragged if moved more than 5 pixels
    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
      this.wasDragged = true;
    }

    // Calculate new position (from right and bottom for our positioning)
    const newX = Math.max(0, this.elementStartX - deltaX);
    const newY = Math.max(0, this.elementStartY - deltaY);

    if (this.dragTarget === 'icon') {
      this.iconPosition.set({ x: newX, y: newY });
    } else {
      this.windowPosition.set({ x: newX, y: newY });
    }
  };

  private onDragEnd = (): void => {
    this.isDragging = false;
    this.dragTarget = null;
    document.removeEventListener('mousemove', this.onDragMove);
    document.removeEventListener('mouseup', this.onDragEnd);
  };

  // ============ ITEM DETAIL DIALOG ============
  openItemDialog(item: any): void {
    this.selectedItem.set(item);
    this.showItemDialog.set(true);
  }

  closeItemDialog(): void {
    this.showItemDialog.set(false);
    this.selectedItem.set(null);
  }

  getItemSummary(item: any): string {
    // Create a brief summary based on common properties
    if (item.tagNumber) {
      return `${item.tagNumber} - ${item.description || 'No description'}`;
    }
    if (item.name) {
      return `${item.name} - ${item.fileType?.name || item.fileType || 'No type'}`;
    }
    return JSON.stringify(item).substring(0, 60) + '...';
  }

  /**
   * Format item properties for human-readable display in dialog
   */
  getFormattedItemProperties(item: any): { key: string; value: string; isNested: boolean }[] {
    if (!item) return [];

    const result: { key: string; value: string; isNested: boolean }[] = [];

    for (const [key, value] of Object.entries(item)) {
      // Skip objectType as it's metadata
      if (key === 'objectType') continue;

      const formattedKey = this.formatPropertyName(key);
      const formattedValue = this.formatPropertyValue(value);
      const isNested = typeof value === 'object' && value !== null && !Array.isArray(value);

      result.push({ key: formattedKey, value: formattedValue, isNested });
    }

    return result;
  }

  private formatPropertyName(key: string): string {
    // Convert camelCase to Title Case with spaces
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  private formatPropertyValue(value: any): string {
    if (value === null || value === undefined) {
      return '-';
    }

    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    if (Array.isArray(value)) {
      if (value.length === 0) return '-';
      // Check if array contains objects with names/ids
      if (value[0] && typeof value[0] === 'object') {
        return value.map(v => v.name || v.id || JSON.stringify(v)).join(', ');
      }
      return value.join(', ');
    }

    if (typeof value === 'object') {
      // Handle ValueDto-like objects (id + name)
      if (value.name) {
        return value.name;
      }
      if (value.id !== undefined) {
        return `ID: ${value.id}`;
      }
      // For other objects, show key-value pairs
      const entries = Object.entries(value)
        .filter(([k, v]) => v !== null && v !== undefined && v !== '')
        .map(([k, v]) => `${this.formatPropertyName(k)}: ${v}`)
        .join(', ');
      return entries || '-';
    }

    return String(value);
  }
}
