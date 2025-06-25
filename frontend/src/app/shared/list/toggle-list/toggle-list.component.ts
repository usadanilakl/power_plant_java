import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NestedItem, NestedItemImpl } from '../../../models/ui/nested-item.model';


interface ColorCondition {
  condition: (item: NestedItem) => boolean;
  color: string;
}

@Component({
  selector: 'app-toggle-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toggle-list.component.html',
  styleUrl: './toggle-list.component.css'
})
export class ToggleListComponent {
  items = input<NestedItem[]>([]);
  highlightOnHover = input<boolean>(false);
  trackLastClicked = input<boolean>(false);
  trackAllClicked = input<boolean>(false);
  colorLevels = input<boolean>(false);


  itemClicked = output<NestedItem>();
  itemDoubleClicked = output<NestedItem>();
  itemRightClicked = output<{ event: MouseEvent, item: NestedItem }>();
  itemMiddleClicked = output<NestedItem>();

  private clickTimeout: any = null;
  private lastClickTime: number = 0;
  private readonly doubleClickDelay: number = 250; // milliseconds

  private lastClickedItem: NestedItem | null = null;
  private clickedItems: Set<NestedItem> = new Set();

  onClick(event: MouseEvent, item: NestedItem): void {
    event.stopPropagation(); // Prevent event from bubbling up
    const currentTime = new Date().getTime();
    const timeSinceLastClick = currentTime - this.lastClickTime;

    if (timeSinceLastClick < this.doubleClickDelay) {
      // Double click detected
      clearTimeout(this.clickTimeout);
      this.clickTimeout = null;
      this.onDoubleClick(item);
    } else {
      // Potential single click
      this.clickTimeout = setTimeout(() => {
        this.toggleItem(item);
        this.itemClicked.emit(item);
      }, this.doubleClickDelay);
    }

    this.lastClickTime = currentTime;
  }

  onDoubleClick(item: NestedItem): void {
    this.itemDoubleClicked.emit(item);
  }

  onRightClick(event: MouseEvent, item: NestedItem): void {
    event.preventDefault();
    event.stopPropagation(); // Prevent event from bubbling up
    this.itemRightClicked.emit({ event, item });
  }

  onMiddleClick(event: MouseEvent, item: NestedItem): void {
    if (event.button === 1) { // Middle mouse button
      event.preventDefault();
      event.stopPropagation(); // Prevent event from bubbling up
      this.itemMiddleClicked.emit(item);
    }
  }

  toggleItem(item: NestedItem): void {
    if (item instanceof NestedItemImpl) {
      item.toggleExpand();
    } else {
      item.isExpanded = !item.isExpanded;
    }
  }

  // New methods to handle nested item events
  onNestedItemClicked(item: NestedItem): void {
    this.itemClicked.emit(item);

    if (this.trackLastClicked()) {
      this.lastClickedItem = item;
    }
    if (this.trackAllClicked()) {
      this.clickedItems.add(item);
    }
      
  }

  onNestedItemDoubleClicked(item: NestedItem): void {
    this.itemDoubleClicked.emit(item);
  }

  onNestedItemRightClicked(event: { event: MouseEvent, item: NestedItem }): void {
    this.itemRightClicked.emit(event);
  }

  onNestedItemMiddleClicked(item: NestedItem): void {
    this.itemMiddleClicked.emit(item);
  }

  ngOnDestroy() {
    if (this.clickTimeout !== null) {
      clearTimeout(this.clickTimeout);
    }
  }

  isItemClicked(item: NestedItem): boolean {
    return this.trackLastClicked() ? this.lastClickedItem === item : this.clickedItems.has(item);
  }
  
  getItemLevel(item: NestedItem): number {
    return this.items().reduce((level, rootItem) => this.findItemLevel(rootItem, item, 0, level), 0);
  }
  
  private findItemLevel(currentItem: NestedItem, targetItem: NestedItem, currentLevel: number, maxLevel: number): number {
    if (currentItem === targetItem) {
      return Math.max(currentLevel, maxLevel);
    }
    if (currentItem.values) {
      return currentItem.values.reduce(
        (level, childItem) => this.findItemLevel(childItem, targetItem, currentLevel + 1, level),
        maxLevel
      );
    }
    return maxLevel;
  }

  getItemColor(item: NestedItem): string | null {
    return item.color || null;
  }

}