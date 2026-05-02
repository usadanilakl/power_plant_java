import { Component, computed, inject } from '@angular/core';
import { CurrentConfinedSpaceService } from '../../../../services/current-items-services/current-confined-space.service';
import { ConfinedSpaceDto } from '../../../../models/permits/confined-space.model';
import { RfFormField } from '../../../../models/ui/form-field.model';
import { RfReactiveFormComponent } from '../../../../shared/reactive-form/refactored/reactive-form/rf-reactive-form.component';

@Component({
  selector: 'app-rf-confined-space-form',
  standalone: true,
  imports: [RfReactiveFormComponent],
  template: `
    <div [class.cs-reclassified]="entity().csType === 'RECLASSIFIED'"
         [class.cs-permit-required]="entity().csType !== 'RECLASSIFIED'"
         style="height: 100%;">
      <app-rf-reactive-form
        [fields]="fields()"
        [entity]="entity()"
        [title]="title()"
        [submitButtonText]="entity().id ? 'Update' : 'Create'"
        [deleteButtonText]="entity().id ? 'Delete' : ''"
        (formSubmit)="onSubmit($event)"
        (formDelete)="onDelete()"
      ></app-rf-reactive-form>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; overflow: auto; }
    .cs-permit-required { border-left: 6px solid #c62828; }
    .cs-reclassified { border-left: 6px solid #f9a825; }
  `],
})
export class RfConfinedSpaceFormComponent {
  private currentService = inject(CurrentConfinedSpaceService);

  entity = computed(() => this.currentService.selectedItem());
  fields = computed(() => ConfinedSpaceDto.toFormFields(this.entity()) as RfFormField[]);
  title = computed(() => this.entity().csType === 'RECLASSIFIED'
    ? 'Reclassified Confined Space'
    : 'Permit Required Confined Space');

  onSubmit(formData: any): void {
    this.currentService.save(formData);
  }

  onDelete(): void {
    const entity = this.entity();
    if (entity?.id) {
      this.currentService.removeConfinedSpaceFromList(entity.id);
    }
  }
}
