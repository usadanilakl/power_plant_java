import { Component, computed, inject } from '@angular/core';
import { CurrentSafeWorkService } from '../../../../services/current-items-services/current-safe-work.service';
import { SafeWorkDto } from '../../../../models/permits/safe-work.model';
import { RfFormField } from '../../../../models/ui/form-field.model';
import { RfReactiveFormComponent } from '../../../../shared/reactive-form/refactored/reactive-form/rf-reactive-form.component';

@Component({
  selector: 'app-rf-safe-work-form',
  standalone: true,
  imports: [RfReactiveFormComponent],
  template: `
    <app-rf-reactive-form
      [fields]="fields()"
      [entity]="entity()"
      [title]="'Safe Work'"
      [submitButtonText]="entity().id ? 'Update' : 'Create'"
      [deleteButtonText]="entity().id ? 'Delete' : ''"
      (formSubmit)="onSubmit($event)"
      (formDelete)="onDelete()"
    ></app-rf-reactive-form>
  `,
  styles: [`:host { display: block; height: 100%; overflow: auto; }`],
})
export class RfSafeWorkFormComponent {
  private currentService = inject(CurrentSafeWorkService);

  entity = computed(() => this.currentService.selectedItem());
  fields = computed(() => SafeWorkDto.toFormFields(this.entity()) as RfFormField[]);

  onSubmit(formData: any): void {
    this.currentService.saveSafeWork(formData);
  }

  onDelete(): void {
    const entity = this.entity();
    if (entity?.id) {
      this.currentService.removeSafeWorkFromList(entity.id);
    }
  }
}
