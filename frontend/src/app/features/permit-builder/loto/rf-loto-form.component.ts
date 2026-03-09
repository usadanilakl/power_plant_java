import { Component, computed, inject } from '@angular/core';
import { CurrentLotoService } from '../../../services/current-items-services/current-loto.service';
import { LotoDto } from '../../../models/loto/loto.model';
import { RfFormField } from '../../../models/ui/form-field.model';
import { RfReactiveFormComponent } from '../../../shared/reactive-form/refactored/reactive-form/rf-reactive-form.component';
import { LotoPointsPanelComponent } from './loto-points-panel/loto-points-panel.component';

@Component({
  selector: 'app-rf-loto-form',
  standalone: true,
  imports: [RfReactiveFormComponent, LotoPointsPanelComponent],
  template: `
    <div class="loto-form-container">
      <app-rf-reactive-form
        [fields]="fields()"
        [entity]="entity()"
        [title]="'LOTO'"
        [submitButtonText]="entity().id ? 'Update' : 'Create'"
        [deleteButtonText]="entity().id ? 'Delete' : ''"
        (formSubmit)="onSubmit($event)"
        (formDelete)="onDelete()"
      ></app-rf-reactive-form>
      <app-loto-points-panel></app-loto-points-panel>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; overflow: auto; }
    .loto-form-container { display: flex; flex-direction: column; gap: 16px; padding-bottom: 16px; }
  `],
})
export class RfLotoFormComponent {
  private currentService = inject(CurrentLotoService);

  entity = computed(() => this.currentService.selectedItem() ?? new LotoDto());
  fields = computed(() => LotoDto.toFormFields(this.entity()) as RfFormField[]);

  onSubmit(formData: any): void {
    this.currentService.processLotoChanges(formData);
  }

  onDelete(): void {
    const entity = this.entity();
    if (entity?.id) {
      this.currentService.deleteLoto(entity.id);
    }
  }
}
