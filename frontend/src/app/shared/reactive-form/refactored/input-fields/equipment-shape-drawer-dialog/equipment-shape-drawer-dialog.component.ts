import { Component, inject, output, signal, computed, effect, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RfFileStateService } from '../../../../../features/files/refactored/services/rf-file-state.service';
import { CurrentFileService } from '../../../../../services/current-file.service';
import { InteractiveImageComponent } from '../../../../image/refactored/interactive-image/interactive-image.component';
import { FileDto } from '../../../../../models/file/file.model';
import { toSignal } from '@angular/core/rxjs-interop';
import { RfShape } from '../../../../image/refactored/models/fr-shape.model';

@Component({
  selector: 'app-equipment-shape-drawer-dialog',
  standalone: true,
  imports: [CommonModule, InteractiveImageComponent],
  templateUrl: './equipment-shape-drawer-dialog.component.html',
  styleUrl: './equipment-shape-drawer-dialog.component.css'
})
export class EquipmentShapeDrawerDialogComponent {
  @ViewChild(InteractiveImageComponent) interactiveImage?: InteractiveImageComponent;

  // Services
  fileStateService = inject(RfFileStateService);
  currentFileService = inject(CurrentFileService);

  // Outputs
  shapeDrawn = output<{ shape: RfShape; file: FileDto }>();
  close = output<void>();

  // State
  selectedFile = signal<FileDto | null>(null);
  drawnShape = signal<RfShape | null>(null);
  isDrawingMode = signal(false);

  // Data
  files = toSignal(this.fileStateService.allLoadedFiles$, { initialValue: [] });
  equipment = toSignal(this.currentFileService.elementsToRender$, { initialValue: null });

  currentFileLink = computed(() => {
    const file = this.selectedFile();
    return file ? file.fileLink : '';
  });

  // Existing equipment shapes for display only
  equipmentShapes = computed(() => {
    const eq = this.equipment();
    if (!eq) return [];
    // For shape drawer, we might want to show existing equipment as reference
    return []; // Or load existing shapes if needed
  });

  constructor() {
    // Watch for selected file changes
    effect(() => {
      const file = this.selectedFile();
      if (file) {
        this.currentFileService.setCurrentFile(file);
      }
    });

    // Watch for newly created shapes from InteractiveImageComponent
    effect(() => {
      const imageComponent = this.interactiveImage;
      if (imageComponent && this.isDrawingMode()) {
        // Get the last added shape from the shapes signal
        const shapes = imageComponent.shapes();
        if (shapes.length > 0) {
          const lastShape = shapes[shapes.length - 1];
          this.drawnShape.set(lastShape);
        }
      }
    }, { allowSignalWrites: true });
  }

  onFileSelect(file: FileDto) {
    this.selectedFile.set(file);
    this.drawnShape.set(null);
    this.isDrawingMode.set(false);
  }

  startDrawing() {
    this.isDrawingMode.set(true);
    this.drawnShape.set(null);
  }

  onConfirmShape() {
    const shape = this.drawnShape();
    const file = this.selectedFile();

    if (shape && file) {
      this.shapeDrawn.emit({ shape, file });
    }
  }

  onCancel() {
    this.close.emit();
  }

  isFileSelected(file: FileDto): boolean {
    return this.selectedFile()?.id === file.id;
  }

  canConfirm(): boolean {
    return this.drawnShape() !== null && this.selectedFile() !== null;
  }
}
