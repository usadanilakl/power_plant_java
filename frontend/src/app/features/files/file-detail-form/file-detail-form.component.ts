import { Component, Output, EventEmitter, Input, OnInit, DestroyRef} from '@angular/core';
import { DetailsFormComponent } from '../../../shared/details-form/details-form.component';
import { SharedDataService } from '../../../services/shared-data.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-file-detail-form',
  standalone: true,
  imports: [DetailsFormComponent],
  templateUrl: './file-detail-form.component.html',
  styleUrl: './file-detail-form.component.css'
})
export class FileDetailFormComponent implements OnInit {
  @Input() values: any = {};
  @Input() formSubmit!: (data: any) => void;
  @Input() formDelete!: () => void;
  @Input() openImage!: () => void;

  @Output() formSubmitEvent = new EventEmitter<any>();
  @Output() formDeleteEvent = new EventEmitter<void>();
  @Output() openImageEvent = new EventEmitter<void>();
  
  get fileTypes$(): Observable<any[]> {
    return this.sharedDataService.fileTypes$;
  }

  constructor(
    private sharedDataService: SharedDataService,
    private destroyRef: DestroyRef
  ) {}

  fields = [
    { name: 'name', label: 'File Name', type: 'text' },
    { name: 'type', label: 'File Type', type: 'select', options: this.fileTypes$ },
    { name: 'file', label: 'File', type: 'file' },
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
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'systems', label: 'Systems', type: 'multi-select', options: [
      { value: 'cnd', label: 'Condensate System' },
      { value: 'bfw', label: 'Feed Water System' },
      { value: 'fgs', label: 'Fule Gas System' }
    ]},
  ];

  ngOnInit() {
    this.sharedDataService.loadFileTypes()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

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