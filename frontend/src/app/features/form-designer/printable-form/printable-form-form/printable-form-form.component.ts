import { Component, computed, inject, input, output, signal } from '@angular/core';
import { CurrentPrintableFormService } from '../../../../services/forms/current-printable-form.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { PrintableFormDto } from '../../../../models/forms/printable-form.model';
import { ReactiveFormComponent } from "../../../../shared/reactive-form/reactive-form.component";

@Component({
  selector: 'app-printable-form-form',
  standalone: true,
  imports: [ReactiveFormComponent],
  templateUrl: './printable-form-form.component.html',
  styleUrl: './printable-form-form.component.css'
})
export class PrintableFormFormComponent {
  private currentPrintableFormService = inject(CurrentPrintableFormService);

  private currentForm = toSignal(this.currentPrintableFormService.form$, { initialValue: new PrintableFormDto() });
  formInput = input<PrintableFormDto | null>(null);
  form = computed<PrintableFormDto>(() => this.formInput()?? this.currentForm());

  submtEvent = output<PrintableFormDto>();
  deleteEvent = output<number>();

  fields = PrintableFormDto.toFormFields(new PrintableFormDto());

  onSubmit(form: PrintableFormDto): void {
    this.submtEvent.emit(form);
  }

  onDelete(): void {
    this.deleteEvent.emit(this.form().id);
  }

}
