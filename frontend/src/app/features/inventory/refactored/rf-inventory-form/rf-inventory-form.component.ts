import { Component, inject, computed, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RfReactiveFormComponent } from '../../../../shared/reactive-form/refactored/reactive-form/rf-reactive-form.component';
import { RfInventoryStateService } from '../services/rf-inventory-state.service';
import { InventoryItemDto } from '../../../../models/inventory/inventory-item.model';
import { SharedDataService } from '../../../../services/shared-data.service';

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
export class RfInventoryFormComponent implements OnInit {
  protected stateService = inject(RfInventoryStateService);
  private sharedData = inject(SharedDataService);

  entity = computed(() => this.stateService.selectedItem() ?? new InventoryItemDto());

  private inventoryTypes = toSignal(this.sharedData.inventoryTypes$, { initialValue: [] });

  ngOnInit(): void {
    this.sharedData.loadInventoryTypes().subscribe();
  }

  fields = computed(() => {
    const entity = this.entity();
    const typeOptions = this.inventoryTypes().map(v => ({ value: v.name, label: v.name }));
    return InventoryItemDto.toFormFields(entity, undefined, { typeOptions });
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
