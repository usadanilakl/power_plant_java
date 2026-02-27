import { Component, computed, inject } from '@angular/core';
import { CurrentVentingPermitService } from '../../../../services/current-items-services/current-venting-permit.service';
import { VentingPermitDto } from '../../../../models/permits/venting-permit.model';
import { RfFormField } from '../../../../models/ui/form-field.model';
import { RfReactiveFormComponent } from '../../../../shared/reactive-form/refactored/reactive-form/rf-reactive-form.component';

@Component({
  selector: 'app-rf-venting-permit-form',
  standalone: true,
  imports: [RfReactiveFormComponent],
  template: `
    <app-rf-reactive-form
      [fields]="fields()"
      [entity]="entity()"
      [title]="'Venting/Purging Permit'"
      [submitButtonText]="entity().id ? 'Update' : 'Create'"
      [deleteButtonText]="entity().id ? 'Delete' : ''"
      (formSubmit)="onSubmit($event)"
      (formDelete)="onDelete()"
    ></app-rf-reactive-form>
  `,
  styles: [`:host { display: block; height: 100%; overflow: auto; }`],
})
export class RfVentingPermitFormComponent {
  private currentService = inject(CurrentVentingPermitService);

  entity = computed(() => this.currentService.selectedItem());
  fields = computed(() => VentingPermitDto.toFormFields(this.entity()) as RfFormField[]);

  onSubmit(formData: any): void {
    this.currentService.savePermit(formData);
  }

  onDelete(): void {
    const entity = this.entity();
    if (entity?.id) {
      this.currentService.removePermitFromList(entity.id);
    }
  }
}
