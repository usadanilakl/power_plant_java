import { Component, EventEmitter, inject, Input, OnInit, Output, DestroyRef, signal, computed, OnChanges, SimpleChanges } from '@angular/core';
import { FormContainerDto } from '../../../../models/forms/form-container.model';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrentPrintableFormService } from '../../../../services/forms/current-printable-form.service';
import { FormField } from '../../../../models/ui/form-field.model';
import { TitleCasePipe } from '@angular/common';

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

  private propertyChange$ = new Subject<void>();
  private currentPrintableFormService = inject(CurrentPrintableFormService);
  private destroyRef = inject(DestroyRef);

  flattenedFields: FieldOption[] = [];
  formFieldTypes: FormField['type'][] = [
    'text', 'textarea', 'select', 'multi-select', 'date', 'time', 
    'checkbox-group', 'checkbox', 'radio', 'file', 'multi-input', 
    'number', 'radio-group'
  ];

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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['availableFields'] && this.availableFields) {
      this.flattenedFields = this.flattenDto(this.availableFields);
    }
  }

  onPropertyChange(): void {
    this.propertyChange$.next();
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






  // onContentTypeChange(): void {
  //   if (this.container) {
  //     this.container.content = null;
  //   }
  //   this.onPropertyChange();
  // }

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
      } else {
        this.container.content = null;
      }
      this.onPropertyChange();
    }
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




  private flattenDto(obj: any, path: string = '', label: string = ''): FieldOption[] {
    let fields: FieldOption[] = [];
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
      return [];
    }

    for (const key of Object.keys(obj)) {
      // Skip private/internal properties
      if (key.startsWith('_')) continue;

      const value = (obj as any)[key];
      const newPath = path ? `${path}.${key}` : key;
      const newLabel = label ? `${label} > ${this.formatLabel(key)}` : this.formatLabel(key);

      if (value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length > 0) {
        fields = fields.concat(this.flattenDto(value, newPath, newLabel));
      } else {
        fields.push({ path: newPath, label: newLabel });
      }
    }
    return fields;
  }

  private formatLabel(key: string): string {
    const result = key.replace(/([A-Z])/g, ' $1');
    return result.charAt(0).toUpperCase() + result.slice(1);
  }

  isFormFieldContent(content: any): content is FormField {
    return content && typeof content === 'object' && 'type' in content;
  }

}
