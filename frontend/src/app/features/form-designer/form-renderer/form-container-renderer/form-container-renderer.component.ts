import { Component, computed, forwardRef, input, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule, FormControl, FormArray } from '@angular/forms';
import { ContainerContentPipe } from '../../../../pipes/container-content.pipe';
import { InvisibleInputFieldComponent } from '../../inputs/invisible-input-field/invisible-input-field.component';
import { RadioCheckboxesComponent } from '../../inputs/radio-checkboxes/radio-checkboxes.component';
import { InvisibleSearchableSelectComponent } from '../../inputs/invisible-searchable-select/invisible-searchable-select.component';
import { ChekcboxXComponent } from '../../inputs/chekcbox-x/chekcbox-x.component';
import { InvisibleSearchableMultiSelectComponent } from '../../inputs/invisible-searchable-multi-select/invisible-searchable-multi-select.component';
import { NestedFormInputComponent } from '../../inputs/nested-form-input/nested-form-input.component';
import { FormContainerDto } from '../../../../models/forms/form-container.model';
import { FormField } from '../../../../models/ui/form-field.model';
import { PrintableFormDto } from '../../../../models/forms/printable-form.model';

@Component({
  selector: 'app-form-container-renderer',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ContainerContentPipe,
    InvisibleInputFieldComponent,
    RadioCheckboxesComponent,
    InvisibleSearchableSelectComponent,
    ChekcboxXComponent,
    InvisibleSearchableMultiSelectComponent,
    forwardRef(() => NestedFormInputComponent)
  ],
  templateUrl: './form-container-renderer.component.html',
  styleUrl: './form-container-renderer.component.css'
})
export class FormContainerRendererComponent {
  container = input.required<FormContainerDto>();
  @Input() form!: FormGroup;
  @Input() readOnly: boolean = false;
  @Input() formData: any = {};

  containerWithNoLabel = computed(() => {
    const c = this.container();
    if (c.contentType === 'formField' && this.isFormField(c.content)) {
      const field = c.content as FormField;
      return new FormContainerDto({
        ...c,
        content: {
          ...field,
          label: ''
        }
      });
    }
    return c;
  });

  getContainerStyles(container: FormContainerDto): any {
    const styles: any = {
      ...container.style,
      position: 'absolute',
      left: `${container.position.x}px`,
      top: `${container.position.y}px`,
      width: `${container.size.width}px`,
      height: `${container.size.height}px`,
    };

    if (this.isFormField(container.content) && container.content.style) {
      Object.assign(styles, this.getContainerStyles(container));
    }

    return styles;
  }

  getContentStyles(container: FormContainerDto): any {
    if (!container.contentStyle) {
      return {};
    }
    const styles = { ...container.contentStyle };
    if (styles.fontSize && typeof styles.fontSize === 'number') {
      styles.fontSize = `${styles.fontSize}px`;
    }
    return styles;
  }

  isFormField(content: any): content is FormField {
    return content && typeof content === 'object' && 'name' in content && 'type' in content;
  }

  asFormField(content: any): FormField {
    return content as FormField;
  }

  asForm(content: any): PrintableFormDto {
    if (this.isFormField(content) && content.nestedForm) {
      return content.nestedForm;
    }
    return content as PrintableFormDto;
  }

  getFormControl(path: string): FormControl {
    const control = this.form.get(path);
    if (!control) {
      console.warn(`Control ${path} not found in form. Creating a new FormControl.`);
      return new FormControl();
    }
    return control as FormControl;
  }

  getFormArray(name: string): FormArray {
    return this.form.get(name) as FormArray;
  }

  getNestedValue(obj: any, path: string): any {
    if (!obj || !path) {
      return null;
    }
    return path.split('.').reduce((prev, curr) => (prev ? prev[curr] : null), obj);
  }
}
