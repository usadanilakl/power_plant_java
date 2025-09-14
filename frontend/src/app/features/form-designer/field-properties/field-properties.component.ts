
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormField } from '../../../models/ui/form-field.model';

@Component({
  selector: 'app-field-properties',
  templateUrl: './field-properties.component.html',
  styleUrls: ['./field-properties.component.css']
})
export class FieldPropertiesComponent {
  @Input() field: FormField | null = null;
  @Output() styleChange = new EventEmitter<{property: keyof NonNullable<FormField['style']>, value: any}>();
  @Output() layoutChange = new EventEmitter<{property: keyof NonNullable<FormField['layout']>, value: any}>();
  @Output() lineToggle = new EventEmitter<'top' | 'right' | 'bottom' | 'left'>();

  updateStyle(property: keyof NonNullable<FormField['style']>, event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.styleChange.emit({property, value});
  }

  updateLayout(property: keyof NonNullable<FormField['layout']>, event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.layoutChange.emit({property, value});
  }

  toggleLine(side: 'top' | 'right' | 'bottom' | 'left') {
    this.lineToggle.emit(side);
  }
}