import {
  Component,
  input,
  output,
  inject,
  computed,
  effect,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClipboardService } from '../../../clipboard/clipboard.service';

@Component({
  selector: 'app-clipboard-form',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './clipboard-form.component.html',
  styleUrls: ['./clipboard-form.component.css'],
})
export class ClipboardFormComponent<T extends { id?: number | null; objectType?: string }> {
  private clipboardService = inject(ClipboardService);

  entityType = input.required<string>();
  initialEntity = input.required<T>();
  currentEntity = input<T>(); // Current form entity for "Add to Clipboard"
  hasValidData = input.required<(entity: T) => boolean>();
  getItemSummary = input<(item: T) => string>(
    (item: T) => JSON.stringify(item).substring(0, 50) + '...'
  );
  // Formatter function to transform entity before adding to clipboard
  clipboardFormatter = input<(entity: T) => any>((entity: T) => entity);
  // Whether to exclude id when pasting from clipboard
  excludeIdOnPaste = input<boolean>(true);

  itemSelected = output<T>();

  isCollapsed = signal<boolean>(true);

  private capturedInitialEntity = signal<T | null>(null);

  clipboardItems = computed(() => {
    const section = this.clipboardService.getSectionByType(this.entityType());
    return section?.items ?? [];
  });

  displayItems = computed(() => {
    const items = this.clipboardItems();
    const initial = this.capturedInitialEntity();

    if (initial) {
      return [initial, ...items];
    }
    return items;
  });

  private captureInitialEffect = effect(() => {
    const initial = this.initialEntity();
    const hasValid = this.hasValidData();

    if (initial && hasValid(initial) && !this.capturedInitialEntity()) {
      this.capturedInitialEntity.set(structuredClone(initial));
    }
  });

  toggleCollapse(): void {
    this.isCollapsed.update((value) => !value);
  }

  onItemClick(item: T): void {
    // If excludeIdOnPaste is true, create a copy without the id
    if (this.excludeIdOnPaste()) {
      const itemWithoutId = { ...item };
      delete (itemWithoutId as any).id;
      this.itemSelected.emit(itemWithoutId as T);
    } else {
      this.itemSelected.emit(item);
    }
  }

  getItemLabel(item: T, index: number): string {
    if (index === 0 && this.capturedInitialEntity() === item) {
      return `[Initial] ${this.getItemSummary()(item)}`;
    }
    return this.getItemSummary()(item);
  }

  /**
   * Add current form entity to clipboard
   */
  addCurrentToClipboard(): void {
    const entity = this.currentEntity();
    if (!entity) {
      console.warn('No current entity to add to clipboard');
      return;
    }

    const hasValid = this.hasValidData();
    if (!hasValid(entity)) {
      console.warn('Current entity does not have valid data');
      return;
    }

    // Apply formatter and ensure objectType is set
    const formatter = this.clipboardFormatter();
    const formattedEntity = formatter(entity);

    // Ensure objectType is set for clipboard section management
    if (!formattedEntity.objectType) {
      formattedEntity.objectType = this.entityType();
    }

    this.clipboardService.addItem(formattedEntity);
    console.log('Added entity to clipboard:', formattedEntity);
  }
}

// import {
//   Component,
//   input,
//   output,
//   inject,
//   computed,
//   effect,
//   signal,
// } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { ClipboardService } from '../../../clipboard/clipboard.service';

// @Component({
//   selector: 'app-clipboard-form',
//   standalone: true,
//   imports: [CommonModule, FormsModule],
//   templateUrl: './clipboard-form.component.html',
//   styleUrls: ['./clipboard-form.component.css'],
// })
// export class ClipboardFormComponent<T> {
//   private clipboardService = inject(ClipboardService);

//   entityType = input.required<string>();
//   initialEntity = input.required<T>();
//   hasValidData = input.required<(entity: T) => boolean>();
//   getItemSummary = input<(item: T) => string>(
//     (item: T) => JSON.stringify(item).substring(0, 50) + '...'
//   );

//   itemSelected = output<T>();

//   itemNumberValue = signal<number>(0);

//   private capturedInitialEntity = signal<T | null>(null);

//   clipboardItems = computed(() => {
//     const section = this.clipboardService.getSectionByType(this.entityType());
//     return section?.items ?? [];
//   });

//   currentItem = computed(() => {
//     const items = this.clipboardItems();
//     const itemNumber = this.itemNumberValue();

//     if (itemNumber === 0) {
//       return this.capturedInitialEntity();
//     }

//     const index = itemNumber - 1;
//     return index >= 0 && index < items.length ? items[index] : null;
//   });

//   private captureInitialEffect = effect(() => {
//     const initial = this.initialEntity();
//     const hasValid = this.hasValidData();

//     if (initial && hasValid(initial) && !this.capturedInitialEntity()) {
//       this.capturedInitialEntity.set(structuredClone(initial));
//     }
//   });

//   onItemNumberChange(value: number): void {
//     this.itemNumberValue.set(Math.max(0, value));
//   }

//   loadItem(): void {
//     const item = this.currentItem();
//     if (item) {
//       this.itemSelected.emit(item);
//     }
//   }
// }
