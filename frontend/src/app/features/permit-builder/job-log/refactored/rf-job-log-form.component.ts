import { Component, computed, inject } from '@angular/core';
import { CurrentJobLogService } from '../../../../services/current-items-services/current-job-log.service';
import { JobLogDto } from '../../../../models/permits/job-log.model';
import { RfFormField } from '../../../../models/ui/form-field.model';
import { RfReactiveFormComponent } from '../../../../shared/reactive-form/refactored/reactive-form/rf-reactive-form.component';

@Component({
  selector: 'app-rf-job-log-form',
  standalone: true,
  imports: [RfReactiveFormComponent],
  template: `
    <app-rf-reactive-form
      [fields]="fields()"
      [entity]="entity()"
      [title]="'Job Log'"
      [submitButtonText]="entity().id ? 'Update' : 'Create'"
      [deleteButtonText]="entity().id ? 'Delete' : ''"
      (formSubmit)="onSubmit($event)"
      (formDelete)="onDelete()"
    ></app-rf-reactive-form>
  `,
  styles: [`:host { display: block; height: 100%; overflow: auto; }`],
})
export class RfJobLogFormComponent {
  private currentService = inject(CurrentJobLogService);

  entity = computed(() => this.currentService.selectedItem());
  fields = computed(() => JobLogDto.toFormFields(this.entity()) as RfFormField[]);

  onSubmit(formData: any): void {
    this.currentService.saveJobLog(formData);
  }

  onDelete(): void {
    const entity = this.entity();
    if (entity?.id) {
      this.currentService.removeJobLogFromList(entity.id);
    }
  }
}
