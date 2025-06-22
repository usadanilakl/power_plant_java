import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NestedItem, NestedItemImpl } from '../../../models/ui/nested-item.model';

@Component({
  selector: 'app-toggle-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toggle-list.component.html',
  styleUrl: './toggle-list.component.css'
})
export class ToggleListComponent {
  items = input<NestedItem[]>([]);

  itemClicked = output<NestedItem>();
  itemDoubleClicked = output<NestedItem>();
  itemRightClicked = output<{ event: MouseEvent, item: NestedItem }>();
  itemMiddleClicked = output<NestedItem>();

  private clickTimeout: any = null;
  private lastClickTime: number = 0;
  private readonly doubleClickDelay: number = 250; // milliseconds

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
}