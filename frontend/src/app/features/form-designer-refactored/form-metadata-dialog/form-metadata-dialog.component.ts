import { Component, computed, inject, input, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormStateService } from '../services/form-state.service';
import { PrintableFormDto } from '../models/printable-form.model';
import { ReactiveFormComponent } from '../../../shared/reactive-form/reactive-form.component';

@Component({
  selector: 'app-form-metadata-dialog',
  standalone: true,
  imports: [ReactiveFormComponent],
  templateUrl: './form-metadata-dialog.component.html',
  styleUrl: './form-metadata-dialog.component.css',
})
export class FormMetadataDialogComponent {
  private formState = inject(FormStateService);

  private currentForm = toSignal(this.formState.form$, { initialValue: new PrintableFormDto() });
  formInput = input<PrintableFormDto | null>(null);
  form = computed<PrintableFormDto>(() => this.formInput() ?? this.currentForm());

  submitEvent = output<PrintableFormDto>();
  deleteEvent = output<number>();

  fields = PrintableFormDto.toFormFields(new PrintableFormDto());

  onSubmit(form: PrintableFormDto): void {
    this.submitEvent.emit(form);
  }

  onDelete(): void {
    this.deleteEvent.emit(this.form().id);
  }

  copyForm(): void {
    this.formState.copyForm(this.form().id);
  }
}
