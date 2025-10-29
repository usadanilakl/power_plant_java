import { Component, computed, DestroyRef, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormComponent } from "../../../shared/forms/reactive-form/reactive-form.component";
import { UserStateService } from '../user-state.service';
import { User } from '../../../models/auth/user.model';
import { FormField } from '../../../models/inputs/form-field.model';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [ReactiveFormComponent],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.css'
})
export class UserFormComponent {

  userStateService = inject(UserStateService);
  destroyRef = inject(DestroyRef);

  entityInput = input<User>();
  fieldsInput = input<FormField[]>();

  private entityFromState = toSignal(this.userStateService.selectedUser$, { initialValue: new User() });
  entity = computed(() => this.entityInput() ?? this.entityFromState());

  private defaultFields = computed(() => this.entity()?.toFormFields() ?? []);
  fields = computed(() => this.fieldsInput() ?? this.defaultFields());

  constructor() { }

  onAnyValueChange(user: User) {
    this.userStateService.saveDraft(user);
  }

  onSubmit(user: User) {
    if (user.sharepointId) {
      this.userStateService.updateUser(user);
    } else {
      this.userStateService.createNewUser(user);
    }
  }
}
