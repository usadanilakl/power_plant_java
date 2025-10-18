import { Component, computed, DestroyRef, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { JhaStateService } from '../jha-state.service';
import { FormField } from '../../../models/inputs/form-field.model';
import { Jha } from '../../../models/permits/jha.model';
import { ReactiveFormComponent } from '../../../shared/forms/reactive-form/reactive-form.component';
import { EmailPromptComponent } from '../../../shared/communication/email-prompt/email-prompt.component';

@Component({
  selector: 'app-jha-form',
  standalone: true,
  imports: [ReactiveFormComponent, EmailPromptComponent],
  templateUrl: './jha-form.component.html',
  styleUrl: './jha-form.component.css'
})
export class JhaFormComponent {

  jhaStateService = inject(JhaStateService);
  destroyRef = inject(DestroyRef);

  entityInput = input<Jha>();
  fieldsInput = input<FormField[]>();

  private entityFromState = toSignal(this.jhaStateService.selectedJha$, { initialValue: new Jha() });
  entity = computed(() => this.entityInput() ?? this.entityFromState());

  private defaultFields = computed(() => this.entity()?.toFormFields() ?? []);
  fields = computed(() => this.fieldsInput() ?? this.defaultFields());

  constructor() { }

  onAnyValueChange(jha: Jha) {
    this.jhaStateService.saveDraft(jha);
  }

  onSubmit(jha: Jha) {
    this.jhaStateService.submitNewRequest(jha);
  }

}
