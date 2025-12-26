import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RfFormField } from '../../../../../models/ui/form-field.model';

@Component({
  selector: 'app-form-group-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './form-group-input.component.html',
  styleUrl: './form-group-input.component.css',
})
export class FormGroupInputComponent {
  label = input<string>('');
  fields = input<RfFormField[]>([]);
  formGroup = input.required<FormGroup>();
  layout = input<'row' | 'column' | 'grid'>('column');

  // Helper to get field options
  getFieldOptions = computed(() => {
    return (options: any): any[] => {
      if (!options) return [];
      if (typeof options === 'function') return options();
      if (Array.isArray(options)) return options;
      return [];
    };
  });
}
