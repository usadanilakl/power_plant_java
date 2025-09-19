import { Component, inject } from '@angular/core';
import { FormRendererComponent } from "../../../form-designer/form-renderer/form-renderer.component";
import { CurrentConfinedSpaceService } from '../../../../services/current-items-services/current-confined-space.service';
import { PrintableFormDto } from '../../../../models/forms/printable-form.model';
import { toSignal } from '@angular/core/rxjs-interop';
import { ConfinedSpaceDto } from '../../../../models/permits/confined-space.model';

@Component({
  selector: 'app-confined-space-paper-form',
  imports: [FormRendererComponent],
  templateUrl: './confined-space-paper-form.component.html',
  styleUrl: './confined-space-paper-form.component.css'
})
export class ConfinedSpacePaperFormComponent {
  currentConfinedSpaceService = inject(CurrentConfinedSpaceService);

  form = toSignal(this.currentConfinedSpaceService.paperForm$, { initialValue: new PrintableFormDto() });
  data = toSignal(this.currentConfinedSpaceService.selectedConfinedSpace$, { initialValue: new ConfinedSpaceDto() });

  onSubmit(form: ConfinedSpaceDto): void {
    this.currentConfinedSpaceService.createConfinedSpace(form);
  }

}
