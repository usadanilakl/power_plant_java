import { Component, computed, DestroyRef, inject, input, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { WorkRequestStateService } from '../work-request-state.service';
import { SubmissionOrchestratorService } from '../../../services/submission-orchestrator.service';
import { WorkRequest } from '../../../models/permits/work-request.model';
import { foldHotWorkProfile, foldWorkRequestVirtualFields } from '../work-request-virtual-fields';
import { HotWorkProfile } from '../../../models/permits/permit-hazards.model';
import { FormField } from '../../../models/inputs/form-field.model';
import { Option } from '../../../models/inputs/option.model';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormComponent } from "../../../shared/forms/reactive-form/reactive-form.component";
import { UserSetupService } from '../../../services/user-setup.service';
import { environment } from '../../../../environments/environment';
import { ServerApiService } from '../../../services/server-api.service';
import { SupabaseDataService } from '../../../services/supabase-data.service';

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
  supabaseData = inject(SupabaseDataService);
  http = inject(HttpClient);
  destroyRef = inject(DestroyRef);

  entityInput = input<WorkRequest>();
  fieldsInput = input<FormField[]>();
  /** Shown on the full form only — the wizard has its own back/skip navigation. */
  showClearButton = input<boolean>(false);

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

  // Offline cold-start fallback (no cache, hub down, no Supabase session). Names only — matches the
  // in-code defaults field-list/inventory carry. Static data/work-categories.json is now empty ([]),
  // the real list comes from the hub or the Supabase snapshot.
  private static readonly DEFAULT_CATEGORIES = [
    'Mechanical', 'Electrical', 'Insulation', 'Inspection', 'Rigging', 'Cleaning',
    'Energized', 'I&C', 'Welding / Hot Work', 'Civil', 'Operations', 'Scaffolding'
  ].map(name => ({ id: 0, name }));

  private loadDropdownOptions() {
    const cachedCategories = localStorage.getItem('pwa_work_categories');
    if (cachedCategories) {
      this.workCategoryOptions.set(JSON.parse(cachedCategories));
    } else if (this.workCategoryOptions().length === 0) {
      this.workCategoryOptions.set(this.toWorkCategoryOptions(WorkRequestFormComponent.DEFAULT_CATEGORIES));
    }

    const apply = (categories: { id: number; name: string }[]) => {
      const options = this.toWorkCategoryOptions(categories);
      this.workCategoryOptions.set(options);
      localStorage.setItem('pwa_work_categories', JSON.stringify(options));
    };

    this.serverApi.getWorkCategories().subscribe({
      next: apply,
      error: () => {
        const fromStatic = () => this.http.get<{ id: number; name: string }[]>('data/work-categories.json').subscribe({
          next: apply,
          error: () => console.warn('[PWA] Failed to load work categories from server, Supabase, and static json, using cached values')
        });
        this.supabaseData.snapshotOrElse('work_categories', apply, fromStatic);
      }
    });
  }

  private toWorkCategoryOptions(categories: { id: number; name: string }[]): Option[] {
    return categories.map(c => ({ value: c.name, label: c.name }));
  }

  /**
   * Empty the form but keep who you are.
   *
   * <p>The common case for resubmitting is "same person, same company, completely different job".
   * Clearing the identity fields too would mean re-typing them every time, and they are the fields
   * least likely to be wrong. Attachments go — they belonged to the previous request, and carrying
   * a stale photo onto a new one is worse than losing it.
   */
  clearForm(): void {
    if (!confirm('Clear this form? Your name and company will be kept.')) return;
    const previous = this.entity();
    const fresh = new WorkRequest();
    fresh.workRequestedBy = previous?.workRequestedBy ?? '';
    fresh.company = previous?.company ?? '';

    const userData = this.userSetupService.getUserData();
    if (userData) {
      if (!fresh.workRequestedBy) fresh.workRequestedBy = userData.name;
      if (!fresh.company) fresh.company = userData.company;
    }
    this.workRequestStateService.selectWorkRequest(fresh);
    this.workRequestStateService.saveDraft(fresh);
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
    this.applyHotWorkProfile(workRequest);
    this.workRequestStateService.saveDraft(workRequest);
  }

  isEditing = this.workRequestStateService.isEditing;

  onSubmit(workRequest: WorkRequest) {
    this.applyMapValue(workRequest);
    this.applyHotWorkProfile(workRequest);
    if (this.isEditing()) {
      this.workRequestStateService.updateExistingRequest(workRequest);
    } else {
      this.workRequestStateService.submitNewRequest(workRequest);
    }
  }

  /**
   * Fold the four flat hot-work controls into the nested `hotWorkProfile` the model stores.
   *
   * Mirrors what applyMapValue does for the work-area controls, and for the same reason: the form
   * is flat, the model is not. Runs on every value change and on submit, so it has to be
   * idempotent and it has to handle answers being *withdrawn*, not just given.
   *
   * The withdrawals are the whole point:
   *  - hot work switched back to "No" drops the entire profile, so a request cannot carry a stale
   *    welding assessment into the permits an operator generates from it;
   *  - un-ticking Welding clears the Cr(VI) answers, which would otherwise still be scored;
   *  - un-ticking Other clears its free text.
   */
  private applyHotWorkProfile(workRequest: WorkRequest): void {
    foldHotWorkProfile(workRequest, { strip: true });
  }

  /**
   * The area whose confined-space classification we last applied, or null if the current
   * confined-space answer is the requester's own. Lets us undo an automatic "Yes" when they move to
   * an area that is not a confined space, without ever overriding an answer they set themselves.
   */
  private autoConfinedSpaceAreaId: number | null = null;

  /**
   * Mirror a work area's confined-space classification onto the request.
   *
   * Selecting a confined space forces the flag on - that is a safety default and it stays. The
   * subtle half is the reverse: a requester who picked a confined space by mistake and then
   * corrected it used to keep the forced "Yes" forever, submitting a request that demanded a
   * confined space permit for open ground. So an automatic "Yes" is withdrawn when the area
   * changes, while a "Yes" the requester chose themselves is left strictly alone.
   */
  private applyAreaConfinedSpace(workRequest: WorkRequest, mapValue: any): void {
    const areaId = mapValue.id as number;
    if (areaId === this.autoConfinedSpaceAreaId) return;

    if (mapValue.isConfinedSpace) {
      workRequest.isConfinedSpaceEntryRequired = 'Yes';
      workRequest.spaceToBeEntered = mapValue.name;
      this.autoConfinedSpaceAreaId = areaId;
    } else if (this.autoConfinedSpaceAreaId !== null) {
      workRequest.isConfinedSpaceEntryRequired = 'No';
      workRequest.spaceToBeEntered = '';
      this.autoConfinedSpaceAreaId = null;
    }
  }

  /**
   * Fold the helper controls, then apply the area's confined-space status.
   *
   * <p>The folding itself lives in {@link foldWorkRequestVirtualFields}, shared with the wizard.
   * `strip: true` because this path both edits and submits — the helper controls must not reach
   * the server.
   */
  private applyMapValue(workRequest: WorkRequest): void {
    const picked = foldWorkRequestVirtualFields(workRequest, { strip: true });
    if (picked) this.applyAreaConfinedSpace(workRequest, picked);
    else if ((workRequest as any).workAreaUnknown === true) this.autoConfinedSpaceAreaId = null;
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
