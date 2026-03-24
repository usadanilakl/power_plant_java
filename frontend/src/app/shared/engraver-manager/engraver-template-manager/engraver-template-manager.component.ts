import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RfPopupProjectionComponent } from '../../popup-projection/rf-popup-projection.component';
import { EngraverApiService } from '../engraver-api.service';
import { EngraverTemplateDto } from '../models/engraver-template.model';

@Component({
  selector: 'app-engraver-template-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, RfPopupProjectionComponent, TitleCasePipe],
  templateUrl: './engraver-template-manager.component.html',
  styleUrls: ['./engraver-template-manager.component.css']
})
export class EngraverTemplateManagerComponent {
  @Input() isOpen: boolean = false;
  @Output() closed = new EventEmitter<void>();
  @Output() templatesChanged = new EventEmitter<void>();

  private engraverApi = inject(EngraverApiService);

  templates = signal<EngraverTemplateDto[]>([]);
  isEditing = signal(false);
  editingTemplate = signal<EngraverTemplateDto | null>(null);
  isUploading = signal(false);

  // Form fields
  formName = '';
  formDescription = '';
  formTagSize = '';
  formDataStructure = 'standard';
  formBatchSize = 4;
  formIsDefault = false;
  formWithQr = false;

  ngOnChanges(): void {
    if (this.isOpen) {
      this.loadTemplates();
    }
  }

  loadTemplates(): void {
    this.engraverApi.getEngraverTemplates().subscribe({
      next: (response) => {
        if (response.responseData) {
          this.templates.set(response.responseData);
        }
      }
    });
  }

  startCreate(): void {
    this.formName = '';
    this.formDescription = '';
    this.formTagSize = '';
    this.formDataStructure = 'standard';
    this.formBatchSize = 4;
    this.formIsDefault = false;
    this.formWithQr = false;
    this.editingTemplate.set(null);
    this.isEditing.set(true);
  }

  startEdit(template: EngraverTemplateDto): void {
    this.formName = template.name;
    this.formDescription = template.description || '';
    this.formTagSize = template.tagSize;
    this.formDataStructure = template.dataStructure;
    this.formBatchSize = template.batchSize;
    this.formIsDefault = template.isDefault;
    this.formWithQr = template.withQr;
    this.editingTemplate.set(template);
    this.isEditing.set(true);
  }

  save(): void {
    const dto: Partial<EngraverTemplateDto> = {
      name: this.formName,
      description: this.formDescription,
      tagSize: this.formTagSize,
      dataStructure: this.formDataStructure,
      batchSize: this.formBatchSize,
      isDefault: this.formIsDefault,
      withQr: this.formWithQr
    };

    const existing = this.editingTemplate();
    if (existing?.id) {
      this.engraverApi.updateEngraverTemplate(existing.id, dto).subscribe({
        next: () => {
          this.isEditing.set(false);
          this.loadTemplates();
          this.templatesChanged.emit();
        }
      });
    } else {
      this.engraverApi.createEngraverTemplate(dto).subscribe({
        next: () => {
          this.isEditing.set(false);
          this.loadTemplates();
          this.templatesChanged.emit();
        }
      });
    }
  }

  deleteTemplate(id: number): void {
    if (!confirm('Delete this template?')) return;
    this.engraverApi.deleteEngraverTemplate(id).subscribe({
      next: () => {
        this.loadTemplates();
        this.templatesChanged.emit();
      }
    });
  }

  uploadFile(templateId: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.isUploading.set(true);
    this.engraverApi.uploadTemplateFile(templateId, file).subscribe({
      next: () => {
        this.isUploading.set(false);
        this.loadTemplates();
        this.templatesChanged.emit();
      },
      error: () => {
        this.isUploading.set(false);
      }
    });

    // Reset file input so the same file can be re-selected
    input.value = '';
  }

  cancel(): void {
    this.isEditing.set(false);
    this.editingTemplate.set(null);
  }

  close(): void {
    this.isEditing.set(false);
    this.editingTemplate.set(null);
    this.closed.emit();
  }
}
