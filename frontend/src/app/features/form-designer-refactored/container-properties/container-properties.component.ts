import { Component, computed, DestroyRef, EventEmitter, inject, Input, OnChanges, OnInit, Output, signal, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TitleCasePipe } from '@angular/common';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormContainerDto } from '../models/form-container.model';
import { PrintableFormDto } from '../models/printable-form.model';
import { FormField } from '../../../models/ui/form-field.model';
import { FormStateService } from '../services/form-state.service';

interface FieldOption {
  path: string;
  label: string;
}

@Component({
  selector: 'app-container-properties',
  standalone: true,
  imports: [FormsModule, TitleCasePipe],
  templateUrl: './container-properties.component.html',
  styleUrl: './container-properties.component.css',
})
export class ContainerPropertiesComponent implements OnInit, OnChanges {
  @Input() container: FormContainerDto | null = null;
  @Input() availableFields: any = {};
  @Output() updateContainerEvent = new EventEmitter<FormContainerDto>();
  @Output() deleteContainerEvent = new EventEmitter<number>();
  @Output() bulkUpdateEvent = new EventEmitter<{
    properties: Partial<FormContainerDto>;
    target: 'selected' | 'page' | 'type';
    containerType?: string;
  }>();

  private propertyChange$ = new Subject<void>();
  private formState = inject(FormStateService);
  private destroyRef = inject(DestroyRef);

  flattenedFields: FieldOption[] = [];
  arrayFields: FieldOption[] = [];
  formFieldTypes: FormField['type'][] = [
    'text', 'textarea', 'select', 'multi-select', 'date', 'time',
    'checkbox-group', 'checkbox', 'radio', 'file', 'multi-input',
    'number', 'radio-group', 'form-array',
  ];

