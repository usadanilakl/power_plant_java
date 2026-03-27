import { Component, inject, computed, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EngraverModalService } from './engraver-modal.service';
import { EngraverApiService } from './engraver-api.service';
import { RfPopupProjectionComponent } from '../popup-projection/rf-popup-projection.component';
import { EngraverTemplateManagerComponent } from './engraver-template-manager/engraver-template-manager.component';
import { CharacteristicsEditorComponent } from '../reactive-form/refactored/input-fields/characteristics-editor/characteristics-editor.component';
import { RfLotoPointApiService } from '../../features/loto-points/refactored/services/rf-loto-point-api.service';
import { LotoPointCounterpartService, SyncableField } from '../../features/loto-points/refactored/services/loto-point-counterpart.service';
import { LotoPointDto } from '../../models/loto/loto-point.model';
import { RfValueService } from '../../features/values/refactored/services/rf-value.service';

@Component({
  selector: 'app-engraver-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, RfPopupProjectionComponent, EngraverTemplateManagerComponent, CharacteristicsEditorComponent],
  templateUrl: './engraver-manager.component.html',
  styleUrls: ['./engraver-manager.component.css']
})
export class EngraverManagerComponent {
  modalService = inject(EngraverModalService);
  private engraverApi = inject(EngraverApiService);
  private lotoPointApi = inject(RfLotoPointApiService);
  private counterpartService = inject(LotoPointCounterpartService);
  private valueService = inject(RfValueService);

  isTemplateManagerOpen = signal(false);
  statusMessage = '';
  errorMessage = '';
  private templatesLoaded = false;

  // Click-to-edit state
  editingCell = signal<{ itemId: number; field: string } | null>(null);
  syncCounterpart = signal(false);
  savingItems = signal<Set<number>>(new Set());
  savedItems = signal<Set<number>>(new Set());
  editingCharacteristicsItemId = signal<number | null>(null);

  // Computed for UI
  progressPercentage = computed(() => {
    const total = this.modalService.totalBatches();
    if (total === 0) return 0;
    return Math.round((this.modalService.completedBatches() / total) * 100);
  });

  constructor() {
    // Load templates once when modal becomes visible
    effect(() => {
      const visible = this.modalService.isVisible();
      if (visible && !this.templatesLoaded) {
        this.templatesLoaded = true;
        this.loadEngraverTemplates();
      }
      if (!visible) {
        this.templatesLoaded = false;
      }
    });
  }

  private loadEngraverTemplates(): void {
    this.engraverApi.getEngraverTemplates().subscribe({
      next: (response) => {
        if (response.responseData) {
          this.modalService.allTemplates.set(response.responseData);
        }
      },
      error: () => {
        this.errorMessage = 'Failed to load engraver templates';
      }
    });
  }

  /**
   * Total column count for the batch items table (used for colspan).
   * Columns: # + Tag Number + Description + (characteristics if info) + actions
   */
  getTableColspan(): number {
    const base = 3; // #, Tag Number, Description
    const charCols = this.modalService.selectedDataStructure() === 'info'
      ? this.modalService.availableCharacteristicNames().length
      : 0;
    const actionCol = this.modalService.currentBatch()?.status !== 'completed' ? 1 : 0;
    return base + charCols + actionCol;
  }

  /**
   * Delegates data structure change to modal service.
   */
  setDataStructure(ds: string): void {
    this.modalService.setDataStructure(ds);
  }

  /**
   * Returns current tag size for preview rendering.
   */
  getTagSize(): '2x3' | '2x1' {
    return this.modalService.selectedTagSize() as '2x3' | '2x1';
  }

  /**
   * Splits a description into display lines, mirroring backend logic.
   * Max 4 lines, ~20 chars per line, splits at word boundaries.
   */
  getDescriptionLines(description: string | null): string[] {
    if (!description || description.trim() === '') return [''];

    // Check for explicit line breaks
    if (description.includes('\n')) {
      return description.split('\n').map(l => l.trim()).slice(0, 4);
    }

    // Short descriptions stay on one line
    if (description.length <= 20) return [description];

    // Split by word boundaries
    const words = description.split(/\s+/);
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if (currentLine.length + word.length + 1 <= 20) {
        currentLine = currentLine ? currentLine + ' ' + word : word;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = '';
        }
        currentLine = word;
      }

