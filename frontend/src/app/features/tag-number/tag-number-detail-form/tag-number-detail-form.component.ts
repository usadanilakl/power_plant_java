import { Component, Output, EventEmitter, Input} from '@angular/core';
import { DetailsFormComponent } from '../../../shared/details-form/details-form.component';

@Component({
  selector: 'app-tag-number-detail-form',
  standalone: true,
  imports: [DetailsFormComponent],
  templateUrl: './tag-number-detail-form.component.html',
  styleUrl: './tag-number-detail-form.component.css'
})
export class TagNumberDetailFormComponent {
  @Input() values: any = {};
  @Output() formSubmit = new EventEmitter<any>();
  @Output() formDelete = new EventEmitter<void>();

  fields = [
    { name: 'tagNumber', label: 'Tag Number', type: 'text' },
    { name: 'description', label: 'Description', type: 'text' },
    { name: 'system', label: 'System', type: 'select', options: [
      { value: 'electrical', label: 'Electrical' },
      { value: 'mechanical', label: 'Mechanical' },
      { value: 'instrumentation', label: 'Instrumentation' }
    ]},
    { name: 'status', label: 'Status', type: 'select', options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
      { value: 'maintenance', label: 'Under Maintenance' }
    ]},
    { name: 'categories', label: 'Categories', type: 'checkbox-group', options: [
      { value: 'safety', label: 'Safety' },
      { value: 'critical', label: 'Critical' },
      { value: 'monitoring', label: 'Monitoring' }
    ]}
  ];

  onFormSubmit(formData: any) {
    this.formSubmit.emit(formData);
  }

  onFormDelete() {
    this.formDelete.emit();
  }
}