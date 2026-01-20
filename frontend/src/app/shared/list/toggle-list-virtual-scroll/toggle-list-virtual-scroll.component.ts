import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ViewChild,
  ElementRef,
  signal,
  output,
  computed,
  input,
  OnDestroy,
  AfterViewInit,
  effect,
  inject
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
export class ToggleListVirtualScrollComponent implements OnDestroy, AfterViewInit {
  @ViewChild(CdkVirtualScrollViewport) viewport: CdkVirtualScrollViewport | null = null;

  private cdr = inject(ChangeDetectorRef);
  private elementRef = inject(ElementRef);
  private intersectionObserver: IntersectionObserver | null = null;

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

  // Track last items reference to avoid redundant updates
  private lastItemsLength = 0;
  private pendingTimeouts: ReturnType<typeof setTimeout>[] = [];

  constructor() {
    // Effect to update viewport when items change
    effect(() => {
      // Track items changes - reading items() here creates dependency
      const items = this.items();

      // Only schedule updates if items actually changed
      if (items.length !== this.lastItemsLength) {
        this.lastItemsLength = items.length;

        // Schedule viewport check after items are updated
        if (items.length > 0) {
          this.scheduleViewportCheck();
        }
      }
    });
  }

  ngAfterViewInit(): void {
    // Set up IntersectionObserver to detect when component becomes visible
    this.setupVisibilityObserver();
    // Also schedule immediate check in case already visible
    this.scheduleViewportCheck();
  }

  /**
   * Set up IntersectionObserver to detect visibility changes.
   * This handles the case where the component is rendered but hidden initially.
   */
  private setupVisibilityObserver(): void {
    if (typeof IntersectionObserver === 'undefined') return;

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0) {
            // Component is now visible - update viewport
            this.scheduleViewportCheck();
          }
        });
      },
      { threshold: [0, 0.1, 0.5, 1.0] }
    );

    this.intersectionObserver.observe(this.elementRef.nativeElement);
  }

  /**
   * Schedule viewport checks to ensure proper rendering.
   * Clears any pending checks before scheduling new ones.
   */
  private scheduleViewportCheck(): void {
    // Clear any pending timeouts to avoid multiple parallel checks
    this.pendingTimeouts.forEach(t => clearTimeout(t));
    this.pendingTimeouts = [];

    // Schedule checks at different intervals
    this.pendingTimeouts.push(setTimeout(() => this.forceViewportUpdate(), 0));
    this.pendingTimeouts.push(setTimeout(() => this.forceViewportUpdate(), 100));
    this.pendingTimeouts.push(setTimeout(() => this.forceViewportUpdate(), 300));
  }

  /**
   * Force the viewport to update and render items
   */
  private forceViewportUpdate(): void {
    if (this.viewport) {
      // Always try to update - checkViewportSize will recalculate
      this.viewport.checkViewportSize();
      this.cdr.markForCheck();
    }
  }

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

  isLeafWithSubtitle(item: FlatItem): boolean {
    return !!item.subtitle && (!item.values || item.values.length === 0);
  }

  getItemSize(): number {
    // Check if any items have subtitles (leaf items with two-line display)
    const hasSubtitles = this.flatItems().some(item => this.isLeafWithSubtitle(item));
    return hasSubtitles ? 50 : 40;
  }

  ngOnDestroy() {
    // Clean up click timeout
    if (this.clickTimeout !== null) {
      clearTimeout(this.clickTimeout);
    }

    // Clean up pending viewport check timeouts
    this.pendingTimeouts.forEach(t => clearTimeout(t));
    this.pendingTimeouts = [];

    // Clean up intersection observer
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
    }
  }
}