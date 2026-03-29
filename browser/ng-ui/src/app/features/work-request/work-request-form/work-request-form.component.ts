import { Component, computed, DestroyRef, inject, input, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { WorkRequestStateService } from '../work-request-state.service';
import { SubmissionOrchestratorService } from '../../../services/submission-orchestrator.service';
import { WorkRequest } from '../../../models/permits/work-request.model';
import { FormField } from '../../../models/inputs/form-field.model';
import { Option } from '../../../models/inputs/option.model';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormComponent } from "../../../shared/forms/reactive-form/reactive-form.component";
import { UserSetupService } from '../../../services/user-setup.service';
import { environment } from '../../../../environments/environment';
import { ServerApiService } from '../../../services/server-api.service';

@Component({
  selector: 'app-work-request-form',
  standalone: true,
  imports: [ReactiveFormComponent],
  templateUrl: './work-request-form.component.html',
  styleUrl: './work-request-form.component.css'
})
export class WorkRequestFormComponent implements OnInit {

  workRequestStateService = inject(WorkRequestStateService);
  orchestrator = inject(SubmissionOrchestratorService);
  userSetupService = inject(UserSetupService);
  serverApi = inject(ServerApiService);
  http = inject(HttpClient);
  destroyRef = inject(DestroyRef);

  entityInput = input<WorkRequest>();
  fieldsInput = input<FormField[]>();

  private workCategoryOptions = signal<Option[]>([]);

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

  private defaultFields = computed(() => {
    const base = this.entity()?.toFormFields() ?? [];
    const wcOptions = this.workCategoryOptions();
    return base.map(f => {
      if (f.name === 'workCategoryName' && wcOptions.length) {
        return { ...f, options: wcOptions };
      }
      return f;
    });
  });
  fields = computed(() => this.fieldsInput() ?? this.defaultFields());

  ngOnInit() {
    this.loadDropdownOptions();
  }

  private loadDropdownOptions() {
    const cachedCategories = localStorage.getItem('pwa_work_categories');
    if (cachedCategories) {
      this.workCategoryOptions.set(JSON.parse(cachedCategories));
    }

    this.serverApi.getWorkCategories().subscribe({
      next: categories => {
        const options = this.toWorkCategoryOptions(categories);
        this.workCategoryOptions.set(options);
        localStorage.setItem('pwa_work_categories', JSON.stringify(options));
      },
      error: () => {
        this.http.get<{ id: number; name: string }[]>('data/work-categories.json').subscribe({
          next: categories => {
            const options = this.toWorkCategoryOptions(categories);
            this.workCategoryOptions.set(options);
            localStorage.setItem('pwa_work_categories', JSON.stringify(options));
          },
          error: () => console.warn('[PWA] Failed to load work categories from server and static json, using cached values')
        });
      }
    });
  }

  private toWorkCategoryOptions(categories: { id: number; name: string }[]): Option[] {
    return categories.map(c => ({ value: c.name, label: c.name }));
  }

  emailFallbackData = this.workRequestStateService.emailFallbackData;
  emailRecipient = environment.emailRecipient;

  hasAttachments = computed(() => (this.entity()?.attachments?.length ?? 0) > 0);
  attachmentCount = computed(() => this.entity()?.attachments?.length ?? 0);
  submitLink = computed(() => {
    const wr = this.entity();
    return wr ? this.orchestrator.generateSubmitLink(new WorkRequest(wr)) : '';
  });

  onAnyValueChange(workRequest: WorkRequest) {
    this.applyMapValue(workRequest);
    this.workRequestStateService.saveDraft(workRequest);
  }

  isEditing = this.workRequestStateService.isEditing;

  onSubmit(workRequest: WorkRequest) {
    this.applyMapValue(workRequest);
    if (this.isEditing()) {
      this.workRequestStateService.updateExistingRequest(workRequest);
    } else {
      this.workRequestStateService.submitNewRequest(workRequest);
    }
  }

  /** Extract map {id, name} → workAreaId/workAreaName, compose locationOfWork */
  private applyMapValue(workRequest: WorkRequest): void {
    const mapValue = (workRequest as any).workAreaMap;
    if (mapValue && typeof mapValue === 'object' && mapValue.id !== undefined) {
      workRequest.workAreaId = mapValue.id;
      workRequest.workAreaName = mapValue.name;
      // Auto-set confined space if work area is classified as confined space
      if (mapValue.isConfinedSpace) {
        workRequest.isConfinedSpaceEntryRequired = 'Yes';
        workRequest.spaceToBeEntered = mapValue.name;
      }
    }
    // Compose locationOfWork: map area name + optional user detail
    const locationDetail = ((workRequest as any).locationDetail ?? '').trim();
    if (workRequest.workAreaName) {
      workRequest.locationOfWork = locationDetail
        ? `${workRequest.workAreaName} - ${locationDetail}`
        : workRequest.workAreaName;
    } else if (locationDetail) {
      workRequest.locationOfWork = locationDetail;
    }
    // Clean up virtual fields before saving
    delete (workRequest as any).workAreaMap;
    delete (workRequest as any).locationDetail;
  }

  onEmailSent() {
    this.workRequestStateService.clearEmailFallback();
  }

  onEmailButtonClick() {
    if (this.hasAttachments()) this.downloadAttachments();
    this.workRequestStateService.markSentViaEmail();
  }

  openGmail() {
    const data = this.emailFallbackData();
    if (!data) return;
    const to = encodeURIComponent(this.emailRecipient);
    const cc = encodeURIComponent((environment.emailCcRecipients || '').replace(/;/g, ','));
    const subject = encodeURIComponent('Work Request Submission');
    const body = encodeURIComponent(data.body);
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${to}&cc=${cc}&su=${subject}&body=${body}`, '_blank');
    if (this.hasAttachments()) this.downloadAttachments();
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
