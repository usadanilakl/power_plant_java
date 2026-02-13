import { Component, computed, DestroyRef, effect, inject, input, output, signal } from '@angular/core';
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
  jhaChanged = output<Jha>();


  entity = signal<Jha>(new Jha());
  private entityFromState = toSignal(this.jhaStateService.selectedJha$, { initialValue: new Jha() });
  // entity = computed(() => this.entityInput() ?? this.entityFromState());

  private defaultFields = computed(() => this.entity()?.toFormFields() ?? []);
  fields = computed(() => this.fieldsInput() ?? this.defaultFields());

  constructor() {
    // 3. Sync local signal from state service or input
    effect(() => {
      const entity = this.entityInput() ?? this.entityFromState();
      this.entity.set(entity);
    });
  }

  onAnyValueChange(jha: Jha) {
    this.jhaStateService.saveDraft(jha);
    this.jhaChanged.emit(new Jha(jha));
  }

  onSubmit(jha: Jha) {
    this.jhaStateService.submitNewRequest(jha);
  }

  addJobStep(){
    const updatedJha = this.entity().addJobStep();
    this.entity.set(updatedJha);
    this.jhaStateService.saveDraft(updatedJha);
    this.jhaChanged.emit(updatedJha);
  }

}
