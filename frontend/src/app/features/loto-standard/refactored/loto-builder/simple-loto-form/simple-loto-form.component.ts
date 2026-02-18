import { Component, input, output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { LotoStandardDto } from '../../../../../models/loto/loto-standard.model';
import { LotoPointDto } from '../../../../../models/loto/loto-point.model';
import { BulkSearchDialogComponent } from '../../../../loto-points/refactored/bulk-search-dialog/bulk-search-dialog.component';
import { LotoPointDtoLight } from '../../../../../models/loto/bulk-search-result.model';

@Component({
  selector: 'app-simple-loto-form',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, BulkSearchDialogComponent],
  templateUrl: './simple-loto-form.component.html',
  styleUrl: './simple-loto-form.component.css',
})
export class SimpleLotoFormComponent {
  // Inputs
  lotoStandard = input.required<LotoStandardDto>();
  isActive = input<boolean>(false);

  // Outputs
  nameChanged = output<string>();
  descriptionChanged = output<string>();
  removePoint = output<LotoPointDto>();
  reorderPoints = output<LotoPointDto[]>();
  bulkAddPoints = output<LotoPointDto[]>();
  submit = output<LotoStandardDto>();
  cancel = output<void>();

  // Bulk search
  showBulkSearch = signal<boolean>(false);

  // Computed
  lotoPoints = computed(() => this.lotoStandard().lotoPoints || []);
  pointCount = computed(() => this.lotoPoints().length);

  // Drag state
  draggedIndex = signal<number | null>(null);

  /**
   * Handle name change
   */
  onNameChange(value: string): void {
    this.nameChanged.emit(value);
  }

  /**
   * Handle description change
   */
  onDescriptionChange(value: string): void {
    this.descriptionChanged.emit(value);
  }

  /**
   * Remove a LOTO point from the list
   */
  onRemovePoint(point: LotoPointDto): void {
    this.removePoint.emit(point);
  }

  /**
   * Submit the form
   */
  onSubmit(): void {
    this.submit.emit(this.lotoStandard());
  }

  /**
   * Cancel editing
   */
  onCancel(): void {
    this.cancel.emit();
  }

  /**
   * Handle bulk search points selected
   */
  onBulkPointsSelected(points: LotoPointDtoLight[]): void {
    this.showBulkSearch.set(false);
    const dtos = points.map(light => new LotoPointDto({
      id: light.id,
      tagNumber: light.tagNumber,
      description: light.description,
      unit: light.unit,
      specificLocation: light.specificLocation,
      normalPosition: light.normalPosition,
      isolatedPosition: light.isolatedPosition,
      oldId: light.oldId,
    }));
    this.bulkAddPoints.emit(dtos);
  }

  /**
   * Handle drag and drop reorder
   */
  onDrop(event: CdkDragDrop<LotoPointDto[]>): void {
    if (event.previousIndex === event.currentIndex) {
      return;
    }

    const points = [...this.lotoPoints()];
    moveItemInArray(points, event.previousIndex, event.currentIndex);
    this.reorderPoints.emit(points);
  }
}
