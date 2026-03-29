import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LotoBuilderStateService, RelatedFileEntry } from '../services/loto-builder-state.service';
import { CurrentFileService } from '../../../../../services/current-file.service';

@Component({
  selector: 'app-loto-builder-info-window',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loto-builder-info-window.component.html',
  styleUrl: './loto-builder-info-window.component.css',
})
export class LotoBuilderInfoWindowComponent {
  protected builderState = inject(LotoBuilderStateService);
  private currentFileService = inject(CurrentFileService);

  /**
   * Get the current LOTO point to display
   */
  lotoPoint = computed(() => {
    return this.builderState.infoWindowLotoPoint();
  });

  /**
   * Check if info window should be shown
   */
  isVisible = computed(() => {
    return this.builderState.showLotoPointInfo();
  });

  /**
   * Check if carousel is visible and there's an active standard
   */
  canAddToStandard = computed(() => {
    return this.builderState.isCarouselVisible() && this.builderState.activeLotoStandard() !== null;
  });

  /**
   * Get active standard name for button label
   */
  activeStandardName = computed(() => {
    const standard = this.builderState.activeLotoStandard();
    return standard?.name || 'LOTO Standard';
  });

  /** Related files for multi-file navigation */
  relatedFiles = computed(() => this.builderState.relatedFiles());

  /** Currently active file index */
  activeFileIndex = computed(() => this.builderState.activeRelatedFileIndex());

  /** Whether file navigation chips should be shown (more than 1 file) */
  showFileNavigation = computed(() => this.relatedFiles().length > 1);

  /**
   * Switch to a different related file and highlight the associated equipment
   */
  switchToFile(index: number): void {
    const entries = this.relatedFiles();
    if (index < 0 || index >= entries.length) return;

    const entry = entries[index];
    const currentFileId = this.builderState.currentFile()?.id;

    this.builderState.activeRelatedFileIndex.set(index);
    this.builderState.selectedShapeId.set(null);
    this.builderState.hoveredShapeId.set(null);

    if (currentFileId === entry.file.id) {
      // Same file already loaded — just highlight the relevant equipment
      this.highlightEquipmentForEntry(entry);
    } else {
      // Different file — switch and let the subscription chain handle highlighting
      this.currentFileService.setCurrentFile(entry.file);
    }
  }

  private highlightEquipmentForEntry(entry: RelatedFileEntry): void {
    const equipment = this.builderState.currentEquipment();
    const match = equipment.find(eq => eq.id === entry.equipment.id);
    if (match) {
      this.builderState.hoveredShapeId.set(match.id);
      this.builderState.selectedShapeId.set(match.id);
    }
  }

  /**
   * Add current LOTO point to active standard
   */
  addToActiveStandard(): void {
    const lotoPoint = this.lotoPoint();
    if (lotoPoint) {
      this.builderState.addLotoPointToActiveStandard(lotoPoint);
      // Optionally close the info window after adding
      this.close();
    }
  }

  /**
   * Close the info window
   */
  close(): void {
    this.builderState.hideLotoPointInfoWindow();
  }
}
