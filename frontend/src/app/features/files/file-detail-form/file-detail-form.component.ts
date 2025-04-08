import { Component, Output, EventEmitter, Input} from '@angular/core';
import { DetailsFormComponent } from '../../../shared/details-form/details-form.component';

@Component({
  selector: 'app-file-detail-form',
  standalone: true,
  imports: [DetailsFormComponent],
  templateUrl: './file-detail-form.component.html',
  styleUrl: './file-detail-form.component.css'
})
export class FileDetailFormComponent {
  @Input() values: any = {};
  @Input() formSubmit!: (data: any) => void;
  @Input() formDelete!: () => void;
  @Input() openImage!: () => void;

  @Output() formSubmitEvent = new EventEmitter<any>();
  @Output() formDeleteEvent = new EventEmitter<void>();
  @Output() openImageEvent = new EventEmitter<void>();

  fields = [
    { name: 'name', label: 'File Name', type: 'text' },
    { name: 'type', label: 'File Type', type: 'text' },
    { name: 'size', label: 'File Size', type: 'text', readonly: true },
    { name: 'uploadDate', label: 'Upload Date', type: 'date', readonly: true },
    { name: 'category', label: 'Category', type: 'select', options: [
      { value: 'document', label: 'Document' },
      { value: 'image', label: 'Image' },
      { value: 'spreadsheet', label: 'Spreadsheet' },
      { value: 'other', label: 'Other' }
    ]},
    { name: 'tags', label: 'Tags', type: 'checkbox-group', options: [
      { value: 'important', label: 'Important' },
      { value: 'archived', label: 'Archived' },
      { value: 'confidential', label: 'Confidential' }
    ]},
    { name: 'description', label: 'Description', type: 'textarea' }
  ];

  onFormSubmit(formData: any) {
    if (this.formSubmit) {
      this.formSubmit(formData);
    }
    this.formSubmitEvent.emit(formData);
  }

  onFormDelete() {
    if (this.formDelete) {
      this.formDelete();
    }
    this.formDeleteEvent.emit();
  }

  onOpenImage() {
    if (this.openImage) {
      this.openImage();
    }
    this.openImageEvent.emit();
  }
}