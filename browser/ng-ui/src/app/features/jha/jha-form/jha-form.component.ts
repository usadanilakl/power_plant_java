import { Component, computed, DestroyRef, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { JhaStateService } from '../jha-state.service';
import { FormField } from '../../../models/inputs/form-field.model';
import { Jha } from '../../../models/permits/jha.model';
import { ReactiveFormComponent } from '../../../shared/forms/reactive-form/reactive-form.component';
import { EmailPromptComponent } from '../../../shared/communication/email-prompt/email-prompt.component';

@Component({
  selector: 'app-jha-form',
  standalone: true,
  imports: [ReactiveFormComponent, EmailPromptComponent, CommonModule],
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

  private defaultFields = computed(() => this.entity()?.toFormFields() ?? []);
  fields = computed(() => this.fieldsInput() ?? this.defaultFields());

  suggestedHazards = this.jhaStateService.suggestedHazards;
  usedSuggestions = signal<Set<string>>(new Set());

  constructor() {
    effect(() => {
      const entity = this.entityInput() ?? this.entityFromState();
      this.entity.set(entity);
    });
    // Reset used suggestions when suggestions change
    effect(() => {
      this.suggestedHazards();
      this.usedSuggestions.set(new Set());
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

  addSuggestionToLastStep(hazardLabel: string) {
    const current = this.entity();
    const steps = [...(current.jobSteps || [])];
    if (steps.length === 0) {
      // Auto-add a step if none exist
      const updated = current.addJobStep();
      steps.push(...updated.jobSteps);
    }
    const lastStep = { ...steps[steps.length - 1] };
    const existing = lastStep.hazard || '';
    // Avoid duplicates in the same step
    if (!existing.toLowerCase().includes(hazardLabel.toLowerCase())) {
      lastStep.hazard = existing ? existing + '; ' + hazardLabel : hazardLabel;
    }
    steps[steps.length - 1] = lastStep;
    const updatedJha = new Jha({ ...current, jobSteps: steps });
    this.entity.set(updatedJha);
    this.jhaStateService.saveDraft(updatedJha);
    this.jhaChanged.emit(updatedJha);

    // Mark as used
    const used = new Set(this.usedSuggestions());
    used.add(hazardLabel);
    this.usedSuggestions.set(used);
  }

  addAllSuggestionsToLastStep() {
    const unused = this.suggestedHazards().filter(h => !this.usedSuggestions().has(h));
    if (unused.length === 0) return;

    const current = this.entity();
    const steps = [...(current.jobSteps || [])];
    if (steps.length === 0) {
      const updated = current.addJobStep();
      steps.push(...updated.jobSteps);
    }
    const lastStep = { ...steps[steps.length - 1] };
    const existing = lastStep.hazard || '';
    const toAdd = unused.filter(h => !existing.toLowerCase().includes(h.toLowerCase()));
    if (toAdd.length > 0) {
      lastStep.hazard = existing ? existing + '; ' + toAdd.join('; ') : toAdd.join('; ');
    }
    steps[steps.length - 1] = lastStep;
    const updatedJha = new Jha({ ...current, jobSteps: steps });
    this.entity.set(updatedJha);
    this.jhaStateService.saveDraft(updatedJha);
    this.jhaChanged.emit(updatedJha);

    const used = new Set(this.suggestedHazards());
    this.usedSuggestions.set(used);
  }

}
