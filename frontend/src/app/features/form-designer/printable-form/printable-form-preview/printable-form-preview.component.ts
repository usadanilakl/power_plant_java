import { Component, inject } from '@angular/core';
import { CurrentPrintableFormService } from '../../../../services/forms/current-printable-form.service';
import { CurrentConfinedSpaceService } from '../../../../services/current-items-services/current-confined-space.service';
import { FormRendererComponent } from "../../form-renderer/form-renderer.component";
import { toSignal } from '@angular/core/rxjs-interop';
import { CurrentSafeWorkService } from '../../../../services/current-items-services/current-safe-work.service';
import { PrintableFormDto } from '../../../../models/forms/printable-form.model';
import { map } from 'rxjs';

@Component({
  selector: 'app-printable-form-preview',
  imports: [FormRendererComponent],
  templateUrl: './printable-form-preview.component.html',
  styleUrl: './printable-form-preview.component.css'
})
export class PrintableFormPreviewComponent {
  currentPrintableFormService = inject(CurrentPrintableFormService);
  currentConfinedSpaceServic = inject(CurrentConfinedSpaceService);
  currentSafeWorkService = inject(CurrentSafeWorkService);

  form = toSignal(this.currentPrintableFormService.form$, { initialValue: new PrintableFormDto() });
  data = toSignal(this.currentSafeWorkService.allActiveSafeWorks$.pipe(
    map(works => (works && works.length > 0 ? works[0] : {}))
  ), { initialValue: {} });
  

}