  totalPages = this.formState.totalPages;
  pages = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));

  isBulkEditMode = signal<boolean>(false);
  bulkEditTarget = signal<'selected' | 'page' | 'type'>('selected');

  printableForms = toSignal(this.formState.allForms$, { initialValue: [] });

  ngOnInit(): void {
    this.propertyChange$
      .pipe(
        debounceTime(700),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        if (this.container) {
          this.submitChanges(new FormContainerDto(this.container));
        }
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['availableFields'] && this.availableFields) {
      this.processAvailableFields(this.availableFields);
    }
  }

  onPropertyChange(): void {
    this.propertyChange$.next();
  }

  useContainerNameAsContent(): void {
    if (this.container) {
      this.container.content = this.container.name;
      this.onPropertyChange();
    }
  }

  setAllPaddings(event: Event): void {
    if (this.container) {
      const input = event.target as HTMLInputElement;
      const value = input.value;
      const padding = value ? `${value}px` : '';
      this.container.style.paddingTop = padding;
      this.container.style.paddingRight = padding;
      this.container.style.paddingBottom = padding;
      this.container.style.paddingLeft = padding;
      this.onPropertyChange();
    }
  }

  onDelete(): void {
    this.deleteContainerEvent.emit(this.container?.id ?? 0);
  }

  getContainerName(): string {
    return this.container?.name ?? 'No Name';
  }

  submitChanges(container: FormContainerDto): void {
    if (this.updateContainerEvent.observed) {
      this.updateContainerEvent.emit(container);
    } else {
      this.formState.updateContainer(container);
    }
  }

  toggleBorder(side: 'Top' | 'Right' | 'Bottom' | 'Left'): void {
    if (!this.container) return;
    const borderSide = `border${side}Width` as keyof CSSStyleDeclaration;
    const style = this.container.style as any;
    const currentWidth = style[borderSide];

    if (currentWidth === '0px' || !currentWidth) {
      style[borderSide] = '1px';
    } else {
      style[borderSide] = '0px';
    }
    this.onPropertyChange();
  }

  isBorderVisible(side: 'Top' | 'Right' | 'Bottom' | 'Left'): boolean {
    if (!this.container) return false;
    const borderSide = `border${side}Width` as keyof CSSStyleDeclaration;
    const width = this.container.style[borderSide];
    return width !== '0px' && !!width;
  }

  toggleLocked(): void {
    if (this.container) {
      this.container.locked = !this.container.locked;
      this.onPropertyChange();
    }
  }

  toggleTransparentBackground(): void {
    if (this.container) {
      if (this.container.style.backgroundColor === 'transparent') {
        this.container.style.backgroundColor = '#ffffff';
      } else {
        this.container.style.backgroundColor = 'transparent';
      }
      this.onPropertyChange();
    }
  }

  toggleBulkEditMode(): void {
    this.isBulkEditMode.update(v => !v);
  }

  setBulkEditTarget(target: 'selected' | 'page' | 'type'): void {
    this.bulkEditTarget.set(target);
  }

  applyBulkUpdate(): void {
    if (!this.container) return;

    const propertiesToUpdate: Partial<FormContainerDto> = {
      size: this.container.size,
      style: this.container.style,
      contentStyle: this.container.contentStyle,
      pageNumber: this.container.pageNumber,
    };

    const target = this.bulkEditTarget();
    let containerType: string | undefined;
    if (target === 'type' && this.container.contentType === 'formField' && typeof this.container.content === 'object' && this.container.content) {
      containerType = (this.container.content as any).type;
    }

    this.formState.bulkUpdateContainers(target, containerType, propertiesToUpdate);
  }

  onContentTypeChange(): void {
    if (this.container) {
      if (this.container.contentType === 'formField') {
        if (typeof this.container.content !== 'object' || !this.container.content || !('type' in this.container.content)) {
          this.container.content = { name: '', type: 'text', label: '', options: [], initialValue: null };
        }
      } else if (this.container.contentType === 'text') {
        this.container.content = '';
      } else if (this.container.contentType === 'repeatingSection') {
        if (typeof this.container.content !== 'object' || !this.container.content || !('type' in this.container.content)) {
          this.container.content = { name: '', type: 'form-array', label: '', nestedForm: new PrintableFormDto(), initialValue: null };
        }
      } else {
        this.container.content = null;
      }
      this.onPropertyChange();
    }
  }

  formId: number = 0;
  onEntityFieldTypeChange(): void {
    if (this.container && this.container.contentType === 'repeatingSection' && this.isFormFieldContent(this.container.content)) {
      const selectedForm = this.printableForms().find(form => form.id === this.formId);
      if (selectedForm) {
        this.container.content.nestedForm = selectedForm;
      }
    }
    this.onPropertyChange();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0] && this.container) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        if (this.container) {
          this.container.content = e.target?.result as string;
          this.onPropertyChange();
        }
      };
      reader.readAsDataURL(file);
    }
  }

  compareFields(f1: FormField, f2: FormField): boolean {
    return f1 && f2 ? f1.name === f2.name : f1 === f2;
  }

  isFormFieldContent(content: any): content is FormField {
    return content && typeof content === 'object' && 'type' in content;
  }

  setPageNumber(pageNumber: number): void {
    if (this.container) {
      this.container.pageNumber = pageNumber;
      this.onPropertyChange();
    }
  }

  private processAvailableFields(dto: any): void {
    const { fields, arrayFields } = this.flattenDto(dto);
    this.flattenedFields = fields;
    this.arrayFields = arrayFields;
  }

  private flattenDto(obj: any, path: string = '', label: string = ''): { fields: FieldOption[]; arrayFields: FieldOption[] } {
    let fields: FieldOption[] = [];
    let arrayFields: FieldOption[] = [];

    if (!obj || typeof obj !== 'object') {
      return { fields, arrayFields };
    }

    for (const key of Object.keys(obj)) {
      if (key.startsWith('_')) continue;

      const value = (obj as any)[key];
      const newPath = path ? `${path}.${key}` : key;
      const newLabel = label ? `${label} > ${this.formatLabel(key)}` : this.formatLabel(key);

      if (Array.isArray(value)) {
        arrayFields.push({ path: newPath, label: newLabel });
      } else if (value && typeof value === 'object' && Object.keys(value).length > 0) {
        const nested = this.flattenDto(value, newPath, newLabel);
        fields = fields.concat(nested.fields);
        arrayFields = arrayFields.concat(nested.arrayFields);
      } else {
        fields.push({ path: newPath, label: newLabel });
      }
    }
    return { fields, arrayFields };
  }

  private formatLabel(key: string): string {
    const result = key.replace(/([A-Z])/g, ' $1');
    return result.charAt(0).toUpperCase() + result.slice(1);
  }
}
