import { Component, inject, computed } from '@angular/core';
import { RfReactiveFormComponent } from '../../../../shared/reactive-form/refactored/reactive-form/rf-reactive-form.component';
import { RfFieldListStateService } from '../services/rf-field-list-state.service';
import { FieldListItemDto } from '../../../../models/field-list/field-list-item.model';

@Component({
  selector: 'app-rf-field-list-form',
  standalone: true,
  imports: [RfReactiveFormComponent],
  template: `
    <app-rf-reactive-form
      [fields]="fields()"
      [entity]="entity()"
      (formSubmit)="onSubmit($event)"
      (formDelete)="onDelete()">
    </app-rf-reactive-form>
  `,
  styles: [`:host { display: block; padding: 16px; }`]
})
export class RfFieldListFormComponent {
  protected stateService = inject(RfFieldListStateService);

  entity = computed(() => this.stateService.selectedItem() ?? new FieldListItemDto());

  fields = computed(() => {
    const entity = this.entity();
    return FieldListItemDto.toFormFields(entity);
  });

  onSubmit(formValues: any): void {
    const entity = this.entity();
    const updated = new FieldListItemDto({
      ...entity,
      ...formValues,
    });
    if (entity.id) updated.id = entity.id;
    this.stateService.submitForm(updated);
  }

  onDelete(): void {
    const entity = this.entity();
    if (entity?.id) {
      this.stateService.deleteItem(entity.id);
    }
  }
}
