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
export class ClipboardFormComponent<T> {
  private clipboardService = inject(ClipboardService);

  entityType = input.required<string>();
  initialEntity = input.required<T>();
  hasValidData = input.required<(entity: T) => boolean>();
  getItemSummary = input<(item: T) => string>(
    (item: T) => JSON.stringify(item).substring(0, 50) + '...'
  );

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
    this.itemSelected.emit(item);
  }

  getItemLabel(item: T, index: number): string {
    if (index === 0 && this.capturedInitialEntity() === item) {
      return `[Initial] ${this.getItemSummary()(item)}`;
    }
    return this.getItemSummary()(item);
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
