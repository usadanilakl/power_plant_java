import { Component, computed, inject } from '@angular/core';
import { CurrentHotWorkService } from '../../../../services/current-items-services/current-hot-work.service';
import { HotWorkDto } from '../../../../models/permits/hot-work.model';
import { RfFormField } from '../../../../models/ui/form-field.model';
import { RfReactiveFormComponent } from '../../../../shared/reactive-form/refactored/reactive-form/rf-reactive-form.component';

@Component({
  selector: 'app-rf-hot-work-form',
  standalone: true,
  imports: [RfReactiveFormComponent],
  template: `
    <app-rf-reactive-form
      [fields]="fields()"
      [entity]="entity()"
      [title]="'Hot Work'"
      [submitButtonText]="entity().id ? 'Update' : 'Create'"
      [deleteButtonText]="entity().id ? 'Delete' : ''"
      (formSubmit)="onSubmit($event)"
      (formDelete)="onDelete()"
    ></app-rf-reactive-form>
  `,
  styles: [`:host { display: block; height: 100%; overflow: auto; }`],
})
export class RfHotWorkFormComponent {
  private currentService = inject(CurrentHotWorkService);

  entity = computed(() => this.currentService.selectedItem());
  fields = computed(() => HotWorkDto.toFormFields(this.entity()) as RfFormField[]);

  onSubmit(formData: any): void {
    this.currentService.saveHotWork(formData);
  }

  onDelete(): void {
    const entity = this.entity();
    if (entity?.id) {
      this.currentService.removeHotWorkFromList(entity.id);
    }
  }
}
