import { Component, computed, ContentChild, effect, input, output, signal, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-item-carousel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './item-carousel.component.html',
  styleUrls: ['./item-carousel.component.css']
})
export class ItemCarouselComponent<T> {
  items = input.required<T[]>();
  title = input<string>('');

  addItemEvent = output<void>();
  itemChangedEvent = output<T>();

  currentIndex = signal(0);
  private previousLength = 0;

  currentItem = computed(() => {
    const items = this.items();
    const index = this.currentIndex();
    if (!items || items.length === 0) {
      return null;
    }
    return items[index];
  });

  constructor() {
    effect(() => {
      const items = this.items();
      const length = items.length;
      const previousLength = this.previousLength;

      if (length === 0) {
        this.currentIndex.set(0);
      } else if (length > previousLength) {
        this.currentIndex.set(length - 1);
      } else if (this.currentIndex() >= length) {
        this.currentIndex.set(length - 1);
      }

      this.previousLength = length;
    });

    effect(() => {
      const current = this.currentItem();
      // We only want to emit after the component is initialized and the item is not null.
      if (current) {
        this.itemChangedEvent.emit(current);
      }
    });
  }

  @ContentChild(TemplateRef) itemTemplate: TemplateRef<any> | undefined;

  next(): void {
    this.currentIndex.update(i => (i + 1) % this.items().length);
  }

  previous(): void {
    this.currentIndex.update(i => (i - 1 + this.items().length) % this.items().length);
  }
  addItem() {
    this.addItemEvent.emit();
  }
}
