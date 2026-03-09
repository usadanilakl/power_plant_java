import { Component, computed, DestroyRef, inject, input } from '@angular/core';
import { InstrumentLocalStorageService } from '../../instrument-local-storage.service';
import { InstrumentStateService } from '../../instrument-state.service';
import { FormField } from '../../../../../models/inputs/form-field.model';
import { Instrument } from '../../../../../models/equipment/instrument.model';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormComponent } from "../../../../../shared/forms/reactive-form/reactive-form.component";
import { InstrumentLogEntryLocalStorageService } from '../instrument-log-local-storage.service';
import { InstrumentLogEntry } from '../../../../../models/equipment/instrument-log.model';
import { UserSetupService } from '../../../../../services/user-setup.service';

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
  private userSetupService = inject(UserSetupService);
  destroyRef = inject(DestroyRef);

  entityInput = input<Instrument>();
  fieldsInput = input<FormField[]>();

  private entityFromState = toSignal(this.instrumentStateService.selectedInstrument$, { initialValue: new Instrument() });
  entityInstrument = computed(() => this.entityInput() ?? this.entityFromState());
  entity = computed(() => {
    const baseEntry = this.entityInstrument()?.toLogEntry() ?? new InstrumentLogEntry();
    const draft = this.instrumentLogEntryLocalStorageService.loadDraft();
    const shouldUseDraft = !!draft && draft.instrumentTagNumber === baseEntry.instrumentTagNumber;
    const entry = shouldUseDraft
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

  constructor() { }

  onAnyValueChange(instrumentLog: InstrumentLogEntry) {
    this.instrumentLogEntryLocalStorageService.saveDraft(instrumentLog);
  }

  onSubmit(instrumentLog: InstrumentLogEntry) {
    this.instrumentStateService.submitLogForm(instrumentLog);
  }

}
