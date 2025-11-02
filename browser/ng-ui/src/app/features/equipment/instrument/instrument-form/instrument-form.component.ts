import { Component, computed, DestroyRef, inject, input } from '@angular/core';
import { InstrumentStateService } from '../instrument-state.service';
import { Instrument } from '../../../../models/equipment/instrument.model';
import { FormField } from '../../../../models/inputs/form-field.model';
import { toSignal } from '@angular/core/rxjs-interop';
import { InstrumentLocalStorageService } from '../instrument-local-storage.service';
import { ReactiveFormComponent } from "../../../../shared/forms/reactive-form/reactive-form.component";

@Component({
  selector: 'app-instrument-form',
  imports: [ReactiveFormComponent],
  templateUrl: './instrument-form.component.html',
  styleUrl: './instrument-form.component.css'
})
export class InstrumentFormComponent {

  instrumentStateService = inject(InstrumentStateService);
  instrumentLocalStorageService = inject(InstrumentLocalStorageService);
  destroyRef = inject(DestroyRef);

  entityInput = input<Instrument>();
  fieldsInput = input<FormField[]>();

  private entityFromState = toSignal(this.instrumentStateService.selectedInstrument$, { initialValue: new Instrument() });
  entity = computed(() => this.entityInput() ?? this.entityFromState());

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
