import { Component, EventEmitter, inject, Input, OnInit, Output, DestroyRef, signal, computed, OnChanges, SimpleChanges } from '@angular/core';
import { FormContainerDto } from '../../../../models/forms/form-container.model';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, single } from 'rxjs/operators';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { CurrentPrintableFormService } from '../../../../services/forms/current-printable-form.service';
import { FormField } from '../../../../models/ui/form-field.model';
import { TitleCasePipe } from '@angular/common';
import { PrintableFormDto } from '../../../../models/forms/printable-form.model';

interface FieldOption {
  path: string;
  label: string;
}

@Component({
  selector: 'app-form-container-properties',
  standalone: true,
  imports: [FormsModule,TitleCasePipe],
  templateUrl: './form-container-properties.component.html',
  styleUrl: './form-container-properties.component.css'
})
export class FormContainerPropertiesComponent implements OnInit, OnChanges {

  @Input() container: FormContainerDto | null = null;
  @Input() availableFields: any = {};
  @Output() updateContainer = new EventEmitter<FormContainerDto>();
  @Output() deleteContainer = new EventEmitter<number>();
  @Output() bulkUpdate = new EventEmitter<{
    properties: Partial<FormContainerDto>;
    target: 'selected' | 'page' | 'type';
    containerType?: string;
  }>();

  private propertyChange$ = new Subject<void>();
  private currentPrintableFormService = inject(CurrentPrintableFormService);
  private destroyRef = inject(DestroyRef);

  flattenedFields: FieldOption[] = [];
  arrayFields: FieldOption[] = [];
  formFieldTypes: FormField['type'][] = [
    'text', 'textarea', 'select', 'multi-select', 'date', 'time',
    'checkbox-group', 'checkbox', 'radio', 'file', 'multi-input',
    'number', 'radio-group', 'form-array', 'work-area-select',
  ];

  totalPages = this.currentPrintableFormService.totalPages;
  pages = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));

  isBulkEditMode = signal<boolean>(false);
  bulkEditTarget = signal<'selected' | 'page' | 'type'>('selected');

  printableForms = toSignal(this.currentPrintableFormService.allForms$, { initialValue: [] });


  ngOnInit(): void {
    this.propertyChange$
      .pipe(
        debounceTime(700), // Wait for 300ms of inactivity
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        if (this.container) {
          // Emit a new instance to ensure change detection and immutability
          this.submitChanges(new FormContainerDto(this.container));
          console.log('Updated container (debounced):', this.container);
        }
      });
  }

  // ngOnChanges(changes: SimpleChanges): void {
  //   if (changes['availableFields'] && this.availableFields) {
  //     this.flattenedFields = this.flattenDto(this.availableFields);
  //   }
  // }
    ngOnChanges(changes: SimpleChanges): void {
      if (changes['availableFields'] && this.availableFields) {
        this.processAvailableFields(this.availableFields);
      }
    }

  onPropertyChange(): void {
    if (this.isBulkEditMode()) {
      // this.applyBulkUpdate();
    } else {
      this.propertyChange$.next();
    }
  }

  useContainerNameAsContent() {
    if (this.container) {
      this.container.content = this.container.name;
      this.onPropertyChange();
    }
  }

  setAllPaddings(event: Event) {
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
    this.deleteContainer.emit(this.container?.id?? 0);
  }

  getContainerName(): string {
    return this.container?.name?? 'No Name';
  }

  submitChanges(container: FormContainerDto): void {
    if (this.updateContainer.observed) {
      this.updateContainer.emit(container);
    } else {
      this.currentPrintableFormService.updateContainer(container);
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
  
  toggleTransparentBackground() {
    if (this.container) {
      if (this.container.style.backgroundColor === 'transparent') {
        // If it's already transparent, revert to a default color (e.g., white)
        this.container.style.backgroundColor = '#ffffff';
      } else {
        // Otherwise, make it transparent
        this.container.style.backgroundColor = 'transparent';
      }
      this.onPropertyChange();
    }
  }


  //bulk edit methods

  toggleBulkEditMode(): void {
    this.isBulkEditMode.update(value => !value);
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
      pageNumber: this.container.pageNumber
    };

    const target = this.bulkEditTarget();
    let containerType: string | undefined;
    if (target === 'type' && this.container.contentType === 'formField' && typeof this.container.content === 'object' && this.container.content) {
      containerType = (this.container.content as any).type;
    }


    if(this.bulkUpdate.observers.length > 0) {
      this.bulkUpdate.emit({
        properties: propertiesToUpdate,
        target: target,
        containerType: containerType
      });
      return;
    }
    this.currentPrintableFormService.bulkUpdateContainers(target, containerType, propertiesToUpdate);
  }

  onContentTypeChange(): void {
    if (this.container) {
      if (this.container.contentType === 'formField') {
        // Check if content is not already a FormField object
        if (typeof this.container.content !== 'object' || !this.container.content || !('type' in this.container.content)) {
          this.container.content = {
            name: '',
            type: 'text', // Default type
            label: '',
            options: [],
            initialValue: null
          };
        }
      } else if (this.container.contentType === 'text') {
        this.container.content = '';
      } else if(this.container.contentType === 'repeatingSection'){
          console.log('Setting default repeating section content ', this.container);
        if (typeof this.container.content !== 'object' || !this.container.content || !('type' in this.container.content)) {
          this.container.content = {
            name: '',
            type: 'form-array',
            label: '',
            nestedForm: new PrintableFormDto(),
            initialValue: null,
          };
        }

      } else {
        this.container.content = null;
      }
      this.onPropertyChange();
    }
  }

  formId: number = 0;
  onEntityFieldTypeChange(): void {
    if(this.container && this.container.contentType === 'repeatingSection' && this.isFormFieldContent(this.container.content)){
      const selectedForm = this.printableForms().find(form => form.id === this.formId);
      if(selectedForm){
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




  // private flattenDto(obj: any, path: string = '', label: string = ''): FieldOption[] {
  //   let fields: FieldOption[] = [];
  //   if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
  //     return [];
  //   }

  //   for (const key of Object.keys(obj)) {
  //     // Skip private/internal properties
  //     if (key.startsWith('_')) continue;

  //     const value = (obj as any)[key];
  //     const newPath = path ? `${path}.${key}` : key;
  //     const newLabel = label ? `${label} > ${this.formatLabel(key)}` : this.formatLabel(key);

  //     if (value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length > 0) {
  //       fields = fields.concat(this.flattenDto(value, newPath, newLabel));
  //     } else {
  //       fields.push({ path: newPath, label: newLabel });
  //     }
  //   }
  //   return fields;
  // }

    private processAvailableFields(dto: any): void {
      const { fields, arrayFields } = this.flattenDto(dto);
      this.flattenedFields = fields;
      this.arrayFields = arrayFields;
      console.log('Available fields: ', this.flattenedFields);
      console.log('Array fields: ', this.arrayFields);
    }

  private flattenDto(obj: any, path: string = '', label: string = ''): { fields: FieldOption[], arrayFields: FieldOption[] } {
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
        // Optionally, if you want to map fields inside array objects, you can add logic here.
        // For now, we just mark the array itself.
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

  isFormFieldContent(content: any): content is FormField {
    return content && typeof content === 'object' && 'type' in content;
  }

  setPageNumber(pageNumber: number) {
    if (this.container) {
      this.container.pageNumber = pageNumber;
      this.onPropertyChange();
    }
  }

}
