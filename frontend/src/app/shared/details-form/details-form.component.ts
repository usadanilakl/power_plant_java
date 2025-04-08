import { Component, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SearchableDropdownComponent } from "../searchable-dropdown/searchable-dropdown.component";
import { CheckboxGroupComponent } from "../checkbox-group/checkbox-group.component";
import { FormInputComponent } from "../form-input/form-input.component";

@Component({
  selector: 'app-details-form',
  standalone: true,
  templateUrl: './details-form.component.html',
  styleUrls: ['./details-form.component.css'],
  imports: [SearchableDropdownComponent, CheckboxGroupComponent, FormInputComponent, ReactiveFormsModule]
})
export class DetailsFormComponent {
  @Input() fields: any[] = [];
  @Input() values: any = {};
  @Input() layout: 'row' | 'column' = 'row';
  @Output() formSubmit = new EventEmitter<any>();
  @Output() formDelete = new EventEmitter<void>();

  form!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.createForm();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['values'] && !changes['values'].firstChange) {
      this.updateForm();
    }
  }

  createForm() {
    const group: { [key: string]: any[] } = {};
    this.fields.forEach(field => {
      group[field.name] = [this.values[field.name] || ''];
    });
    this.form = this.fb.group(group);
  }

  updateForm() {
    if (this.form) {
      this.fields.forEach(field => {
        if (this.form.get(field.name)) {
          this.form.get(field.name)!.setValue(this.values[field.name] || '');
        }
      });
    }
  }

  onSubmit() {
    if (this.form.valid) {
      this.formSubmit.emit(this.form.value);
    }
  }

  onDelete() {
    this.formDelete.emit();
  }
}