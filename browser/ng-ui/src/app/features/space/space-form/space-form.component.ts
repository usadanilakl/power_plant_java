import { Component, computed, DestroyRef, inject, input, output } from '@angular/core';
import { SpaceStateService } from '../space-state.service';
import { Space } from '../../../models/permits/space.model';
import { FormField } from '../../../models/inputs/form-field.model';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormComponent } from "../../../shared/forms/reactive-form/reactive-form.component";
import { EmailPromptComponent } from "../../../shared/communication/email-prompt/email-prompt.component";

@Component({
  selector: 'app-space-form',
  standalone: true,
  imports: [ReactiveFormComponent, EmailPromptComponent],
  templateUrl: './space-form.component.html',
  styleUrl: './space-form.component.css'
})
export class SpaceFormComponent {

  spaceStateService = inject(SpaceStateService);
  destroyRef = inject(DestroyRef);

  entityInput = input<Space>();
  fieldsInput = input<FormField[]>();
  customSubmit = input<boolean>(false);

  submitEvent = output<Space>();

  private entityFromState = toSignal(this.spaceStateService.selectedSpace$, { initialValue: new Space() });
  entity = computed(() => this.entityInput() ?? this.entityFromState());

  private defaultFields = computed(() => this.entity()?.toFormFields() ?? []);
  fields = computed(() => this.fieldsInput() ?? this.defaultFields());

  constructor() { }

  onAnyValueChange(space: Space) {
    this.spaceStateService.saveDraft(space);
  }

  onSubmit(space: Space) {
    if(this.customSubmit()) {
      this.submitEvent.emit(space);
    }else{
      this.spaceStateService.submitNewTest(space);
    }
  }

  
}