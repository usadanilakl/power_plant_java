import { Component, computed, DestroyRef, inject, input, signal } from '@angular/core';
import { InstrumentLocalStorageService } from '../../instrument-local-storage.service';
import { InstrumentStateService } from '../../instrument-state.service';
import { SubmissionOrchestratorService } from '../../../../../services/submission-orchestrator.service';
import { FormField } from '../../../../../models/inputs/form-field.model';
import { Instrument } from '../../../../../models/equipment/instrument.model';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormComponent } from "../../../../../shared/forms/reactive-form/reactive-form.component";
import { InstrumentLogEntryLocalStorageService } from '../instrument-log-local-storage.service';
import { InstrumentLogEntry } from '../../../../../models/equipment/instrument-log.model';
import { UserSetupService } from '../../../../../services/user-setup.service';
import { environment } from '../../../../../../environments/environment';

@Component({
  selector: 'app-instrument-log-form',
  imports: [ReactiveFormComponent],
  templateUrl: './instrument-log-form.component.html',
  styleUrl: './instrument-log-form.component.css'
})
export class InstrumentLogFormComponent {

  instrumentStateService = inject(InstrumentStateService);
  instrumentLocalStorageService = inject(InstrumentLocalStorageService);
  instrumentLogEntryLocalStorageService = inject(InstrumentLogEntryLocalStorageService);
  private orchestrator = inject(SubmissionOrchestratorService);
  private userSetupService = inject(UserSetupService);
  destroyRef = inject(DestroyRef);

  entityInput = input<Instrument>();
  fieldsInput = input<FormField[]>();
  /** The screen already shows the form title in its header; suppress the duplicate when embedded. */
  showTitle = input<boolean>(true);

  private entityFromState = toSignal(this.instrumentStateService.selectedInstrument$, { initialValue: new Instrument() });
  entityInstrument = computed(() => this.entityInput() ?? this.entityFromState());

  /** Bumped after each submit so `entity` recomputes off the now-cleared draft (localStorage isn't reactive). */
  private resetToken = signal(0);

  entity = computed(() => {
    this.resetToken();
    const baseEntry = this.entityInstrument()?.toLogEntry() ?? new InstrumentLogEntry();
    const draft = this.instrumentLogEntryLocalStorageService.loadDraft(baseEntry.instrumentTagNumber);
    const entry = draft
      ? new InstrumentLogEntry({ ...baseEntry, ...draft })
      : baseEntry;
    const userData = this.userSetupService.getUserData();
    if (userData && !entry.name) {
      entry.name = userData.name;
    }
    return entry;
  });

  private defaultFields = computed(() => this.entity()?.toFormFields() ?? []);
  fields = computed(() => this.fieldsInput() ?? this.defaultFields());

  // Fallback-specific (only shown when even the outbox could not hold the entry)
  emailFallbackData = this.instrumentStateService.emailFallbackData;
  hasAttachments = computed(() => {
    const entry = this.emailFallbackData()?.entry;
    return (entry?.attachments?.length ?? 0) > 0;
  });
  attachmentCount = computed(() => this.emailFallbackData()?.entry?.attachments?.length ?? 0);

  private currentDraft: InstrumentLogEntry | null = null;

  constructor() {
    this.instrumentStateService.logSubmitted$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.currentDraft = null;
        this.resetToken.update(v => v + 1);
      });
  }

  onAnyValueChange(instrumentLog: InstrumentLogEntry) {
    this.currentDraft = instrumentLog;
    this.instrumentLogEntryLocalStorageService.saveDraft(instrumentLog);
  }

  onSubmit(instrumentLog: InstrumentLogEntry) {
    this.instrumentStateService.submitLogForm(instrumentLog);
  }

  // ---- Manual email escape hatch (collapsed; the outbox is the normal offline path) ----

  submitViaEmail() {
    const entry = this.currentDraft ?? this.entity();
    const emailContent = this.orchestrator.generateInstrumentLogEmail(entry);
    window.location.href = emailContent.mailto;
  }

  submitViaGmail() {
    const entry = this.currentDraft ?? this.entity();
    const emailContent = this.orchestrator.generateInstrumentLogEmail(entry);
    const to = encodeURIComponent(environment.emailRecipient);
    const cc = encodeURIComponent((environment.emailCcRecipients || '').replace(/;/g, ','));
    const subject = encodeURIComponent(emailContent.subject);
    const body = encodeURIComponent(emailContent.body);
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${to}&cc=${cc}&su=${subject}&body=${body}`, '_blank');
  }

  // ---- Fallback-specific handlers (only when the device could not even queue the log) ----

  onFallbackEmailClick() {
    if (this.hasAttachments()) this.downloadAttachments();
    this.instrumentStateService.markSentViaEmail();
  }

  openFallbackGmail() {
    const data = this.emailFallbackData();
    if (!data) return;
    const to = encodeURIComponent(environment.emailRecipient);
    const cc = encodeURIComponent((environment.emailCcRecipients || '').replace(/;/g, ','));
    const subject = encodeURIComponent(`[PWA:INST] Instrument Log: ${data.entry?.instrumentTagNumber || 'Unknown'}`);
    const body = encodeURIComponent(data.body);
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${to}&cc=${cc}&su=${subject}&body=${body}`, '_blank');
    if (this.hasAttachments()) this.downloadAttachments();
    this.instrumentStateService.markSentViaEmail();
  }

  downloadAttachments() {
    const attachments = this.emailFallbackData()?.entry?.attachments ?? [];
    for (const att of attachments) {
      const dataUri = `data:${att.contentType};base64,${att.base64Content}`;
      const link = document.createElement('a');
      link.href = dataUri;
      link.download = att.fileName;
      link.click();
    }
  }

  onEmailSent() {
    this.instrumentStateService.clearEmailFallback();
  }
}
