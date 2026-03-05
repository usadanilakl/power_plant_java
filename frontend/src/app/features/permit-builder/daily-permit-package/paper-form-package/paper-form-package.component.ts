import { Component, inject, input } from '@angular/core';
import { DailyPermitPackageDto } from '../../../../models/permits/dailt-permit-package.model';
import { CurrentDailyPermitPackageService } from '../../../../services/current-items-services/current-daily-permit-package.service';
import { SafeWorkPaperFormComponent } from "../../safe-work/safe-work-paper-form/safe-work-paper-form.component";
import { HotWorkPaperFormComponent } from "../../hot-work/hot-work-paper-form/hot-work-paper-form.component";
import { ConfinedSpacePaperFormComponent } from "../../confined-space/confined-space-paper-form/confined-space-paper-form.component";
import { EnergizedWorkPermitPaperFormComponent } from "../../energized-work-permit/energized-work-permit-paper-form/energized-work-permit-paper-form.component";
import { ExcavationPermitPaperFormComponent } from "../../excavation-permit/excavation-permit-paper-form/excavation-permit-paper-form.component";
import { VentingPermitPaperFormComponent } from "../../venting-permit/venting-permit-paper-form/venting-permit-paper-form.component";

@Component({
  selector: 'app-paper-form-package',
  imports: [SafeWorkPaperFormComponent, HotWorkPaperFormComponent, ConfinedSpacePaperFormComponent, EnergizedWorkPermitPaperFormComponent, ExcavationPermitPaperFormComponent, VentingPermitPaperFormComponent],
  templateUrl: './paper-form-package.component.html',
  styleUrl: './paper-form-package.component.css'
})
export class PaperFormPackageComponent {

  currentDailyPermitPackageService = inject(CurrentDailyPermitPackageService);

}
