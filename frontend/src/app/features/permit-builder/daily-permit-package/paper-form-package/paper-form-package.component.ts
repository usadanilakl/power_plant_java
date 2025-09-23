import { Component, inject, input } from '@angular/core';
import { DailyPermitPackageDto } from '../../../../models/permits/dailt-permit-package.model';
import { CurrentDailyPermitPackageService } from '../../../../services/current-items-services/current-daily-permit-package.service';
import { SafeWorkPaperFormComponent } from "../../safe-work/safe-work-paper-form/safe-work-paper-form.component";
import { HotWorkPaperFormComponent } from "../../hot-work/hot-work-paper-form/hot-work-paper-form.component";
import { ConfinedSpacePaperFormComponent } from "../../confined-space/confined-space-paper-form/confined-space-paper-form.component";

@Component({
  selector: 'app-paper-form-package',
  imports: [SafeWorkPaperFormComponent, HotWorkPaperFormComponent, ConfinedSpacePaperFormComponent],
  templateUrl: './paper-form-package.component.html',
  styleUrl: './paper-form-package.component.css'
})
export class PaperFormPackageComponent {

  currentDailyPermitPackageService = inject(CurrentDailyPermitPackageService);

}
