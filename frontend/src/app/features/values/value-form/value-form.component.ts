import { Component, computed, inject, input, signal, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ValueDto } from '../../../models/value.model';
import { AddValueFormComponent } from "../add-value-form/add-value-form.component";
import { CurrentValueService } from '../../../services/current-value.service';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { switchMap, of } from 'rxjs';

@Component({
  selector: 'app-value-form',
  imports: [AddValueFormComponent, FormsModule, CommonModule],
  templateUrl: './value-form.component.html',
  styleUrl: './value-form.component.css',
  standalone: true,
})
export class ValueFormComponent {
  private currentValueService = inject(CurrentValueService);

  selectedValue = input<ValueDto>();
  selectedValueId = signal<string | null>(null);
  editingName = signal<string>('');
  transferToValueId = signal<string | null>(null);

  isEditing = signal<boolean>(false);
  isDeleting = signal<boolean>(false);

  categoryAlias = computed(() => this.selectedValue()?.category?.alias);

  valuesOfSameCategory = toSignal(
    toObservable(this.categoryAlias).pipe(
      switchMap(alias => alias ? this.currentValueService.getValuesByCategory(alias) : of([]))
    ),
    { initialValue: [] }
  );

  constructor() {
    effect(() => {
      const value = this.selectedValue();
      if (value) {
        this.selectedValueId.set(value.id);
        this.editingName.set(value.name);
      }
    });
  }

  selectEditingMode() {
    this.isEditing.set(true);
    this.isDeleting.set(false);
  }

  selectDeletingMode() {
    this.isDeleting.set(true);
    this.isEditing.set(false);
    this.transferToValueId.set(null);
  }

  onValueSelect(valueId: string | null) {
    this.selectedValueId.set(valueId);
    const selectedValue = this.valuesOfSameCategory().find(v => v.id === valueId);
    if (selectedValue) {
      this.editingName.set(selectedValue.name);
    }
  }

  onNameChange(newName: string) {
    this.editingName.set(newName);
  }

  submitEdit() {
    if (this.selectedValueId() && this.editingName()) {
      // Call your service method to update the value
      this.currentValueService.updateValue(this.selectedValueId()!, this.editingName()).subscribe(
        updatedValue => {
          console.log('Value updated:', updatedValue);
          // Update local state or emit event to parent component
        },
        error => console.error('Error updating value:', error)
      );
    }
  }

  submitDelete() {
    if (this.selectedValueId() && this.transferToValueId()) {
      // Call your service method to delete the value and transfer associated items
      this.currentValueService.deleteValueAndTransfer(this.selectedValueId()!, this.transferToValueId()!).subscribe(
        result => {
          console.log('Value deleted and items transferred:', result);
          // Update local state or emit event to parent component
        },
        error => console.error('Error deleting value:', error)
      );
    }
  }
}