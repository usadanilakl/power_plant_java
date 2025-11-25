import {
  ChangeDetectionStrategy,
  Component,
  ViewChild,
  signal,
  output,
  computed,
  input,
  OnDestroy
} from '@angular/core';
import { NestedItem } from '../../../models/ui/nested-item.model';
import { CdkVirtualScrollViewport, ScrollingModule } from "@angular/cdk/scrolling";
import { CommonModule } from '@angular/common';

interface FlatItem extends NestedItem {
  level: number;
  isClicked?: boolean;
  isLastClicked?: boolean;
}

@Component({
  selector: 'app-toggle-list-virtual-scroll',
  imports: [ScrollingModule, CommonModule],
  templateUrl: './toggle-list-virtual-scroll.component.html',
  standalone: true,
  styleUrl: './toggle-list-virtual-scroll.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToggleListVirtualScrollComponent implements OnDestroy {
  @ViewChild(CdkVirtualScrollViewport) viewport: CdkVirtualScrollViewport | null = null;

  items = input<NestedItem[]>([]);
  highlightOnHover = input(false);
  trackLastClicked = input(false);
  trackAllClicked = input(false);
  colorLevels = input(false);

  itemClicked = output<FlatItem>();
  itemDoubleClicked = output<FlatItem>();
  itemRightClicked = output<{ event: MouseEvent, item: FlatItem }>();
  itemMiddleClicked = output<FlatItem>();

  private clickTimeout: any = null;
  private lastClickTime = 0;
  private readonly doubleClickDelay = 250;

  private expandedItemIds = signal<Set<string | number>>(new Set());
  private lastClickedItemId = signal<string | number | null>(null);
  private allClickedItemIds = signal<Set<string | number>>(new Set());

  flatItems = computed(() => {
    const expandedIds = this.expandedItemIds();
    const lastClickedId = this.trackLastClicked() ? this.lastClickedItemId() : null;
    const allClickedIds = this.trackAllClicked() ? this.allClickedItemIds() : new Set();

    const flatten = (items: NestedItem[], level: number): FlatItem[] => {
      let result: FlatItem[] = [];
      for (const item of items) {
        const isExpanded = expandedIds.has(item.id);
        const flatItem: FlatItem = {
          ...item,
          level,
          isExpanded,
          isClicked: allClickedIds.has(item.id),
          isLastClicked: item.id === lastClickedId
        };
        result.push(flatItem);
        if (isExpanded && item.values) {
          result = result.concat(flatten(item.values, level + 1));
        }
      }
      return result;
    };

    return flatten(this.items(), 0);
  });

  trackByFn(index: number, item: FlatItem): string | number {
    return item.id;
  }

  onClick(event: MouseEvent, item: FlatItem): void {
    event.stopPropagation();
    const currentTime = new Date().getTime();
    const timeSinceLastClick = currentTime - this.lastClickTime;

    if (timeSinceLastClick < this.doubleClickDelay) {
      clearTimeout(this.clickTimeout);
      this.clickTimeout = null;
      this.onDoubleClick(item);
    } else {
      this.clickTimeout = setTimeout(() => {
        this.onItemClick(event, item);
        this.clickTimeout = null;
      }, this.doubleClickDelay);
    }

    this.lastClickTime = currentTime;
  }

  private onItemClick(event: MouseEvent, item: FlatItem): void {
    this.toggleItem(item);

    if (this.trackLastClicked()) {
      this.lastClickedItemId.set(item.id);
    }
    if (this.trackAllClicked()) {
      this.allClickedItemIds.update(ids => {
        ids.add(item.id);
        return new Set(ids);
      });
    }

    this.itemClicked.emit(item);
  }

  private toggleItem(item: FlatItem) {
    this.expandedItemIds.update(ids => {
      if (ids.has(item.id)) {
        ids.delete(item.id);
      } else {
        ids.add(item.id);
      }
      return new Set(ids);
    });

    // Trigger a re-render of the virtual scroll
    if (this.viewport) {
      this.viewport.checkViewportSize();
    }
  }

  isItemClicked(item: FlatItem): boolean {
    return this.trackAllClicked() && this.allClickedItemIds().has(item.id);
  }

  isItemLastClicked(item: FlatItem): boolean {
    return this.trackLastClicked() && item.id === this.lastClickedItemId();
  }

  onDoubleClick(item: FlatItem): void {
    this.itemDoubleClicked.emit(item);
  }

  onRightClick(event: MouseEvent, item: FlatItem): void {
    event.preventDefault();
    event.stopPropagation();
    this.itemRightClicked.emit({ event, item });
  }

  onMiddleClick(event: MouseEvent, item: FlatItem): void {
    if (event.button === 1) {
      event.preventDefault();
      event.stopPropagation();
      this.itemMiddleClicked.emit(item);
    }
  }

  getItemColor(item: FlatItem): string | null {
    return item.color || null;
  }

  ngOnDestroy() {
    if (this.clickTimeout !== null) {
      clearTimeout(this.clickTimeout);
    }
  }
}


// import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, SimpleChanges, ViewChild, signal, output, OnInit, computed } from '@angular/core';
// import { NestedItem } from '../../../models/ui/nested-item.model';
// import { CdkVirtualScrollViewport, ScrollingModule } from "@angular/cdk/scrolling";
// import { CommonModule } from '@angular/common';
// import { BehaviorSubject } from 'rxjs';

// interface FlatItem extends NestedItem {
//   level: number;
//   isVisible: boolean;
//   isClicked?: boolean;
//   isLastClicked?: boolean;
// }

// @Component({
//   selector: 'app-toggle-list-virtual-scroll',
//   imports: [ScrollingModule, CommonModule],
//   templateUrl: './toggle-list-virtual-scroll.component.html',
//   standalone: true,
//   styleUrl: './toggle-list-virtual-scroll.component.css'
// })
// export class ToggleListVirtualScrollComponent implements OnInit {
//   @ViewChild(CdkVirtualScrollViewport) viewport: CdkVirtualScrollViewport | null = null;

//   @Input() items: NestedItem[] = [];
//   @Input() highlightOnHover = false;
//   @Input() trackLastClicked = false;
//   @Input() trackAllClicked = false;
//   @Input() colorLevels = false;

//   itemClicked = output<FlatItem>();
//   itemDoubleClicked = output<FlatItem>();
//   itemRightClicked = output<{ event: MouseEvent, item: FlatItem }>();
//   itemMiddleClicked = output<FlatItem>();

//   private clickTimeout: any = null;
//   private lastClickTime = 0;
//   private readonly doubleClickDelay = 250;

//   private flatItemsSignal = signal<FlatItem[]>([]);
//   flatItems = computed(() =>{
//     return this.flatItemsSignal();
//   } );

//   clickedItem: FlatItem | null = null;
//   clickedItems: FlatItem[] = [];


//   ngOnInit() {
//     this.flattenItems();
//   }

//   flattenItems() {
//     const flatItems = this.flattenChildrenRecursively(this.items, 0);
//     this.flatItemsSignal.set(flatItems);
//   }
  
//   private flattenChildrenRecursively(items: NestedItem[], level: number): FlatItem[] {
//     let result: FlatItem[] = [];
//     for (const item of items) {
//       const flatItem: FlatItem = {
//         ...item,
//         level,
//         isVisible: true,
//         isClicked: false,
//         isLastClicked: false
//       };
//       result.push(flatItem);
//       if (item.isExpanded && item.values) {
//         result = result.concat(this.flattenChildrenRecursively(item.values, level + 1));
//       }
//     }
//     return result;
//   }

//   toggleItem(item: FlatItem) {
//     item.isExpanded = !item.isExpanded;
    
//     // Update the original nested item
//     const originalItem = this.findOriginalItem(this.items, item.id);
//     if (originalItem) {
//       originalItem.isExpanded = item.isExpanded;
//     }
  
//     // Rebuild the entire flatItems array
//     this.flattenItems();
    
//     // Trigger a re-render of the virtual scroll
//     if (this.viewport) {
//       this.viewport.checkViewportSize();
//     }
//   }

//   private findOriginalItem(items: NestedItem[], id: string | number): NestedItem | null {
//     for (const item of items) {
//       if (item.id === id) {
//         return item;
//       }
//       if (item.values) {
//         const found = this.findOriginalItem(item.values, id);
//         if (found) {
//           return found;
//         }
//       }
//     }
//     return null;
//   }

//   trackByFn(index: number, item: FlatItem): string | number {
//     return item.id;
//   }

//   onClick(event: MouseEvent, item: FlatItem): void {
//     event.stopPropagation();
//     const currentTime = new Date().getTime();
//     const timeSinceLastClick = currentTime - this.lastClickTime;

//     if (timeSinceLastClick < this.doubleClickDelay) {
//       clearTimeout(this.clickTimeout);
//       this.clickTimeout = null;
//       this.onDoubleClick(item);
//     } else {
//       this.clickTimeout = setTimeout(() => {
//         this.onItemClick(event, item);
//       }, this.doubleClickDelay);
//     }

//     this.lastClickTime = currentTime;
//   }

  
//   private updateClickedState(clickedItem: FlatItem): void {
//     const all = [...this.flatItemsSignal()];
//     all.forEach(item => {
//       item.isClicked = item.id === clickedItem.id;
//       item.isLastClicked = clickedItem.id === clickedItem.id;
//     });
//       this.flatItemsSignal.set(all);
//   }
  
//   onItemClick(event: MouseEvent, item: FlatItem): void {
//     this.clickedItem = item;
//     this.clickedItems.push(item);
//     this.updateClickedState(item);
//     this.toggleItem(item);
//     this.itemClicked.emit(item);
//   }
  
//   isItemClicked(item: FlatItem): boolean {
//     return this.clickedItems.some(clickedItem => clickedItem.id === item.id);
//   }
  
//   isItemLastClicked(item: FlatItem): boolean {
//     return item.id === this.clickedItem?.id;
//   }

//   onDoubleClick(item: FlatItem): void {
//     this.itemDoubleClicked.emit(item);
//   }

//   onRightClick(event: MouseEvent, item: FlatItem): void {
//     event.preventDefault();
//     event.stopPropagation();
//     this.itemRightClicked.emit({ event, item });
//   }

//   onMiddleClick(event: MouseEvent, item: FlatItem): void {
//     if (event.button === 1) {
//       event.preventDefault();
//       event.stopPropagation();
//       this.itemMiddleClicked.emit(item);
//     }
//   }

//   getItemColor(item: FlatItem): string | null {
//     return item.color || null;
//   }

//   ngOnDestroy() {
//     if (this.clickTimeout !== null) {
//       clearTimeout(this.clickTimeout);
//     }
//   }
// }