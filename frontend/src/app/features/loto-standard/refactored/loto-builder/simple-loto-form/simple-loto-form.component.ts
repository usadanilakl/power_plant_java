import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LotoStandardDto } from '../../../../../models/loto/loto-standard.model';
import { LotoPointDto } from '../../../../../models/loto/loto-point.model';

@Component({
  selector: 'app-simple-loto-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
  submit = output<LotoStandardDto>();
  cancel = output<void>();

  // Computed
  lotoPoints = computed(() => this.lotoStandard().lotoPoints || []);
  pointCount = computed(() => this.lotoPoints().length);

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
}
