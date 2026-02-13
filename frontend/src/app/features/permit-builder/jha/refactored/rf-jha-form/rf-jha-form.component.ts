import {
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { RfJhaStateService } from '../services/rf-jha-state.service';
import { RfJhaMapperService } from '../services/rf-jha-mapper.service';
import { RfJhaApiService } from '../services/rf-jha-api.service';
import { JhaDto, JhaFieldName } from '../../../../../models/permits/jha.model';
import { RfReactiveFormComponent } from '../../../../../shared/reactive-form/refactored/reactive-form/rf-reactive-form.component';
import { ConfirmationService } from '../../../../../services/ui/confirmation.service';

@Component({
  selector: 'app-rf-jha-form',
  standalone: true,
  imports: [RfReactiveFormComponent],
  templateUrl: './rf-jha-form.component.html',
  styleUrl: './rf-jha-form.component.css',
})
export class RfJhaFormComponent {
  protected stateService = inject(RfJhaStateService);
  protected mapperService = inject(RfJhaMapperService);
  protected apiService = inject(RfJhaApiService);
  protected confirmationService = inject(ConfirmationService);

  entityInput = input<JhaDto>();
  fieldsInput = input<JhaFieldName[]>([]);

  private entityFromState = this.stateService.selectedItem;

  entity = computed(
    () => this.entityInput() ?? this.entityFromState() ?? new JhaDto()
  );

  fields = computed(() => {
    const customFields = this.fieldsInput();
    const entity = this.entity();

    if (customFields.length > 0) {
      return this.mapperService.toFormFields(entity, customFields);
    }
    return this.mapperService.toFormFields(entity);
  });

  onSubmit(item: JhaDto): void {
    this.stateService.submitForm(item);
  }

  canDelete(): boolean {
    return !!this.entity()?.id;
  }

  onDelete(): void {
    const currentEntity = this.entity();
    if (!currentEntity?.id) return;

    const label = currentEntity.jobName
      ? `JHA "${currentEntity.jobName}"`
      : `JHA #${currentEntity.id}`;

    this.confirmationService.confirm(
      `Are you sure you want to delete ${label}?`
    ).then(confirmed => {
      if (!confirmed) return;

      this.apiService.deleteJha(currentEntity.id!).subscribe({
        next: () => {
          this.stateService.setSelectedItem(null);
          this.stateService.closeForm();
        },
        error: (error) => {
          console.error('Error deleting JHA:', error);
          alert('Failed to delete JHA: ' + (error.error?.message || error.message || 'Unknown error'));
        }
      });
    });
  }
}
