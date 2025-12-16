import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FormField } from '@dk-power-full-stack/shared-interfaces';
import { FormInputComponent } from '../form-input/rf-form-input.component';

@Component({
  selector: 'app-form-array-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormInputComponent],
  templateUrl: './form-array-input.component.html',
  styleUrl: './form-array-input.component.css',
})
export class FormArrayInputComponent {
  label = input<string>('');
  fields = input<FormField[]>([]);
  formArray = input.required<FormArray>();

  addItem = output<void>();
  removeItem = output<number>();

  get itemControls() {
    return this.formArray().controls as FormGroup[];
  }

  onAddItem() {
    this.addItem.emit();
  }

  onRemoveItem(index: number) {
    this.removeItem.emit(index);
  }
}
