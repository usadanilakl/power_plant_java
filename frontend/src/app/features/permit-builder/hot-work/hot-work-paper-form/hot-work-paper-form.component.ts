import { Component, inject } from '@angular/core';
import { CurrentHotWorkService } from '../../../../services/current-items-services/current-hot-work.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { PrintableFormDto } from '../../../../models/forms/printable-form.model';
import { HotWorkDto } from '../../../../models/permits/hot-work.model';
import { FormRendererComponent } from "../../../form-designer/form-renderer/form-renderer.component";

@Component({
  selector: 'app-hot-work-paper-form',
  imports: [FormRendererComponent],
  templateUrl: './hot-work-paper-form.component.html',
  styleUrl: './hot-work-paper-form.component.css'
})
export class HotWorkPaperFormComponent {
  currentHotWorkService = inject(CurrentHotWorkService);

  form = toSignal(this.currentHotWorkService.paperForm$, { initialValue: new PrintableFormDto() });
  data = toSignal(this.currentHotWorkService.selectedHotWork$, { initialValue: new HotWorkDto() });

  onSubmit(form: HotWorkDto): void {
    this.currentHotWorkService.createHotWork(form);
  }

}
