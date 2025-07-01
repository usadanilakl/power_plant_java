import { Component, computed, inject, input, signal, effect, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ValueDto } from '../../../models/value.model';
import { CurrentValueService } from '../../../services/current-value.service';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { switchMap, of } from 'rxjs';

@Component({
  selector: 'app-value-form',
  imports: [ FormsModule, CommonModule],
  templateUrl: './value-form.component.html',
  styleUrl: './value-form.component.css',
  standalone: true,
})
export class ValueFormComponent{
  private currentValueService = inject(CurrentValueService);

  categoryAlias = input<string>();
  
  valueToEditId = signal<number | null>(null);
  transferValueId = signal<number | null>(null);
  editingName = signal<string | null>('');

  isEditing = signal<boolean>(true);
  isDeleting = signal<boolean>(false);

  values = signal<ValueDto[]>([]);

  constructor() {
    effect(() => {
      if (this.categoryAlias()) {
        this.loadValues();
      }
    });
  }
  

  loadValues() {
    console.log('Loading values for category:', this.categoryAlias());
    this.currentValueService.getValuesByCategory(this.categoryAlias()!).subscribe(
      (values) => {
        this.values.set(values);
      },
      (error) => {
        console.error('Error loading values:', error);
      }
    );
  }




  selectEditingMode() {
    this.isEditing.set(true);
    this.isDeleting.set(false);
  }

  selectDeletingMode() {
    this.isDeleting.set(true);
    this.isEditing.set(false);
    this.transferValueId.set(null);
  }

  onValueSelect(valueId: number | null) {
    this.valueToEditId.set(valueId);
    const selectedValue = this.values().find(v => v.id === valueId);
    if (selectedValue) {
      this.editingName.set(selectedValue.name);
    }
  }

  onTransferValueSelect(valueId: number | null) {
    this.transferValueId.set(valueId);
  }

  onNameChange(newName: string) {
    this.editingName.set(newName);
  }

  submitEdit() {
    if (this.valueToEditId() && this.editingName()) {
      // Call your service method to update the value
      this.currentValueService.updateValue(this.valueToEditId()!, this.editingName()!).subscribe(
        updatedValue => {
          console.log('Value updated:', updatedValue);
          // Update local state or emit event to parent component
        },
        error => console.error('Error updating value:', error)
      );
    }
  }

  submitDelete() {
    if (this.valueToEditId() && this.transferValueId()) {
      // Call your service method to delete the value and transfer associated items
      this.currentValueService.deleteValueAndTransfer(this.valueToEditId()!, this.transferValueId()!).subscribe(
        result => {
          console.log('Value deleted and items transferred:', result);
          // Update local state or emit event to parent component
        },
        error => console.error('Error deleting value:', error)
      );
    }
  }
}