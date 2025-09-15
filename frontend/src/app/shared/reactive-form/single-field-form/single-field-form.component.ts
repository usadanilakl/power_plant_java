import { Component, input, output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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

  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      field: ['', Validators.required]
    });
  }

  // This method is no longer tied to ngSubmit
  submitForm() {
    if (this.form.valid) {
      console.log('SingleFieldFormComponent: submitForm() called, emitting value.');
      this.formSubmitted.emit(this.form.value.field);
      this.form.reset();
    }
  }
}