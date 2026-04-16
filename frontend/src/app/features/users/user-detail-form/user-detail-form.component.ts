import { Component, inject, computed } from '@angular/core';
import { RfReactiveFormComponent } from '../../../shared/reactive-form/refactored/reactive-form/rf-reactive-form.component';
import { RfUserStateService } from '../services/rf-user-state.service';
import { UserDto } from '../../../models/user.model';

@Component({
  selector: 'app-user-detail-form',
  standalone: true,
  imports: [RfReactiveFormComponent],
  template: `
    <app-rf-reactive-form
      [fields]="fields()"
      [entity]="entity()"
      [submitButtonText]="entity().id ? 'Update' : 'Create'"
      [deleteButtonText]="entity().id ? 'Delete' : ''"
      (formSubmit)="onSubmit($event)"
      (formDelete)="onDelete()">
    </app-rf-reactive-form>
  `,
  styles: [`:host { display: block; padding: 16px; }`]
})
export class UserDetailFormComponent {
  protected stateService = inject(RfUserStateService);

  entity = computed(() => this.stateService.selectedItem() ?? new UserDto());

  isNew = computed(() => {
    const entity = this.entity();
    return !entity.id || entity.id === 0;
  });

  fields = computed(() => {
    const entity = this.entity();
    return UserDto.toFormFields(entity, { isNew: this.isNew() });
  });

  onSubmit(formValues: any): void {
    const entity = this.entity();
    const payload: any = {
      ...formValues,
    };

    // Build name from first + last
    if (formValues.firstName || formValues.lastName) {
      payload.name = `${formValues.firstName || ''} ${formValues.lastName || ''}`.trim();
    }

    // Strip blank password on update (backend ignores null/blank)
    if (!this.isNew() && (!payload.password || !payload.password.trim())) {
      delete payload.password;
    }

    if (entity.id) {
      payload.id = entity.id;
    }

    this.stateService.submitForm(payload);
  }

  onDelete(): void {
    const entity = this.entity();
    if (entity?.id) {
      this.stateService.deleteUser(entity.id);
    }
  }
}
