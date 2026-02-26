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
    <app-rf-reactive-form
      [fields]="fields()"
      [entity]="entity()"
      [title]="'Confined Space'"
      [submitButtonText]="entity().id ? 'Update' : 'Create'"
      [deleteButtonText]="entity().id ? 'Delete' : ''"
      (formSubmit)="onSubmit($event)"
      (formDelete)="onDelete()"
    ></app-rf-reactive-form>
  `,
  styles: [`:host { display: block; height: 100%; overflow: auto; }`],
})
export class RfConfinedSpaceFormComponent {
  private currentService = inject(CurrentConfinedSpaceService);

  entity = computed(() => this.currentService.selectedItem());
  fields = computed(() => ConfinedSpaceDto.toFormFields(this.entity()) as RfFormField[]);

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