      if (lines.length >= 3 && currentLine) {
        lines.push(currentLine);
        currentLine = '';
        break;
      }
    }

    if (currentLine && lines.length < 4) {
      lines.push(currentLine);
    }

    return lines;
  }

  /**
   * Process the current batch - generates CSV and opens LightBurn.
   */
  processBatch(): void {
    const ids = this.modalService.getCurrentBatchIds();
    if (ids.length === 0) {
      this.errorMessage = 'No items in current batch';
      return;
    }

    const resolved = this.modalService.resolvedTemplate();
    if (!resolved?.filename) {
      this.errorMessage = 'No template available for this tag size / data structure combination';
      return;
    }

    this.statusMessage = 'Processing batch...';
    this.errorMessage = '';
    this.modalService.startProcessingCurrentBatch();

    const withQr = this.modalService.resolvedTemplate()?.withQr ?? false;
    const layoutVersion = this.modalService.layoutVersion();
    const characteristicNames = layoutVersion === 'info' ? this.modalService.selectedCharacteristicNames() : [];
    this.engraverApi.processBatch(ids, resolved.filename, true, withQr, layoutVersion, characteristicNames).subscribe({
      next: (response) => {
        if (response.responseData) {
          this.statusMessage = `CSV generated with ${response.responseData.itemCount} items. LightBurn opened.`;
        } else {
          this.errorMessage = response.message || 'Failed to process batch';
          this.modalService.errorCurrentBatch(this.errorMessage);
        }
      },
      error: (err) => {
        this.errorMessage = err.message || 'Failed to process batch';
        this.modalService.errorCurrentBatch(this.errorMessage);
      }
    });
  }

  /**
   * Remove an item from processing.
   */
  removeItem(itemId: number): void {
    this.modalService.removeItem(itemId);
  }

  /**
   * Mark current batch as completed, set isLabeled on backend, and move to next.
   */
  markCompleteAndNext(): void {
    const ids = this.modalService.getCurrentBatchIds();

    this.engraverApi.markLabeled(ids).subscribe({
      next: () => {
        this.modalService.completeCurrentBatch();
        this.statusMessage = '';
        this.errorMessage = '';

        if (this.modalService.hasNextBatch()) {
          this.modalService.nextBatch();
        } else if (this.modalService.allBatchesCompleted()) {
          this.statusMessage = 'All batches completed!';
        }
      },
      error: (err) => {
        this.errorMessage = 'Failed to mark as labeled: ' + (err.message || 'unknown error');
      }
    });
  }

  /**
   * Reprocess batch with current settings and reopen LightBurn.
   * Regenerates CSV (important when switching data structure for double-sided tags).
   */
  reopenLightBurn(): void {
    this.processBatch();
  }

  getCharacteristicValue(item: any, name: string): string {
    const chars = this.modalService.parseCharacteristics(item.characteristicsJson);
    const found = chars.find(c => c.name === name);
    return found?.value || '-';
  }

  // ========== Click-to-Edit Methods ==========

  startEdit(itemId: number, field: string): void {
    // Don't allow editing on completed batches
    if (this.modalService.currentBatch()?.status === 'completed') return;
    this.editingCell.set({ itemId, field });
  }

  onCellBlur(item: LotoPointDto, field: string, newValue: string): void {
    this.editingCell.set(null);
    const oldValue = (item as any)[field] || '';
    if (newValue === oldValue) return;

    this.modalService.updateItemField(item.id!, field, newValue);
    this.saveItem(new LotoPointDto({ ...item, [field]: newValue }), [field as SyncableField]);
  }

  onCharacteristicCellBlur(item: LotoPointDto, charName: string, newValue: string): void {
    this.editingCell.set(null);
    const chars = this.modalService.parseCharacteristics(item.characteristicsJson);
    const existing = chars.find(c => c.name === charName);

    // No change
    if (existing && existing.value === newValue) return;
    // Empty value on non-existing characteristic — nothing to do
    if (!existing && (!newValue || newValue === '-')) return;

    let updatedChars;
    if (existing) {
      // Update existing characteristic value
      updatedChars = chars.map(c =>
        c.name === charName ? { ...c, value: newValue } : c
      );
    } else {
      // Add new characteristic entry for this item
      updatedChars = [...chars, { characteristicId: 0, name: charName, value: newValue }];
    }
    const newJson = JSON.stringify(updatedChars);
    this.modalService.updateItemCharacteristicsJson(item.id!, newJson);
    this.saveItem(new LotoPointDto({ ...item, characteristicsJson: newJson }), []);
  }

  onCellKeydown(event: KeyboardEvent, item: LotoPointDto, field: string): void {
    if (event.key === 'Enter') {
      (event.target as HTMLInputElement).blur();
    } else if (event.key === 'Escape') {
      this.editingCell.set(null);
    }
  }

  toggleCharacteristicsEditor(itemId: number): void {
    if (this.editingCharacteristicsItemId() === itemId) {
      this.editingCharacteristicsItemId.set(null);
    } else {
      // Preload equipmentCharacteristic values so the dropdown has options
      this.valueService.refreshCategory('equipmentCharacteristic');
      this.editingCharacteristicsItemId.set(itemId);
    }
  }

  onCharacteristicsChanged(item: LotoPointDto, newJson: string): void {
    this.modalService.updateItemCharacteristicsJson(item.id!, newJson);
    this.saveItem(new LotoPointDto({ ...item, characteristicsJson: newJson }), []);
  }

  /**
   * Checks if any item in the current batch has a counterpart.
   */
  anyItemHasCounterpart(): boolean {
    const batch = this.modalService.currentBatch();
    if (!batch) return false;
    return batch.items.some(item => !!item.counterpartId);
  }

  private saveItem(updatedDto: LotoPointDto, changedFields: SyncableField[]): void {
    const itemId = updatedDto.id!;
    const saving = new Set(this.savingItems());
    saving.add(itemId);
    this.savingItems.set(saving);

    this.lotoPointApi.saveLotoPoint(updatedDto).subscribe({
      next: () => {
        const s = new Set(this.savingItems());
        s.delete(itemId);
        this.savingItems.set(s);

        const saved = new Set(this.savedItems());
        saved.add(itemId);
        this.savedItems.set(saved);
        setTimeout(() => {
          const current = new Set(this.savedItems());
          current.delete(itemId);
          this.savedItems.set(current);
        }, 2000);

        // Sync counterpart if enabled
        if (this.syncCounterpart() && updatedDto.counterpartId && changedFields.length > 0) {
          this.saveCounterpart(updatedDto, changedFields);
        }
      },
      error: () => {
        const s = new Set(this.savingItems());
        s.delete(itemId);
        this.savingItems.set(s);
        this.errorMessage = 'Failed to save changes';
      }
    });
  }

  private saveCounterpart(source: LotoPointDto, changedFields: SyncableField[]): void {
    if (!source.counterpartId) return;

    this.lotoPointApi.getCounterpartById(source.counterpartId).subscribe({
      next: (response) => {
        if (!response.responseData) return;
        let counterpart = LotoPointDto.fromJson(response.responseData);
        const sourceUnit = this.counterpartService.getSourceUnit(source);
        const targetUnit = this.counterpartService.getTargetUnit(sourceUnit);

        for (const field of changedFields) {
          counterpart = this.counterpartService.syncField(source, counterpart, field, sourceUnit, targetUnit);
        }
        this.lotoPointApi.saveLotoPoint(counterpart).subscribe();
      }
    });
  }

  /**
   * Opens the template manager popup.
   */
  openTemplateManager(): void {
    this.isTemplateManagerOpen.set(true);
  }

  /**
   * Handles template manager closed event.
   */
  onTemplateManagerClosed(): void {
    this.isTemplateManagerOpen.set(false);
  }

  /**
   * Reloads templates after changes in the template manager.
   */
  onTemplatesChanged(): void {
    this.loadEngraverTemplates();
  }

  /**
   * Close the modal.
   */
  close(): void {
    this.modalService.close();
    this.statusMessage = '';
    this.errorMessage = '';
  }

  /**
   * Get status icon for a batch.
   */
  getStatusIcon(status: string): string {
    switch (status) {
      case 'completed': return '✓';
      case 'error': return '✗';
      case 'processing': return '↻';
      default: return '○';
    }
  }
}
