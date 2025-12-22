import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RfFormInputComponent } from '../form-input/rf-form-input.component';
import { RfFormField } from '../../../../../models/ui/form-field.model';

@Component({
  selector: 'app-form-array-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RfFormInputComponent],
  templateUrl: './form-array-input.component.html',
  styleUrl: './form-array-input.component.css',
})
export class FormArrayInputComponent {
  label = input<string>('');
  fields = input<RfFormField[]>([]);
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
