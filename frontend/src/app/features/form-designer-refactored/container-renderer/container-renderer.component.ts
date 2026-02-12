import { Component, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormContainerDto } from '../models/form-container.model';
import { FormField } from '../../../models/ui/form-field.model';
import { CoordinateService } from '../services/coordinate.service';
import { ContainerContentPipe } from '../pipes/container-content.pipe';
import { InvisibleInputFieldComponent } from '../inputs/invisible-input-field/invisible-input-field.component';
import { InvisibleSearchableSelectComponent } from '../inputs/invisible-searchable-select/invisible-searchable-select.component';
import { InvisibleSearchableMultiSelectComponent } from '../inputs/invisible-searchable-multi-select/invisible-searchable-multi-select.component';
import { RadioCheckboxesComponent } from '../inputs/radio-checkboxes/radio-checkboxes.component';
import { CheckboxXComponent } from '../inputs/checkbox-x/checkbox-x.component';
import { NestedFormInputComponent } from '../inputs/nested-form-input/nested-form-input.component';

@Component({
  selector: 'app-container-renderer',
  standalone: true,
  imports: [
    CommonModule,
    ContainerContentPipe,
    InvisibleInputFieldComponent,
    InvisibleSearchableSelectComponent,
    InvisibleSearchableMultiSelectComponent,
    RadioCheckboxesComponent,
    CheckboxXComponent,
    NestedFormInputComponent,
  ],
  templateUrl: './container-renderer.component.html',
  styleUrl: './container-renderer.component.css',
})
export class ContainerRendererComponent {
  private coordinateService = inject(CoordinateService);

  container = input.required<FormContainerDto>();

  contentStyles = computed(() => this.coordinateService.getContentStyle(this.container()));

  getFormFieldType(): string | undefined {
    const c = this.container();
    if (c.contentType === 'formField' && c.content) {
      return (c.content as FormField).type;
    }
    return undefined;
  }
}
