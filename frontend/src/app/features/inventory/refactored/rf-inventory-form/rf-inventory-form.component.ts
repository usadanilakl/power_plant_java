import { Component, inject, computed } from '@angular/core';
import { RfReactiveFormComponent } from '../../../../shared/reactive-form/refactored/reactive-form/rf-reactive-form.component';
import { RfInventoryStateService } from '../services/rf-inventory-state.service';
import { InventoryItemDto } from '../../../../models/inventory/inventory-item.model';

@Component({
  selector: 'app-rf-inventory-form',
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
export class RfInventoryFormComponent {
  protected stateService = inject(RfInventoryStateService);

  entity = computed(() => this.stateService.selectedItem() ?? new InventoryItemDto());

  fields = computed(() => {
    const entity = this.entity();
    return InventoryItemDto.toFormFields(entity);
  });

  onSubmit(formValues: any): void {
    const entity = this.entity();
    const updated = new InventoryItemDto({
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
