import { Component, inject, output, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { InteractiveImageComponent } from '../../../../image/refactored/interactive-image/interactive-image.component';
import { RfToggleMenuComponent } from '../../../../menu/refactored/rf-toggle-menu/rf-toggle-menu.component';
import { EquipmentDialogFileService } from '../services/equipment-dialog-file.service';
import { EquipmentMapperService } from '../../../../../features/equipment/refactored/services/equipment-mapper.service';
import { RfEquipmentService } from '../../../../../features/equipment/refactored/services/rf-equipment.service';
import { EquipmentDto } from '../../../../../models/equipment/equipment.model';
import { NestedItem } from '../../../../../models/ui/nested-item.model';
import { RfShape } from '../../../../image/refactored/models/fr-shape.model';
import { GuideDirective } from '../../../../guide/guide.directive';

/**
 * Unified Equipment Dialog
 *
 * Combines browsing and drawing in a single interface:
 * - Left-click on existing equipment shape to select it
 * - Right-click and drag to draw a new equipment shape
 *
 * Used in LOTO point forms where users need to either select existing
 * equipment or create new equipment in one unified workflow.
 */
@Component({
  selector: 'app-equipment-unified-dialog',
  standalone: true,
  imports: [
    CommonModule,
    InteractiveImageComponent,
    RfToggleMenuComponent,
    GuideDirective
  ],
  providers: [EquipmentDialogFileService],
  templateUrl: './equipment-unified-dialog.component.html',
  styleUrl: './equipment-unified-dialog.component.css'
})
export class EquipmentUnifiedDialogComponent {
  // Services
  private fileService = inject(EquipmentDialogFileService);
  private equipmentMapper = inject(EquipmentMapperService);
  private equipmentService = inject(RfEquipmentService);
  private destroyRef = inject(DestroyRef);

  // Outputs
  equipmentAcquired = output<EquipmentDto>();
  close = output<void>();

  // Delegated to file service
  selectedFile = this.fileService.selectedFile;
  fileMenuItems = this.fileService.menuItems;
  currentFileLink = this.fileService.currentFileLink;

  // State
  selectedEquipment = signal<EquipmentDto | null>(null);
  drawnShape = signal<RfShape | null>(null);
  highlightEquipmentId = signal<number | null>(null);
  isLoading = signal(false);
  error = signal<string | null>(null);

  // Mode: 'browse' when selecting existing, 'drawn' when a new shape was drawn
  currentMode = signal<'browse' | 'drawn'>('browse');

  // Equipment from selected file
  equipment = computed(() => {
    const file = this.selectedFile();
    if (!file) return [];
    return file.points ?? [];
  });

  // Equipment shapes for InteractiveImageComponent
  equipmentShapes = computed(() => {
    const eq = this.equipment();
    const drawn = this.drawnShape();

    // Map existing equipment to shapes
    const shapes = eq.map((e: EquipmentDto) =>
      this.equipmentMapper.mapToRfShape(e)
    ).filter(s => s !== null) as RfShape[];

    // Highlight selected equipment
    const highlightId = this.highlightEquipmentId();
    if (highlightId !== null) {
      shapes.forEach((shape: RfShape) => {
        if (shape.id === highlightId) {
          shape.isSelected = true;
          shape.color = '#FF0000';
        }
      });
    }

    // Add drawn shape if exists (with highlight)
    if (drawn) {
      const drawnWithHighlight = {
        ...drawn,
        isSelected: true,
        color: '#00FF00' // Green for newly drawn
      };
      shapes.push(drawnWithHighlight);
    }

    return shapes;
  });

  // Can confirm when either equipment is selected OR a shape was drawn
  canConfirm = computed(() => {
    return this.selectedEquipment() !== null || this.drawnShape() !== null;
  });

  // Status message for user guidance
  statusMessage = computed(() => {
    const mode = this.currentMode();
    const selected = this.selectedEquipment();
    const drawn = this.drawnShape();

    if (drawn) {
      return 'New shape drawn. Click "Select Equipment" to save and associate.';
    }
    if (selected) {
      return `Selected: ${selected.tagNumber || `Equipment #${selected.id}`}`;
    }
    return 'Left-click to select existing equipment, or right-click and drag to draw new.';
  });

  onFileSelect(fileItem: NestedItem) {
    this.fileService.selectFileFromNestedItem(fileItem);
    this.clearSelection();
  }

  // Handle click on existing equipment shape
  onEquipmentClicked(shape: RfShape) {
    const selectedId = shape.id;
    if (selectedId !== null) {
      const eq = this.equipment();
      const selected = eq.find((e: EquipmentDto) => e.id === selectedId);
      if (selected) {
        // Clear any drawn shape when selecting existing
        this.drawnShape.set(null);
        this.selectedEquipment.set(selected);
        this.highlightEquipmentId.set(selectedId);
        this.currentMode.set('browse');
      }
    }
  }

  // Handle new shape drawn
  onShapeDrawn(shape: RfShape) {
    // Clear any existing selection when drawing new
    this.selectedEquipment.set(null);
    this.highlightEquipmentId.set(null);
    this.drawnShape.set(shape);
    this.currentMode.set('drawn');
  }

  onConfirm() {
    const file = this.selectedFile();
    if (!file) return;

    const mode = this.currentMode();

    if (mode === 'browse') {
      // Selecting existing equipment
      const equipment = this.selectedEquipment();
      if (equipment) {
        const enrichedEquipment = new EquipmentDto({
          ...equipment,
          mainFileId: file.id,
          mainFileObject: file
        });
        this.equipmentAcquired.emit(enrichedEquipment);
        this.reset();
      }
    } else if (mode === 'drawn') {
      // Saving new drawn equipment
      const shape = this.drawnShape();
      if (shape) {
        this.isLoading.set(true);
        this.error.set(null);

        // Add file context to shape before saving
        const shapeWithFileContext: RfShape = { ...shape, fileId: file.id };

        this.equipmentService
          .saveEquipmentFromShape(shapeWithFileContext)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (savedEquipment) => {
              this.isLoading.set(false);
              if (savedEquipment) {
                const enrichedEquipment = new EquipmentDto({
                  ...savedEquipment,
                  mainFileId: file.id,
                  mainFileObject: file
                });
                this.equipmentAcquired.emit(enrichedEquipment);
                this.reset();
              } else {
                this.error.set('Failed to save equipment.');
              }
            },
            error: (err) => {
              this.isLoading.set(false);
              console.error('Failed to save equipment:', err);
              this.error.set('Failed to save equipment. Please try again.');
            }
          });
      }
    }
  }

  onCancel() {
    this.reset();
    this.close.emit();
  }

  private clearSelection() {
    this.selectedEquipment.set(null);
    this.drawnShape.set(null);
    this.highlightEquipmentId.set(null);
    this.currentMode.set('browse');
    this.error.set(null);
  }

  private reset() {
    this.fileService.reset();
    this.clearSelection();
  }
}
