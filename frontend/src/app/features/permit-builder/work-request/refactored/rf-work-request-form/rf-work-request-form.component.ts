import {
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { RfWorkRequestStateService } from '../services/rf-work-request-state.service';
import { RfWorkRequestMapperService } from '../services/rf-work-request-mapper.service';
import { RfWorkRequestApiService } from '../services/rf-work-request-api.service';
import { WorkRequestDto, WorkRequestFieldName } from '../../../../../models/permits/work-request.model';
import { RfReactiveFormComponent } from '../../../../../shared/reactive-form/refactored/reactive-form/rf-reactive-form.component';
import { ConfirmationService } from '../../../../../services/ui/confirmation.service';

@Component({
  selector: 'app-rf-work-request-form',
  standalone: true,
  imports: [RfReactiveFormComponent],
  templateUrl: './rf-work-request-form.component.html',
  styleUrl: './rf-work-request-form.component.css',
})
export class RfWorkRequestFormComponent {
  protected stateService = inject(RfWorkRequestStateService);
  protected mapperService = inject(RfWorkRequestMapperService);
  protected apiService = inject(RfWorkRequestApiService);
  protected confirmationService = inject(ConfirmationService);

  entityInput = input<WorkRequestDto>();
  fieldsInput = input<WorkRequestFieldName[]>([]);

  private entityFromState = this.stateService.selectedItem;

  entity = computed(
    () => this.entityInput() ?? this.entityFromState() ?? new WorkRequestDto()
  );

  fields = computed(() => {
    const customFields = this.fieldsInput();
    const entity = this.entity();

    if (customFields.length > 0) {
      return this.mapperService.toFormFields(entity, customFields);
    }
    return this.mapperService.toFormFields(entity);
  });

  onSubmit(item: WorkRequestDto): void {
    this.stateService.submitForm(item);
  }

  canDelete(): boolean {
    return !!this.entity()?.id;
  }

  onDelete(): void {
    const currentEntity = this.entity();
    if (!currentEntity?.id) return;

    const label = currentEntity.requestedBy
      ? `work request from "${currentEntity.requestedBy}"`
      : `Work Request #${currentEntity.id}`;

    this.confirmationService.confirm(
      `Are you sure you want to delete ${label}?`
    ).then(confirmed => {
      if (!confirmed) return;

      this.apiService.deleteWorkRequest(currentEntity.id!).subscribe({
        next: () => {
          this.stateService.setSelectedItem(null);
          this.stateService.closeForm();
        },
        error: (error) => {
          console.error('Error deleting work request:', error);
          alert('Failed to delete work request: ' + (error.error?.message || error.message || 'Unknown error'));
        }
      });
    });
  }
}
