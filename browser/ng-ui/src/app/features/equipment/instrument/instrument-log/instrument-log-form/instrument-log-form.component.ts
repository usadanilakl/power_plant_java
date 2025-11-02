import { Component, computed, DestroyRef, inject, input } from '@angular/core';
import { InstrumentLocalStorageService } from '../../instrument-local-storage.service';
import { InstrumentStateService } from '../../instrument-state.service';
import { FormField } from '../../../../../models/inputs/form-field.model';
import { Instrument } from '../../../../../models/equipment/instrument.model';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormComponent } from "../../../../../shared/forms/reactive-form/reactive-form.component";
import { InstrumentLogEntryLocalStorageService } from '../instrument-log-local-storage.service';
import { InstrumentLogEntry } from '../../../../../models/equipment/instrument-log.model';

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
  destroyRef = inject(DestroyRef);

  entityInput = input<Instrument>();
  fieldsInput = input<FormField[]>();

  private entityFromState = toSignal(this.instrumentStateService.selectedInstrument$, { initialValue: new Instrument() });
  entityInstrument = computed(() => this.entityInput() ?? this.entityFromState());
  entity = computed(() => this.entityInstrument()?.toLogEntry()?? new InstrumentLogEntry());

  private defaultFields = computed(() => this.entity()?.toFormFields() ?? []);
  fields = computed(() => this.fieldsInput() ?? this.defaultFields());

  constructor() { }

  onAnyValueChange(workRequest: Instrument) {
    this.instrumentLocalStorageService.saveDraft(workRequest);
  }

  onSubmit(instrument: Instrument) {
    this.instrumentStateService.submitForm(instrument);
  }

}
