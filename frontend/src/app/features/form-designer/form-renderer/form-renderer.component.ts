import { Component, OnInit } from '@angular/core';
import { FormField } from '../../../models/ui/form-field.model';
import { FormBuilder, FormGroup } from '@angular/forms';
import { FormBuilderService } from '../../../services/ui/form-builder.service';

@Component({
  selector: 'app-form-renderer',
  standalone: true,
  imports: [],
  templateUrl: './form-renderer.component.html',
  styleUrl: './form-renderer.component.css'
})
export class FormRendererComponent implements OnInit {
  formFields: FormField[] = [];
  form!: FormGroup;

  constructor(
    private formBuilderService: FormBuilderService,
    private fb: FormBuilder
  ) {}

  ngOnInit() {
    this.formBuilderService.formFields$.subscribe(fields => {
      this.formFields = fields;
      this.createForm();
    });
  }

  createForm() {
    const group: any = {};
    this.formFields.forEach(field => {
      group[field.name] = ['', field.validators];
    });
    this.form = this.fb.group(group);
  }

  onSubmit() {
    if (this.form.valid) {
      console.log(this.form.value);
      // Implement form submission logic
    }
  }

  print() {
    window.print();
  }
}
