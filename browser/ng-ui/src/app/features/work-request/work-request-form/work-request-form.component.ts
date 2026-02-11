import { Component, computed, DestroyRef, inject, input, Input, signal, Signal } from '@angular/core';
import { WorkRequestStateService } from '../work-request-state.service';
import { WorkRequest } from '../../../models/permits/work-request.model';
import { FormField } from '../../../models/inputs/form-field.model';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormComponent } from "../../../shared/forms/reactive-form/reactive-form.component";
import { EmailPromptComponent } from "../../../shared/communication/email-prompt/email-prompt.component";
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
  destroyRef = inject(DestroyRef);

  entityInput = input<WorkRequest>();
  fieldsInput = input<FormField[]>();

  private entityFromState = toSignal(this.workRequestStateService.selectedWorkRequest$, { initialValue: new WorkRequest() });
  entity = computed(() => this.entityInput() ?? this.entityFromState());

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
