import { Component, inject, effect, DestroyRef, computed, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LotoConflictStateService } from '../services/loto-conflict-state.service';
import { LotoConflictDetailComponent } from '../loto-conflict-detail/loto-conflict-detail.component';
import { InteractiveImageComponent } from '../../../shared/image/refactored/interactive-image/interactive-image.component';
import { RfShape, SVGSymbolShape } from '../../../shared/image/refactored/models/fr-shape.model';
import { EquipmentMapperService } from '../../equipment/refactored/services/equipment-mapper.service';
import { RfLotoPointApiService } from '../../loto-points/refactored/services/rf-loto-point-api.service';
import { EquipmentService } from '../../../services/equipment.service';
import { CurrentFileService } from '../../../services/current-file.service';
import { EquipmentDto } from '../../../models/equipment/equipment.model';

@Component({
  selector: 'app-loto-conflict-right-panel',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    InteractiveImageComponent,
    LotoConflictDetailComponent,
  ],
  templateUrl: './loto-conflict-right-panel.component.html',
  styleUrl: './loto-conflict-right-panel.component.css',
})
export class LotoConflictRightPanelComponent {
  protected state = inject(LotoConflictStateService);
  private lotoPointApi = inject(RfLotoPointApiService);
  private equipmentService = inject(EquipmentService);
  private equipmentMapper = inject(EquipmentMapperService);
  private currentFileService = inject(CurrentFileService);
  private destroyRef = inject(DestroyRef);

  isEditMode = signal(false);

  /** Currently selected shape for dragging — updated on click */
  selectedShapeId = signal<number | null>(null);

  imageUrl = computed(() => {
    const file = this.state.currentFile();
    return file?.fileLink || '';
  });

  shapes = computed(() => this.state.currentShapes());

  activePreset = computed<'VIEW_ONLY' | 'EQUIPMENT_EDITOR'>(() =>
    this.isEditMode() ? 'EQUIPMENT_EDITOR' : 'VIEW_ONLY'
  );

  highlightedShapeIds = computed(() => {
    const point = this.state.selectedPoint();
    const equipment = this.state.currentEquipment();
    if (!point || !equipment.length) return [];
    const pointEqIds = new Set(point.equipmentIdList || []);
    return equipment
      .filter((eq) => pointEqIds.has(eq.id!))
      .map((eq) => eq.id!);
  });

  constructor() {
    effect(() => {
      const point = this.state.selectedPoint();
      if (point) {
        this.isEditMode.set(false);
        this.selectedShapeId.set(null);
        this.loadRelatedFileForPoint(point.id!);
      }
    });

    this.currentFileService.elementsToRender$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (equipment: EquipmentDto[]) => {
          if (equipment && equipment.length > 0) {
            this.state.setCurrentEquipment(equipment);
            const shapes = this.equipmentMapper.mapAllToRfShapes(equipment);
            this.state.currentShapes.set(shapes);
          } else {
            this.state.setCurrentEquipment([]);
            this.state.currentShapes.set([]);
          }
        },
      });
  }

  toggleEditMode(): void {
    const entering = !this.isEditMode();
    this.isEditMode.set(entering);
    if (entering) {
      // Pre-select the first highlighted shape so it's immediately draggable
      const ids = this.highlightedShapeIds();
      this.selectedShapeId.set(ids.length > 0 ? ids[0] : null);
    } else {
      this.selectedShapeId.set(null);
    }
  }

  /** When user clicks a shape in edit mode, select it for dragging */
  onShapeClicked(shape: RfShape): void {
    if (this.isEditMode()) {
      this.selectedShapeId.set(shape.id);
    }
  }

  resetShapePositions(): void {
    const highlighted = this.highlightedShapeIds();
    if (highlighted.length === 0) return;

    this.isEditMode.set(true);

    setTimeout(() => {
      const allShapes = this.state.currentShapes();
      const refShape = allShapes.find((s) => s.originalPictureWidth > 0);
      const imgW = refShape?.originalPictureWidth || 2000;
      const imgH = refShape?.originalPictureHeight || 1500;

      const centerX = imgW / 2;
      const centerY = imgH / 2;

      const updatedShapes = allShapes.map((shape) => {
        if (!highlighted.includes(shape.id)) return shape;
        if (shape.type !== 'rectangle' && shape.type !== 'image' && shape.type !== 'svg-symbol') return shape;

        const idx = highlighted.indexOf(shape.id);
        const offsetX = idx * 80;
        const w = (shape as any).width || 100;
        const h = (shape as any).height || 100;

        const newShape = {
          ...shape,
          x: centerX - w / 2 + offsetX,
          y: centerY - h / 2,
        } as RfShape;

        this.onShapeUpdated(newShape);
        return newShape;
      });

      this.state.currentShapes.set(updatedShapes);
      // Select the first shape after repositioning
      this.selectedShapeId.set(highlighted[0]);
    });
  }

  onShapeUpdated(shape: RfShape): void {
    const equipment = this.state.currentEquipment();
    const matching = equipment.find((eq) => eq.id === shape.id);
    if (!matching) return;

    const updated = new EquipmentDto(matching);

    if (shape.type === 'rectangle' || shape.type === 'image' || shape.type === 'svg-symbol') {
      const coordinates = JSON.stringify({
        startX: shape.x,
        startY: shape.y,
        endX: shape.x + shape.width,
        endY: shape.y + shape.height,
        width: shape.width,
        height: shape.height,
        rotation: shape.rotation || 0,
      })
        .replace(/^"|"$/g, '')
        .replace(/\\/g, '')
        .replace(/"(\w+)":/g, '$1:');

      const originalPictureSize = `width:${shape.originalPictureWidth},height:${shape.originalPictureHeight}`;

      updated.coordinates = coordinates;
      updated.originalPictureSize = originalPictureSize;

      if (shape.type === 'svg-symbol') {
        const symbolShape = shape as SVGSymbolShape;
        updated.symbolId = symbolShape.symbolId;
        updated.svgPath = symbolShape.svgPath;
      }

      this.equipmentService
        .updateEquipment(updated)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => console.log('Equipment position saved:', shape.id),
          error: (err: any) => console.error('Failed to save equipment position:', err),
        });
    }
  }

  private loadRelatedFileForPoint(pointId: number): void {
    this.lotoPointApi
      .getRelatedFiles(pointId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res.responseData && res.responseData.length > 0) {
            const file = res.responseData[0];
            this.state.setCurrentFile(file);
            this.currentFileService.setCurrentFile(file);
          } else {
            this.state.setCurrentFile(null);
            this.state.setCurrentEquipment([]);
            this.state.currentShapes.set([]);
          }
        },
        error: (err) => console.error('Failed to load related files:', err),
      });
  }
}
