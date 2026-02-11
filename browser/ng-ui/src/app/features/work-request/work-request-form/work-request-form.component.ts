import { Component, computed, DestroyRef, inject, input, Input, signal, Signal } from '@angular/core';
import { WorkRequestStateService } from '../work-request-state.service';
import { WorkRequest } from '../../../models/permits/work-request.model';
import { FormField } from '../../../models/inputs/form-field.model';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormComponent } from "../../../shared/forms/reactive-form/reactive-form.component";
import { EmailPromptComponent } from "../../../shared/communication/email-prompt/email-prompt.component";
import { UserSetupService } from '../../../services/user-setup.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-work-request-form',
  standalone: true,
  imports: [ReactiveFormComponent, EmailPromptComponent],
  templateUrl: './work-request-form.component.html',
  styleUrl: './work-request-form.component.css'
})
export class WorkRequestFormComponent {

  workRequestStateService = inject(WorkRequestStateService);
  userSetupService = inject(UserSetupService);
  destroyRef = inject(DestroyRef);

  entityInput = input<WorkRequest>();
  fieldsInput = input<FormField[]>();

  private entityFromState = toSignal(this.workRequestStateService.selectedWorkRequest$, { initialValue: new WorkRequest() });
  entity = computed(() => {
    const wr = this.entityInput() ?? this.entityFromState();
    // Auto-populate workRequestedBy and company from user setup if empty
    if (wr) {
      const userData = this.userSetupService.getUserData();
      if (userData) {
        if (!wr.workRequestedBy) wr.workRequestedBy = userData.name;
        if (!wr.company) wr.company = userData.company;
      }
    }
    return wr;
  });

  private defaultFields = computed(() => this.entity()?.toFormFields() ?? []);
  fields = computed(() => this.fieldsInput() ?? this.defaultFields());

  emailFallbackData = this.workRequestStateService.emailFallbackData;
  emailRecipient = environment.emailRecipient;

  constructor() { }

  onAnyValueChange(workRequest: WorkRequest) {
    this.workRequestStateService.saveDraft(workRequest);
  }

  onSubmit(workRequest: WorkRequest) {
    this.workRequestStateService.submitNewRequest(workRequest);
  }

  onEmailSent() {
    this.workRequestStateService.clearEmailFallback();
  }
}
