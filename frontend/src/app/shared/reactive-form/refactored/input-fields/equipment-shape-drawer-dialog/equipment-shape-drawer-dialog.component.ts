import { Component, inject, output, signal, computed, effect, ViewChild, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RfFileStateService } from '../../../../../features/files/refactored/services/rf-file-state.service';
import { CurrentFileService } from '../../../../../services/current-file.service';
import { InteractiveImageComponent } from '../../../../image/refactored/interactive-image/interactive-image.component';
import { FileDto } from '../../../../../models/file/file.model';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { RfShape } from '../../../../image/refactored/models/fr-shape.model';
import { NestedItem } from '../../../../../models/ui/nested-item.model';

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
  destroyRef = inject(DestroyRef);

  // Outputs
  shapeDrawn = output<{ shape: RfShape; file: FileDto }>();
  close = output<void>();

  // State
  selectedFile = signal<FileDto | null>(null);
  drawnShape = signal<RfShape | null>(null);
  isDrawingMode = signal(false);

  menuItems = signal<NestedItem[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);

  // Data
  filesMap = toSignal(this.currentFileService.fileMapByType$);
  equipment = toSignal(this.currentFileService.elementsToRender$, { initialValue: null });

  files = computed(() =>{
    if(!this.filesMap() ||!this.filesMap()!.get('pid')) return [];
    console.log('files', this.filesMap());
    return this.filesMap()?.get('pid') ?? [];
  })

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
    });
        
    this.currentFileService.filesLoaded$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (loaded) => {
        if(loaded){
          this.loadFiles();
          this.isLoading.set(false);
        }
        else{
          this.isLoading.set(true);
        } 
      },
      error: (error) => {
        console.error('Error loading files:', error);
        this.error.set(error.message);
      }
    })
  }

  loadFiles(type: string = 'pid'): void {
        const criteria = type==='pid' ? 'vendor' : 'fileType';
        const nestedItems = this.createListOfNestedItems(this.currentFileService.getFilesByType(type), criteria);
        this.menuItems.set(nestedItems);
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
