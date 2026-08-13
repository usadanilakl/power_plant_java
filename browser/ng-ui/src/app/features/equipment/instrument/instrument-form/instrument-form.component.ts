import { Component, computed, DestroyRef, inject, input, output } from '@angular/core';
import { InstrumentStateService, InstrumentCreateOutcome } from '../instrument-state.service';
import { Instrument } from '../../../../models/equipment/instrument.model';
import { FormField } from '../../../../models/inputs/form-field.model';
import { toSignal } from '@angular/core/rxjs-interop';
import { InstrumentLocalStorageService } from '../instrument-local-storage.service';
import { ReactiveFormComponent } from "../../../../shared/forms/reactive-form/reactive-form.component";
import { take } from 'rxjs';

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
  formTitle = input<string>('Instrumentation Form');
  submitButtonText = input<string>('Submit');

  /** Emitted once the create attempt resolves, so the host can route on to the new instrument. */
  submitted = output<InstrumentCreateOutcome>();

  private entityFromState = toSignal(this.instrumentStateService.selectedInstrument$, { initialValue: new Instrument() });
  entity = computed(() => this.entityInput() ?? this.entityFromState());

  private defaultFields = computed(() => this.entity()?.toFormFields() ?? []);
  fields = computed(() => this.fieldsInput() ?? this.defaultFields());

  constructor() { }

  onAnyValueChange(instrument: Instrument) {
    this.instrumentLocalStorageService.saveDraft(instrument);
  }

  onSubmit(instrument: Instrument) {
    this.instrumentStateService.submitForm(instrument)
      .pipe(take(1))
      .subscribe(outcome => this.submitted.emit(outcome));
  }

}
