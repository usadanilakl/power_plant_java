import { Component, computed, DestroyRef, inject, input } from '@angular/core';
import { WorkRequestStateService } from '../work-request-state.service';
import { SubmissionOrchestratorService } from '../../../services/submission-orchestrator.service';
import { WorkRequest } from '../../../models/permits/work-request.model';
import { FormField } from '../../../models/inputs/form-field.model';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormComponent } from "../../../shared/forms/reactive-form/reactive-form.component";
import { UserSetupService } from '../../../services/user-setup.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-work-request-form',
  standalone: true,
  imports: [ReactiveFormComponent],
  templateUrl: './work-request-form.component.html',
  styleUrl: './work-request-form.component.css'
})
export class WorkRequestFormComponent {

  workRequestStateService = inject(WorkRequestStateService);
  orchestrator = inject(SubmissionOrchestratorService);
  userSetupService = inject(UserSetupService);
  destroyRef = inject(DestroyRef);

  entityInput = input<WorkRequest>();
  fieldsInput = input<FormField[]>();

  private entityFromState = toSignal(this.workRequestStateService.selectedWorkRequest$, { initialValue: new WorkRequest() });
  entity = computed(() => {
    const wr = this.entityInput() ?? this.entityFromState();
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

  hasAttachments = computed(() => (this.entity()?.attachments?.length ?? 0) > 0);
  attachmentCount = computed(() => this.entity()?.attachments?.length ?? 0);
  submitLink = computed(() => {
    const wr = this.entity();
    return wr ? this.orchestrator.generateSubmitLink(new WorkRequest(wr)) : '';
  });

  onAnyValueChange(workRequest: WorkRequest) {
    this.workRequestStateService.saveDraft(workRequest);
  }

  onSubmit(workRequest: WorkRequest) {
    this.workRequestStateService.submitNewRequest(workRequest);
  }

  onEmailSent() {
    this.workRequestStateService.clearEmailFallback();
  }

  onEmailButtonClick() {
    this.workRequestStateService.markSentViaEmail();
  }

  openGmail() {
    const data = this.emailFallbackData();
    if (!data) return;
    const to = encodeURIComponent(this.emailRecipient);
    const subject = encodeURIComponent('Work Request Submission');
    const body = encodeURIComponent(data.body);
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${subject}&body=${body}`, '_blank');
    this.workRequestStateService.markSentViaEmail();
  }

  downloadAttachments() {
    const attachments = this.entity()?.attachments ?? [];
    for (const att of attachments) {
      const dataUri = `data:${att.contentType};base64,${att.base64Content}`;
      const link = document.createElement('a');
      link.href = dataUri;
      link.download = att.fileName;
      link.click();
    }
  }
}
