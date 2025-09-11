import { Component, computed, DestroyRef, inject } from '@angular/core';
import { CurrentDailyPermitPackageService } from '../../../services/current-items-services/current-daily-permit-package.service';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { DailyPermitPackageDto } from '../../../models/permits/dailt-permit-package.model';
import { DailyPermitPackageFormComponent } from "./daily-permit-package-form/daily-permit-package-form.component";
import { SafeWorkDto } from '../../../models/permits/safe-work.model';
import { WorkRequestDto } from '../../../models/permits/work-request.model';
import { HotWorkDto } from '../../../models/permits/hot-work.model';
import { ConfinedSpaceDto } from '../../../models/permits/confined-space.model';
import { DailyPermitPackageService } from '../../../services/permits/daily-permit-package.service';

@Component({
  selector: 'app-daily-permit-package',
  standalone: true,
  imports: [DailyPermitPackageFormComponent],
  templateUrl: './daily-permit-package.component.html',
  styleUrl: './daily-permit-package.component.css'
})
export class DailyPermitPackageComponent {

  private currendDailyPermitPackageService = inject(CurrentDailyPermitPackageService);
  private dailyPermitPackageService = inject(DailyPermitPackageService);
  private destroyRef = inject(DestroyRef)
  constructor() { }

  currentDailyPackage = toSignal(this.currendDailyPermitPackageService.selectedDailyPermitPackage$, { initialValue: new DailyPermitPackageDto() });

  safeWork = computed(() => this.currentDailyPackage()?.safeWorks[0]?? new SafeWorkDto());
  workRequest = computed(() => this.currentDailyPackage()?.workRequests[0]?? new WorkRequestDto());
  hotWork = computed<HotWorkDto>(() => this.currentDailyPackage()?.hotWorks[0]?? new HotWorkDto());
  confinedSpace = computed(() => this.currentDailyPackage()?.confinedSpaces[0]?? new ConfinedSpaceDto());

  buildPermits(dailtyPermitPackage: DailyPermitPackageDto) {
    this.dailyPermitPackageService.buildPermits(dailtyPermitPackage).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(response => {
      console.log('Permits built successfully:', response.responseData);
    });
  }
}
