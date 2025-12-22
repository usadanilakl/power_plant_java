import { Injectable, inject, signal, effect, computed } from '@angular/core';
import { ClipboardService } from './clipboard.service';

@Injectable({
  providedIn: 'root',
})
export class ClipboardFormService {
  private clipboardService = inject(ClipboardService);

  /**
   * Create clipboard form state for any entity type
   */
  createClipboardFormState<T>(
    entityType: string,
    initialEntity: T,
    hasValidData: (entity: T) => boolean
  ) {
    const itemNumber = signal<number>(0);
    const capturedInitialEntity = signal<T>(initialEntity);

    const captureInitial = effect(() => {
      if (hasValidData(capturedInitialEntity())) return;
      if (hasValidData(initialEntity)) {
        capturedInitialEntity.set(structuredClone(initialEntity));
      }
    });

    const clipboardItems = computed(() => {
      const section = this.clipboardService.getSectionByType(entityType);
      return section?.items ?? [];
    });

    const clipboardItem = computed(() => {
        const items = clipboardItems(); // Reference the local variable, not this.clipboardItems()
        const index = itemNumber() - 1;
        return index >= 0 && index < items.length ? items[index] : null;
    });

    return {
      itemNumber,
      capturedInitialEntity,
      clipboardItems,
      clipboardItem,
      cleanup: () => captureInitial.destroy?.(),
    };
  }
}
