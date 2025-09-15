import { Component, input, output } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-single-field-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './single-field-form.component.html',
  styleUrl: './single-field-form.component.css'
})
export class SingleFieldFormComponent {
  fieldLabel = input.required<string>();
  formSubmitted = output<string>();

  fieldControl = new FormControl('', [Validators.required]);

  onSubmit(): void {
    if (this.fieldControl.valid && this.fieldControl.value) {
      this.formSubmitted.emit(this.fieldControl.value);
      this.fieldControl.reset();
    }
  }
}