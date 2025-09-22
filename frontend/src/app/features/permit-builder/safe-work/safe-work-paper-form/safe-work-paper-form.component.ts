import { Component, EventEmitter, inject, Output } from '@angular/core';
import { CurrentSafeWorkService } from '../../../../services/current-items-services/current-safe-work.service';
import { FormRendererComponent } from "../../../form-designer/form-renderer/form-renderer.component";
import { SafeWorkDto } from '../../../../models/permits/safe-work.model';
import { toSignal } from '@angular/core/rxjs-interop';
import { PrintableFormDto } from '../../../../models/forms/printable-form.model';

@Component({
  selector: 'app-safe-work-paper-form',
  imports: [FormRendererComponent],
  templateUrl: './safe-work-paper-form.component.html',
  styleUrl: './safe-work-paper-form.component.css'
})
export class SafeWorkPaperFormComponent {
  currentSafeWorkService = inject(CurrentSafeWorkService);

  form = toSignal(this.currentSafeWorkService.paperForm$, { initialValue: new PrintableFormDto() });
  data = toSignal(this.currentSafeWorkService.selectedSafeWork$, { initialValue: new SafeWorkDto() });

  @Output() submitEvent = new EventEmitter<SafeWorkDto>();

  onSubmit(form: SafeWorkDto): void {
    if(this.submitEvent.observers.length > 0){
      this.submitEvent.emit(form);
      return;
    }
    this.currentSafeWorkService.createSafeWork(form);
  }


}
